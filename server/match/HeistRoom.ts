import { Room, type Client } from "colyseus";
import {
  COMMAND_CODES,
  drawRoles,
  MATCH_LIMITS,
  parseInputFrame,
  type InputFrame,
  type MatchMode,
  type PlayerRole,
} from "../../packages/contracts/src";
import {
  hasLineOfSight,
  spawnPlayer,
  stepPlayer,
  type SimulationWorld,
} from "../../packages/sim/src";
import {
  DOORS,
  KEYCARD_POSITION,
  KEYPAD_POSITION,
} from "../../packages/sim/src/layout";
import {
  CAMERAS,
  ESCAPE_Z,
  MARKERS,
  PATROLS,
  roomAt,
} from "../../app/game/level";
import type { Snapshot } from "../../app/game/net/types";
import { MatchState, PublicPlayer, type MatchState as MatchStateValue } from "./schema";

interface RoomMessages {
  input: InputFrame;
  start: void;
  discover: { itemId: string };
  command: { command: (typeof COMMAND_CODES)[number] };
}

interface ClientData {
  name: string;
}

type HeistClient = Client<{
  messages: RoomMessages & {
    role: { role: PlayerRole; watching: string | null };
    error: { code: "not-ready" | "already-started" };
    discover: { itemId: string; by: string };
    command: { command: (typeof COMMAND_CODES)[number]; by: string; t: number };
    world: Snapshot;
  };
  userData: ClientData;
}>;

interface CreateOptions {
  code?: unknown;
  mode?: unknown;
  maxPlayers?: unknown;
  seed?: unknown;
}

interface JoinOptions {
  name?: unknown;
}

interface PlayerRuntime {
  name: string;
  role: PlayerRole | null;
  watching: string | null;
  input: InputFrame | null;
  lastInputSeq: number;
  connected: boolean;
  rejoinUntil: number;
}

interface GuardRuntime {
  x: number;
  z: number;
  yaw: number;
  waypoint: number;
  wait: number;
}

type LogTone = Snapshot["log"][number]["tone"];

const TICK_RATE = 30;
const COUNTDOWN_MS = 10_000;
const REJOIN_SECONDS = 20;
const REJOIN_MS = REJOIN_SECONDS * 1000;
const WATCHABLE = ["lobby", "sec", "vault"] as const;
const KEYCARD_PICKUP_RADIUS = 1.1;
const DOOR_OPEN_RADIUS = 2.1;
const KEYPAD_RADIUS = 2.2;
const MED_PICKUP_RADIUS = 1;
const VALUABLES_PICKUP_RADIUS = 1.45;
const VAULT_LOOT_PICKUP_RADIUS = 1.9;
const TRAP_RADIUS = 1.5;
const VENT_RADIUS = 2.6;
const ALARM_RADIUS = 2.2;
const TICK_NEUTRAL_INPUT: InputFrame = {
  seq: 0,
  moveX: 0,
  moveZ: 0,
  yaw: 0,
  run: false,
  jump: false,
  interact: false,
};

const markerXZ = (id: string) => {
  const marker = MARKERS.find((candidate) => candidate.id === id);
  if (!marker) throw new Error(`missing marker: ${id}`);
  return { x: marker.position[0], z: marker.position[2] };
};

const HEALTH_POSITION = markerXZ("health");
const BANDAGES_POSITION = markerXZ("bandages");
const TRAP_POSITIONS = {
  "sec-trap": markerXZ("sec-trap"),
  "vault-trap": markerXZ("vault-trap"),
} as const;
const ALARM_POSITION = markerXZ("alarm");
const VALUABLES_POSITION = markerXZ("valuables");
const VAULT_LOOT_POSITION = markerXZ("vault-loot");
const VENT_POSITION = markerXZ("vault-vent");

const DISCOVERABLES = new Map(
  [...MARKERS.filter((marker) => marker.reveal === "discovery"),
    ...CAMERAS.filter((camera) => camera.reveal === "discovery")].map((def) => [
    def.id,
    def,
  ] as const),
);

const asMode = (value: unknown): MatchMode =>
  value === "crowd" ? "crowd" : "crew";

const asSeed = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value)
    ? value >>> 0
    : Math.floor(Math.random() * 0xffffffff) >>> 0;

const playerName = (value: unknown, fallback: string) => {
  const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return (name || fallback).slice(0, 16);
};

const toSchemaPlayer = (id: string, name: string) => {
  const player = new PublicPlayer();
  player.assign(spawnPlayer(id, name));
  player.connected = true;
  player.rejoinUntil = 0;
  return player;
};

export class HeistRoom extends Room<{
  state: MatchStateValue;
  metadata: { code: string; mode: MatchMode };
  client: HeistClient;
}> {
  private mode: MatchMode = "crew";
  private seed = 0;
  private hostSessionId = "";
  private readonly runtimePlayers = new Map<string, PlayerRuntime>();
  private readonly guards = new Map<string, GuardRuntime>();
  private readonly collected = new Set<string>();
  private readonly discovered = new Set<string>();
  private readonly trapHits = new Map<string, number>();
  private log: Snapshot["log"] = [];
  private logSequence = 0;
  private elapsedSeconds = 0;
  private snapshotAccumulator = 0;
  private damageAccumulator = 0;

  onCreate(options: CreateOptions = {}) {
    this.mode = asMode(options.mode);
    this.seed = asSeed(options.seed);

    const limits = MATCH_LIMITS[this.mode];
    const requestedPlayers =
      typeof options.maxPlayers === "number" && Number.isSafeInteger(options.maxPlayers)
        ? options.maxPlayers
        : limits.maxPlayers;
    const maxPlayers = Math.min(
      limits.maxPlayers,
      Math.max(limits.minPlayers, requestedPlayers),
    );
    this.maxClients = maxPlayers;
    this.patchRate = 50;
    this.maxMessagesPerSecond = 120;

    const state = new MatchState();
    state.code = typeof options.code === "string" ? options.code : "";
    state.mode = this.mode;
    state.maxPlayers = maxPlayers;
    state.seed = this.seed;
    state.createdAt = Date.now();
    this.setState(state);
    this.metadata = { code: state.code, mode: this.mode };

    for (const patrol of PATROLS) {
      this.guards.set(patrol.id, {
        x: patrol.path[0][0],
        z: patrol.path[0][1],
        yaw: 0,
        waypoint: 0,
        wait: 0,
      });
    }

    this.onMessage<InputFrame>("input", (client, message) => {
      this.receiveInput(client, message);
    });
    this.onMessage("start", (client) => {
      this.startMatch(client);
    });
    this.onMessage<{ itemId?: unknown }>("discover", (client, message) => {
      this.receiveDiscovery(client, message);
    });
    this.onMessage<{ command?: unknown }>("command", (client, message) => {
      this.receiveCommand(client, message);
    });

    this.setFixedTimestep((context) => {
      this.step(context.dt);
    }, TICK_RATE);
  }

  onJoin(client: HeistClient, options: JoinOptions = {}) {
    if (this.state.phase !== "lobby") throw new Error("match already started");

    const name = playerName(options.name, `Player-${client.sessionId.slice(0, 4)}`);
    client.userData = { name };
    if (!this.hostSessionId) this.hostSessionId = client.sessionId;

    this.runtimePlayers.set(client.sessionId, {
      name,
      role: null,
      watching: null,
      input: null,
      lastInputSeq: -1,
      connected: true,
      rejoinUntil: 0,
    });
    this.state.players.set(client.sessionId, toSchemaPlayer(client.sessionId, name));
    this.state.hostId = this.hostSessionId;

    if (
      this.state.phase === "lobby" &&
      this.runtimePlayers.size >= this.state.maxPlayers
    ) {
      this.beginCountdown();
    }
  }

  async onDrop(client: HeistClient) {
    const runtime = this.runtimePlayers.get(client.sessionId);
    if (!runtime || this.state.phase !== "playing") return;

    runtime.connected = false;
    runtime.rejoinUntil = Date.now() + REJOIN_MS;
    this.setConnectionState(client.sessionId, false, runtime.rejoinUntil);

    try {
      await this.allowReconnection(client, REJOIN_SECONDS);
    } catch {
      // Colyseus invokes onLeave after the reconnection reservation expires.
    }
  }

  onReconnect(client: HeistClient) {
    const runtime = this.runtimePlayers.get(client.sessionId);
    if (!runtime) return;
    runtime.connected = true;
    runtime.rejoinUntil = 0;
    this.setConnectionState(client.sessionId, true, 0);
    if (runtime.role) {
      client.send("role", { role: runtime.role, watching: runtime.watching });
    }
    this.publishWorld();
  }

  onLeave(client: HeistClient) {
    const runtime = this.runtimePlayers.get(client.sessionId);
    if (!runtime) return;
    this.runtimePlayers.delete(client.sessionId);
    this.state.players.delete(client.sessionId);

    if (this.state.phase === "playing") {
      this.state.phase = "ended";
      this.state.startsAt = 0;
      this.state.result = runtime.role === "thief" ? "thief-left" : "spectator-left";
      this.state.serverTime = Date.now();
      this.publishWorld();
    } else if (
      this.state.phase === "countdown" &&
      this.runtimePlayers.size < this.state.maxPlayers
    ) {
      this.state.phase = "lobby";
      this.state.startsAt = 0;
    }

    if (this.hostSessionId === client.sessionId) {
      this.hostSessionId = this.runtimePlayers.keys().next().value ?? "";
      this.state.hostId = this.hostSessionId;
    }
  }

  private setConnectionState(sessionId: string, connected: boolean, rejoinUntil: number) {
    const player = this.state.players.get(sessionId);
    if (!player) return;
    player.connected = connected;
    player.rejoinUntil = rejoinUntil;
  }

  private receiveInput(client: HeistClient, rawMessage: unknown) {
    const runtime = this.runtimePlayers.get(client.sessionId);
    if (!runtime || runtime.role !== "thief") return;

    const input = parseInputFrame(rawMessage);
    if (!input || input.seq <= runtime.lastInputSeq) return;

    runtime.lastInputSeq = input.seq;
    runtime.input = input;
  }

  private startMatch(client: HeistClient) {
    if (client.sessionId !== this.hostSessionId) return;
    if (this.state.phase === "playing" || this.state.phase === "ended") {
      client.send("error", { code: "already-started" });
      return;
    }

    if (this.runtimePlayers.size < this.state.maxPlayers) {
      client.send("error", { code: "not-ready" });
      return;
    }

    this.activateMatch();
  }

  private beginCountdown() {
    if (
      this.state.phase !== "lobby" ||
      this.runtimePlayers.size < this.state.maxPlayers
    )
      return;

    this.state.phase = "countdown";
    this.state.startsAt = Date.now() + COUNTDOWN_MS;
    this.state.serverTime = Date.now();
  }

  private activateMatch() {
    if (this.state.phase !== "lobby" && this.state.phase !== "countdown") return;

    const roles = drawRoles([...this.runtimePlayers.keys()], this.seed);
    let spectatorIndex = 0;
    for (const [sessionId, runtime] of this.runtimePlayers) {
      runtime.role = roles.get(sessionId) ?? "spectator";
      runtime.watching =
        runtime.role === "spectator"
          ? WATCHABLE[spectatorIndex++ % WATCHABLE.length]
          : null;
      if (runtime.role === "thief") this.state.thiefId = sessionId;
      const joined = this.clients.find((candidate) => candidate.sessionId === sessionId);
      joined?.send("role", { role: runtime.role, watching: runtime.watching });
    }

    this.state.phase = "playing";
    this.state.startsAt = 0;
    this.state.serverTime = Date.now();
  }

  private receiveDiscovery(client: HeistClient, message: { itemId?: unknown }) {
    const runtime = this.runtimePlayers.get(client.sessionId);
    const itemId = typeof message?.itemId === "string" ? message.itemId.trim() : "";
    if (
      this.state.phase !== "playing" ||
      runtime?.role !== "spectator" ||
      !itemId ||
      itemId.length > 64
    )
      return;

    const thief = this.state.players.get(this.state.thiefId);
    const definition = DISCOVERABLES.get(itemId);
    if (!thief || !definition || runtime.watching !== thief.area) return;
    if (this.discovered.has(itemId)) return;

    this.discovered.add(itemId);
    this.state.score += 50;
    if (itemId === "note") this.state.codeFound = true;
    this.pushLog(`Discovered: ${definition.label}`, "good");
    if (itemId === "note") this.pushLog("Vault code relayed to the thief: 4-7-1-2", "good");
    this.broadcast("discover", { itemId, by: client.sessionId });
    this.publishWorld();
  }

  private receiveCommand(client: HeistClient, message: { command?: unknown }) {
    const runtime = this.runtimePlayers.get(client.sessionId);
    const command = message?.command;
    if (
      this.state.phase !== "playing" ||
      runtime?.role !== "spectator" ||
      typeof command !== "string" ||
      !(COMMAND_CODES as readonly string[]).includes(command)
    )
      return;

    const thief = this.state.players.get(this.state.thiefId);
    if (!thief || runtime.watching !== thief.area) return;
    this.broadcast("command", {
      command: command as (typeof COMMAND_CODES)[number],
      by: client.sessionId,
      t: Date.now(),
    });
  }

  private pushLog(text: string, tone: LogTone) {
    this.log = [{ id: ++this.logSequence, text, tone }, ...this.log].slice(0, 6);
  }

  private collect(
    player: PublicPlayer,
    id: string,
    label: string,
    value = 0,
    heal = 0,
  ) {
    if (this.collected.has(id)) return;
    this.collected.add(id);
    if (id === "keycard") this.state.keycard = true;
    if (value > 0) {
      this.state.loot += value;
      this.state.score += value;
    }
    if (heal > 0) player.hp = Math.min(100, player.hp + heal);
    this.pushLog(`Picked up: ${label}`, "good");
  }

  private endRun(result: "escaped" | "down") {
    if (this.state.phase !== "playing") return;
    this.state.phase = "ended";
    this.state.result = result;
    this.state.serverTime = Date.now();
    this.publishWorld();
  }

  private damagePlayer(
    player: PublicPlayer,
    amount: number,
    reason: string,
    announce = true,
  ) {
    const next = Math.max(0, Math.floor(player.hp - amount));
    if (next === player.hp) return;
    player.hp = next;
    if (announce) this.pushLog(`-${Math.round(amount)} HP - ${reason}`, "bad");
    if (next === 0) {
      this.pushLog("The thief is down. Run has ended.", "bad");
      this.endRun("down");
    }
  }

  private escape(player: PublicPlayer, via: "entrance" | "vent") {
    if (this.state.phase !== "playing" || player.hp <= 0) return;
    const withLoot = this.collected.has("vault-loot");
    this.state.escaped = true;
    this.state.escapedVia = via;
    this.state.score += withLoot ? 500 : 200;
    this.pushLog(
      via === "vent"
        ? withLoot
          ? "Into the vent with the vault contents. Clean getaway."
          : "Into the vent and out of the building. You got out."
        : "Out of the building with the loot. Run complete.",
      "good",
    );
    this.endRun("escaped");
  }

  private updateInteractions(player: PublicPlayer, input: InputFrame) {
    if (this.state.phase !== "playing" || player.hp <= 0) return;

    if (
      Math.hypot(player.x - KEYCARD_POSITION.x, player.z - KEYCARD_POSITION.z) <=
      KEYCARD_PICKUP_RADIUS
    ) {
      this.collect(player, "keycard", "Keycard");
    }
    if (
      Math.hypot(player.x - HEALTH_POSITION.x, player.z - HEALTH_POSITION.z) <=
      MED_PICKUP_RADIUS
    ) {
      this.collect(player, "health", "Health pack", 0, 30);
    }
    if (
      Math.hypot(player.x - BANDAGES_POSITION.x, player.z - BANDAGES_POSITION.z) <=
      MED_PICKUP_RADIUS
    ) {
      this.collect(player, "bandages", "Bandages", 0, 20);
    }
    if (
      Math.hypot(player.x - VALUABLES_POSITION.x, player.z - VALUABLES_POSITION.z) <=
      VALUABLES_PICKUP_RADIUS
    ) {
      this.collect(player, "valuables", "Valuables", 150);
    }
    if (
      this.state.vaultOpen &&
      Math.hypot(player.x - VAULT_LOOT_POSITION.x, player.z - VAULT_LOOT_POSITION.z) <=
      VAULT_LOOT_PICKUP_RADIUS
    ) {
      this.collect(player, "vault-loot", "the vault contents", 500);
    }

    for (const door of DOORS) {
      if (door.lock && !this.state.keycard) continue;
      if (
        Math.hypot(player.x - door.at[0], player.z - door.at[2]) >
        DOOR_OPEN_RADIUS
      )
        continue;

      if (door.id === "door-sec") this.state.doorSecOpen = true;
      if (door.id === "door-vault") this.state.doorVaultOpen = true;
    }

    if (
      input.interact &&
      !this.state.vaultOpen &&
      (this.state.keycard || this.state.codeFound) &&
      Math.hypot(player.x - KEYPAD_POSITION.x, player.z - KEYPAD_POSITION.z) <=
      KEYPAD_RADIUS
    ) {
      this.state.vaultOpen = true;
      this.state.ventOpen = true;
      this.state.score += 250;
      this.pushLog(
        this.state.codeFound
          ? "Keypad accepted 4-7-1-2. Vault open, extraction vent released."
          : "Keycard accepted. Vault open, extraction vent released.",
        "good",
      );
      this.pushLog("The vent on the east wall is your way out.", "info");
    }

    if (
      input.interact &&
      !this.state.alarmDisabled &&
      Math.hypot(player.x - ALARM_POSITION.x, player.z - ALARM_POSITION.z) <=
      ALARM_RADIUS
    ) {
      this.state.alarmDisabled = true;
      this.state.alarm = 0;
      this.state.spotted = false;
      this.state.score += 100;
      this.pushLog("Alarm panel disabled. Cameras are blind now.", "good");
    }

    const ventFound = this.state.ventOpen || this.discovered.has("vault-vent");
    if (
      input.jump &&
      ventFound &&
      Math.hypot(player.x - VENT_POSITION.x, player.z - VENT_POSITION.z) <=
      VENT_RADIUS
    ) {
      this.escape(player, "vent");
      return;
    }

    for (const [id, position] of Object.entries(TRAP_POSITIONS)) {
      if (Math.hypot(player.x - position.x, player.z - position.z) > TRAP_RADIUS)
        continue;
      const lastHit = this.trapHits.get(id) ?? -Infinity;
      if (this.elapsedSeconds - lastHit < 2) continue;
      this.trapHits.set(id, this.elapsedSeconds);
      this.damagePlayer(player, 25, "floor trap");
      if (this.state.phase !== "playing") return;
    }

    if (this.collected.has("vault-loot") && player.z > ESCAPE_Z)
      this.escape(player, "entrance");
  }

  private updateGuards(deltaSeconds: number, player: PublicPlayer) {
    this.elapsedSeconds += deltaSeconds;
    for (const patrol of PATROLS) {
      const guard = this.guards.get(patrol.id);
      if (!guard) continue;
      const target = patrol.path[guard.waypoint];
      const dx = target[0] - guard.x;
      const dz = target[1] - guard.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.35) {
        guard.wait += deltaSeconds;
        if (guard.wait > 1.1) {
          guard.wait = 0;
          guard.waypoint = (guard.waypoint + 1) % patrol.path.length;
        }
        continue;
      }

      const step = Math.min(distance, 1.5 * deltaSeconds);
      guard.x += (dx / distance) * step;
      guard.z += (dz / distance) * step;
      guard.yaw = Math.atan2(dx, dz) + Math.PI;
    }

    this.updateThreats(deltaSeconds, player);
  }

  private cameraYaw(camera: (typeof CAMERAS)[number]) {
    return camera.baseYaw + Math.sin(this.elapsedSeconds * camera.speed) * camera.sweep;
  }

  private canSee(
    x: number,
    z: number,
    yaw: number,
    range: number,
    fov: number,
    player: PublicPlayer,
    world: SimulationWorld,
  ) {
    const dx = player.x - x;
    const dz = player.z - z;
    const distance = Math.hypot(dx, dz);
    if (distance > range) return false;
    if (distance < 0.01) return true;
    if (!hasLineOfSight(x, z, player.x, player.z, world)) return false;
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    return (dx * forwardX + dz * forwardZ) / distance >= Math.cos(fov);
  }

  private updateThreats(deltaSeconds: number, player: PublicPlayer) {
    const currentRoom = roomAt(player.x, player.z);
    const world = this.collisionWorld();
    let seen = false;
    let nearGuard = false;

    for (const patrol of PATROLS) {
      if (patrol.room !== currentRoom) continue;
      const guard = this.guards.get(patrol.id);
      if (!guard) continue;
      const distance = Math.hypot(player.x - guard.x, player.z - guard.z);
      if (distance < 1.7) nearGuard = true;
      if (
        distance < 1.7 ||
        this.canSee(
          guard.x,
          guard.z,
          guard.yaw,
          patrol.vision.range,
          patrol.vision.fov,
          player,
          world,
        )
      ) {
        seen = true;
      }
    }

    if (!this.state.alarmDisabled) {
      for (const camera of CAMERAS) {
        if (camera.room !== currentRoom) continue;
        if (
          this.canSee(
            camera.position[0],
            camera.position[2],
            this.cameraYaw(camera),
            camera.range,
            camera.fov,
            player,
            world,
          )
        ) {
          seen = true;
          break;
        }
      }
    }

    this.state.spotted = seen;
    this.state.alarm = Math.min(
      100,
      Math.max(0, this.state.alarm + (seen ? 22 : -20) * deltaSeconds),
    );

    const damageRate =
      (this.state.alarm >= 100 ? 5 : 0) + (nearGuard ? 8 : 0);
    if (damageRate <= 0) {
      this.damageAccumulator = 0;
      return;
    }

    this.damageAccumulator += damageRate * deltaSeconds;
    const damage = Math.floor(this.damageAccumulator);
    if (damage <= 0) return;
    this.damageAccumulator -= damage;
    this.damagePlayer(player, damage, "security pressure", false);
  }

  private collisionWorld(): SimulationWorld {
    const doorsOpen = new Set<string>();
    if (this.state.doorSecOpen) doorsOpen.add("door-sec");
    if (this.state.doorVaultOpen) doorsOpen.add("door-vault");
    return {
      keycard: this.state.keycard,
      doorsOpen,
      vaultOpen: this.state.vaultOpen,
    };
  }

  private snapshotFor(runtime: PlayerRuntime): Snapshot | null {
    const thief = this.state.players.get(this.state.thiefId);
    if (!thief) return null;

    const spectatorRoom = runtime.role === "spectator" ? runtime.watching : null;
    const guards: Snapshot["guards"] = {};
    const cams: Snapshot["cams"] = {};
    if (spectatorRoom) {
      for (const patrol of PATROLS) {
        if (patrol.room !== spectatorRoom) continue;
        const guard = this.guards.get(patrol.id);
        if (guard) guards[patrol.id] = [guard.x, guard.z, guard.yaw];
      }
      for (const camera of CAMERAS) {
        if (camera.room === spectatorRoom) cams[camera.id] = this.cameraYaw(camera);
      }
    }

    const escapedVia =
      this.state.escapedVia === "entrance" || this.state.escapedVia === "vent"
        ? this.state.escapedVia
        : null;
    const currentRoom = roomAt(thief.x, thief.z);
    return {
      t: this.state.serverTime || Date.now(),
      thief: [thief.x, thief.y, thief.z, thief.yaw],
      room: currentRoom,
      hp: thief.hp,
      alarm: this.state.alarm,
      spotted: this.state.spotted,
      guards,
      cams,
      keycard: this.state.keycard,
      codeFound: this.state.codeFound,
      vaultOpen: this.state.vaultOpen,
      ventOpen: this.state.ventOpen,
      alarmDisabled: this.state.alarmDisabled,
      escaped: this.state.escaped,
      escapedVia,
      down: this.state.result === "down" || thief.hp <= 0,
      loot: this.state.loot,
      score: this.state.score,
      collected: [...this.collected],
      discovered: spectatorRoom ? [...this.discovered] : [],
      doorsOpen: [
        ...(this.state.doorSecOpen ? ["door-sec"] : []),
        ...(this.state.doorVaultOpen ? ["door-vault"] : []),
      ],
      explored: spectatorRoom ? [currentRoom] : [],
      log: this.log,
    };
  }

  private publishWorld() {
    for (const [sessionId, runtime] of this.runtimePlayers) {
      const client = this.clients.find((candidate) => candidate.sessionId === sessionId);
      const snapshot = this.snapshotFor(runtime);
      if (client && snapshot) client.send("world", snapshot);
    }
  }

  private step(deltaSeconds: number) {
    if (this.state.phase === "countdown") {
      if (this.state.startsAt <= 0 || Date.now() < this.state.startsAt) return;
      this.activateMatch();
    }
    if (this.state.phase !== "playing") return;

    const thiefRuntime = [...this.runtimePlayers.entries()].find(
      ([, runtime]) => runtime.role === "thief",
    );
    if (!thiefRuntime) return;
    const [sessionId, runtime] = thiefRuntime;
    const current = this.state.players.get(sessionId);
    if (!current || !runtime.connected) return;

    const input = runtime.input ?? { ...TICK_NEUTRAL_INPUT, yaw: current.yaw };
    this.updateInteractions(current, input);
    if (this.state.phase !== "playing") return;

    const next = stepPlayer(
      {
        id: current.id,
        name: current.name,
        x: current.x,
        y: current.y,
        z: current.z,
        yaw: current.yaw,
        hp: current.hp,
        area: current.area,
      },
      input,
      deltaSeconds,
      undefined,
      this.collisionWorld(),
    );
    current.assign(next);
    this.updateInteractions(current, input);
    if (this.state.phase !== "playing") return;

    this.updateGuards(deltaSeconds, current);
    if (this.state.phase !== "playing") return;

    this.state.tick += 1;
    this.state.serverTime = Date.now();
    this.snapshotAccumulator += deltaSeconds;
    if (this.snapshotAccumulator >= 1 / 12) {
      this.snapshotAccumulator = 0;
      this.publishWorld();
    }
  }
}
