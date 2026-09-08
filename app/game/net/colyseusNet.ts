"use client";

import { Client as ColyseusClient, type Room as ColyseusRoom } from "@colyseus/sdk";
import {
  COMMAND_CODES,
  type CommandCode,
  type InputFrame,
  type PlayerRole,
} from "../../../packages/contracts/src";
import {
  MatchState,
  type MatchState as MatchStateValue,
} from "../../../server/match/schema";
import type { RoomId } from "../level";
import type {
  JoinFailure,
  NetClient,
  NetMessage,
  Phase,
  PlayerInfo,
  RoomState,
  Snapshot,
  StartResult,
} from "./types";

const MATCH_PHASES: readonly Phase[] = ["lobby", "countdown", "playing", "ended"];
const ROOM_IDS: readonly RoomId[] = [
  "outside",
  "entry",
  "lobby",
  "wcorr",
  "ecorr",
  "sec",
  "vault",
  "annex",
];

type PublicPlayer = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  area: string;
  connected: boolean;
  rejoinUntil: number;
};

type ColyseusRoomDefinition = {
  "~state": MatchStateValue;
  "~client": {
    "~messages": {
      role: { role: PlayerRole; watching: string | null };
      error: { code: string };
      discover: { itemId: string; by: string };
      command: { command: CommandCode; by: string; t: number };
      world: Snapshot;
    };
  };
  messages: {
    input: InputFrame;
    start: void;
    discover: { itemId: string };
    command: { command: CommandCode };
  };
};

type ColyseusMatchRoom = ColyseusRoom<ColyseusRoomDefinition, MatchStateValue>;

const phase = (value: string): Phase =>
  MATCH_PHASES.includes(value as Phase) ? (value as Phase) : "lobby";

const roomId = (value: string): RoomId =>
  ROOM_IDS.includes(value as RoomId) ? (value as RoomId) : "outside";

const joinFailure = (error: unknown): JoinFailure => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("full")) return "full";
  if (message.includes("no available") || message.includes("not found")) return "notfound";
  if (message.includes("timed out") || message.includes("timeout")) return "timeout";
  return "connection";
};

const isRole = (value: unknown): value is PlayerRole =>
  value === "thief" || value === "spectator";

const isCommand = (value: unknown): value is CommandCode =>
  typeof value === "string" && (COMMAND_CODES as readonly string[]).includes(value);

const reconnectKey = (code: string) => `heist:colyseus:reconnect:${code}`;

const readReconnectToken = (code: string) => {
  try {
    return sessionStorage.getItem(reconnectKey(code));
  } catch {
    return null;
  }
};

const writeReconnectToken = (code: string, token: string) => {
  try {
    sessionStorage.setItem(reconnectKey(code), token);
  } catch {
    // Storage is optional; the live connection still works without it.
  }
};

const clearReconnectToken = (code: string) => {
  try {
    sessionStorage.removeItem(reconnectKey(code));
  } catch {
    // Storage is optional.
  }
};

/** Colyseus transport for authoritative matches. SpacetimeDB remains the default during migration. */
export class ColyseusNet implements NetClient {
  readonly kind = "server" as const;
  private client: ColyseusClient | null = null;
  private room: ColyseusMatchRoom | null = null;
  private code = "";
  private sessionId = "";
  private playerName = "";
  private role: PlayerRole | null = null;
  private watching: RoomId | null = null;
  private roomSignature = "";
  private listeners = new Set<(message: NetMessage) => void>();
  lastError = "";

  async connect(code: string): Promise<void> {
    const previousRoom = this.room;
    this.room = null;
    this.client = null;
    this.role = null;
    this.watching = null;
    this.sessionId = "";
    this.roomSignature = "";
    if (previousRoom) void previousRoom.leave(true).catch(() => {});
    this.code = code;
    const configuredEndpoint = process.env.NEXT_PUBLIC_COLYSEUS_URL?.trim();
    const endpoint =
      configuredEndpoint ||
      (process.env.NODE_ENV === "development" ? "http://localhost:2567" : "");
    if (!endpoint) {
      throw new Error("NEXT_PUBLIC_COLYSEUS_URL is required for production matches");
    }
    this.client = new ColyseusClient(endpoint);
  }

  private attach(room: ColyseusMatchRoom) {
    this.room = room;
    this.sessionId = room.sessionId;
    if (room.reconnectionToken) writeReconnectToken(this.code, room.reconnectionToken);
    this.role = null;
    this.watching = null;
    this.roomSignature = "";

    room.onStateChange((state) => {
      if (this.room !== room) return;
      this.notifyRoom(state);
    });
    room.onMessage("role", (message: { role?: unknown; watching?: unknown }) => {
      if (!isRole(message?.role)) return;
      this.role = message.role;
      this.watching =
        typeof message.watching === "string" ? roomId(message.watching) : null;
      this.notifyRoom(room.state);
    });
    room.onMessage("discover", (message: { itemId?: unknown; by?: unknown }) => {
      if (typeof message?.itemId !== "string" || typeof message.by !== "string") return;
      this.emit({ type: "discover", itemId: message.itemId, by: message.by });
    });
    room.onMessage(
      "command",
      (message: { command?: unknown; by?: unknown; t?: unknown }) => {
        if (!isCommand(message?.command) || typeof message.by !== "string") return;
        this.emit({
          type: "command",
          command: message.command,
          by: message.by,
          t: typeof message.t === "number" ? message.t : Date.now(),
        });
      },
    );
    room.onMessage("error", (message: { code?: unknown }) => {
      this.lastError = typeof message?.code === "string" ? message.code : "room-error";
    });
    room.onMessage("world", (snapshot: Snapshot) => {
      if (this.room !== room || !snapshot || typeof snapshot.t !== "number") return;
      this.emit({ type: "world", snap: snapshot });
    });
    room.onError((_code, message) => {
      this.lastError = message ?? "room connection error";
    });
  }

  private async reconnectExisting(): Promise<ColyseusMatchRoom | null> {
    const token = readReconnectToken(this.code);
    if (!token || !this.client) return null;
    try {
      return (await this.client.reconnect(token, MatchState)) as unknown as ColyseusMatchRoom;
    } catch {
      clearReconnectToken(this.code);
      return null;
    }
  }

  private emit(message: NetMessage) {
    for (const listener of this.listeners) listener(message);
  }

  private waitForReadyState(room: ColyseusMatchRoom): Promise<MatchStateValue> {
    const ready = (state: MatchStateValue) =>
      state.code.length > 0 && state.hostId.length > 0 && state.players.size > 0;
    if (ready(room.state)) return Promise.resolve(room.state);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        room.onStateChange.remove(onState);
        reject(new Error("timed out waiting for room state"));
      }, 5000);
      const onState = (state: MatchStateValue) => {
        if (!ready(state)) return;
        clearTimeout(timeout);
        room.onStateChange.remove(onState);
        resolve(state);
      };
      room.onStateChange(onState);
    });
  }

  private statePlayers(state: MatchStateValue): Iterable<[string, PublicPlayer]> {
    return state.players as unknown as Iterable<[string, PublicPlayer]>;
  }

  private toRoomState(state: MatchStateValue): RoomState {
    const players: PlayerInfo[] = [];
    for (const [id, player] of this.statePlayers(state)) {
      const own = id === this.sessionId;
      players.push({
        id,
        name: player.name,
        role: own ? this.role : null,
        watching: own ? this.watching : null,
        joinedAt: state.createdAt,
        connected: player.connected,
        rejoinUntil: player.rejoinUntil,
      });
    }

    return {
      code: state.code || this.code,
      hostId: state.hostId,
      maxPlayers: state.maxPlayers,
      phase: phase(state.phase),
      startsAt: state.startsAt > 0 ? state.startsAt : null,
      players,
      createdAt: state.createdAt,
      seed: state.seed,
      result:
        state.result === "escaped" ||
        state.result === "down" ||
        state.result === "thief-left" ||
        state.result === "spectator-left"
          ? state.result
          : null,
    };
  }

  private notifyRoom(state: MatchStateValue) {
    const room = this.toRoomState(state);
    const signature = JSON.stringify({
      code: room.code,
      hostId: room.hostId,
      phase: room.phase,
      startsAt: room.startsAt,
      result: room.result,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        role: player.role,
        watching: player.watching,
        connected: player.connected,
        rejoinUntil: player.rejoinUntil,
      })),
    });
    if (signature === this.roomSignature) return;
    this.roomSignature = signature;
    this.emit({ type: "room", room });
  }

  async createRoom(room: RoomState, player?: PlayerInfo): Promise<RoomState | null> {
    if (!this.client) return null;
    this.playerName = player?.name ?? this.playerName;
    try {
      const restored = await this.reconnectExisting();
      const joined = restored ?? (await this.client.create(
        "heist",
        {
          code: room.code,
          mode: "crew",
          maxPlayers: room.maxPlayers,
          seed: room.seed,
          name: this.playerName,
        },
        MatchState,
      ));
      this.attach(joined as unknown as ColyseusMatchRoom);
      const state = await this.waitForReadyState(this.room!);
      return this.toRoomState(state);
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      return null;
    }
  }

  async join(
    code: string,
    player: PlayerInfo,
  ): Promise<{ room: RoomState } | { error: JoinFailure }> {
    if (!this.client) return { error: "connection" };
    this.playerName = player.name;

    try {
      if (!this.room || this.code !== code) {
        const restored = await this.reconnectExisting();
        const joined = restored ?? (await this.client.join(
            "heist",
            { code, name: player.name },
            MatchState,
          ));
        this.attach(joined as unknown as ColyseusMatchRoom);
      }
      const state = await this.waitForReadyState(this.room!);
      player.id = this.sessionId;
      return { room: this.toRoomState(state) };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      return { error: joinFailure(error) };
    }
  }

  leave(code: string): void {
    if (code !== this.code || !this.room) return;
    void this.room.leave(true).catch(() => {});
  }

  async start(code: string, playerId: string): Promise<StartResult> {
    if (!this.room || code !== this.code) return { ok: false, error: "notfound" };
    const state = this.room.state;
    if (state.hostId !== playerId) return { ok: false, error: "not-host" };
    if (state.phase !== "lobby") return { ok: false, error: "started" };
    if (state.players.size < state.maxPlayers) return { ok: false, error: "not-ready" };
    this.room.send("start");
    return { ok: true };
  }

  send(message: NetMessage): void {
    if (!this.room) return;
    if (message.type === "discover") {
      this.room.send("discover", { itemId: message.itemId });
    } else if (message.type === "command") {
      this.room.send("command", { command: message.command });
    }
    // World snapshots and power-ups are intentionally not client-authoritative
    // on this transport; the server's state patch is the only source of truth.
  }

  sendInput(input: InputFrame): void {
    this.room?.send("input", input);
  }

  disconnect(intentional = true): void {
    const room = this.room;
    this.room = null;
    this.client = null;
    this.role = null;
    this.watching = null;
    this.sessionId = "";
    this.roomSignature = "";
    if (intentional) clearReconnectToken(this.code);
    if (room) void room.leave(intentional).catch(() => {});
    this.listeners.clear();
  }

  onMessage(callback: (message: NetMessage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
