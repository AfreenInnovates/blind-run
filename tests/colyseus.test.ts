import assert from "node:assert/strict";
import test from "node:test";
import { Client, type Room } from "@colyseus/sdk";
import type { AddressInfo } from "node:net";
import { server } from "../server/index";
import { MatchState } from "../server/match/schema";
import type { Snapshot } from "../app/game/net/types";

const waitFor = async (
  predicate: () => boolean,
  label: string,
  timeoutMs = 5_000,
) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for ${label}`);
};

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

test("Colyseus Crew lifecycle keeps state authoritative and reconnectable", async () => {
  const rooms: Room[] = [];
  const clients: Client[] = [];
  let listening = false;

  try {
    await server.listen(0);
    listening = true;
    const address = server.transport.server?.address();
    assert.ok(address && typeof address !== "string");
    const endpoint = `http://127.0.0.1:${(address as AddressInfo).port}`;
    const health = await fetch(`${endpoint}/healthz`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      ok: true,
      service: "blind-run-match",
    });
    const code = `TEST${Date.now().toString(36).slice(-5)}`;
    const roles = new Map<string, { role: string; watching: string | null }>();
    const worlds = new Map<string, Snapshot[]>();
    const errors: string[] = [];

    const observe = (room: Room) => {
      worlds.set(room.sessionId, []);
      room.onMessage("role", (message: { role: string; watching: string | null }) => {
        roles.set(room.sessionId, message);
      });
      room.onMessage("error", (message: { code: string }) => {
        errors.push(message.code);
      });
      room.onMessage("discover", () => {});
      room.onMessage("world", (snapshot: Snapshot) => {
        worlds.get(room.sessionId)?.push(snapshot);
      });
    };

    for (let index = 0; index < 4; index += 1) {
      clients.push(new Client(endpoint));
    }

    const host = await clients[0].create(
      "heist",
      { code, mode: "crew", maxPlayers: 4, seed: 77, name: "Host" },
      MatchState,
    );
    rooms.push(host);
    observe(host);
    host.send("start");
    await waitFor(() => errors.includes("not-ready"), "not-ready response");

    for (let index = 1; index < clients.length; index += 1) {
      const room = await clients[index].join(
        "heist",
        { code, name: `Player ${index}` },
        MatchState,
      );
      rooms.push(room);
      observe(room);
    }

    await waitFor(() => host.state.phase === "countdown", "automatic countdown");
    assert.ok(host.state.startsAt > Date.now());

    // Host start is an explicit early-start path; the automatic countdown remains
    // available when the host does not press this button.
    host.send("start");
    await waitFor(() => roles.size === 4, "role assignments");
    await waitFor(
      () => rooms.every((room) => room.state.phase === "playing"),
      "playing phase",
    );
    await waitFor(
      () => [...worlds.values()].every((messages) => messages.length > 0),
      "authoritative world snapshots",
    );

    const roleValues = [...roles.values()];
    assert.equal(roleValues.filter((role) => role.role === "thief").length, 1);
    assert.equal(roleValues.filter((role) => role.role === "spectator").length, 3);

    const thiefIndex = rooms.findIndex(
      (room) => roles.get(room.sessionId)?.role === "thief",
    );
    assert.notEqual(thiefIndex, -1);
    const thiefWorld = worlds.get(rooms[thiefIndex].sessionId)?.at(-1);
    assert.ok(thiefWorld);
    assert.deepEqual(thiefWorld.guards, {});
    assert.deepEqual(thiefWorld.cams, {});

    for (const room of rooms) {
      const role = roles.get(room.sessionId);
      if (role?.watching === "sec") {
        const snapshot = worlds.get(room.sessionId)?.at(-1);
        assert.ok(snapshot?.guards["guard-sec"]);
      }
      if (role?.watching === "vault") {
        const snapshot = worlds.get(room.sessionId)?.at(-1);
        assert.ok(snapshot?.guards["guard-vault"]);
      }
    }

    const reconnectIndex = rooms.findIndex(
      (room) => roles.get(room.sessionId)?.role === "spectator",
    );
    assert.notEqual(reconnectIndex, -1);
    const reconnectRoom = rooms[reconnectIndex];
    const observerRoom = rooms.find((_, index) => index !== reconnectIndex);
    assert.ok(observerRoom);
    const reconnectToken = reconnectRoom.reconnectionToken;
    const reconnectSessionId = reconnectRoom.sessionId;
    reconnectRoom.reconnection.enabled = false;
    await reconnectRoom.leave(false);

    await waitFor(
      () => observerRoom.state.players.get(reconnectSessionId)?.connected === false,
      "disconnected player state",
    );
    assert.ok(observerRoom.state.players.get(reconnectSessionId)?.rejoinUntil > Date.now());

    const rejoined = await clients[reconnectIndex].reconnect(reconnectToken, MatchState);
    rooms[reconnectIndex] = rejoined;
    observe(rejoined);
    await waitFor(
      () => observerRoom.state.players.get(reconnectSessionId)?.connected === true,
      "reconnected player state",
    );
    assert.equal(rejoined.sessionId, reconnectSessionId);

    const thiefRoom = rooms[thiefIndex];
    let inputSequence = 0;
    const thiefPlayer = () =>
      thiefRoom.state.players.get(thiefRoom.state.thiefId);
    const driveUntil = async (
      predicate: () => boolean,
      moveX: number,
      moveZ: number,
      controls: { interact?: boolean; jump?: boolean } = {},
      timeoutMs = 8_000,
    ) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (predicate()) return;
        thiefRoom.send("input", {
          seq: inputSequence++,
          moveX,
          moveZ,
          yaw: 0,
          run: true,
          jump: controls.jump === true,
          interact: controls.interact === true,
        });
        await sleep(40);
      }
      const player = thiefPlayer();
      throw new Error(
        `Timed out during authoritative route drive (phase=${thiefRoom.state.phase}, hp=${player?.hp}, x=${player?.x}, z=${player?.z}, keycard=${thiefRoom.state.keycard}, vault=${thiefRoom.state.vaultOpen}, loot=${thiefRoom.state.loot})`,
      );
    };

    // Drive the actual server-owned route instead of mutating schema state from
    // the test. Every interaction below must be earned by the authoritative sim.
    await driveUntil(() => (thiefPlayer()?.z ?? Infinity) <= 2.8, 0, -1);
    await driveUntil(() => (thiefPlayer()?.x ?? Infinity) <= -10.5, -1, 0);
    const securitySpectator = rooms.find(
      (room) => roles.get(room.sessionId)?.watching === "sec",
    );
    assert.ok(securitySpectator);
    securitySpectator.send("discover", { itemId: "note" });
    await waitFor(() => thiefRoom.state.codeFound, "server-validated discovery");
    await driveUntil(() => (thiefPlayer()?.x ?? Infinity) <= -12.5, -1, 0);
    await driveUntil(() => (thiefPlayer()?.z ?? Infinity) <= -5.2, 0, -1);
    await waitFor(
      () => thiefRoom.state.keycard && thiefRoom.state.doorSecOpen,
      "keycard and security door",
    );
    await driveUntil(() => (thiefPlayer()?.z ?? -Infinity) >= 2.1, 0, 1);
    await driveUntil(() => (thiefPlayer()?.x ?? -Infinity) >= 16.5, 1, 0);
    await driveUntil(
      () => thiefRoom.state.vaultOpen,
      0,
      -1,
      { interact: true },
    );
    assert.equal(thiefRoom.state.ventOpen, true);
    assert.equal(thiefRoom.state.doorVaultOpen, true);
    await driveUntil(() => (thiefPlayer()?.x ?? Infinity) <= 15.4, -1, 0);
    await driveUntil(() => thiefRoom.state.loot >= 500, 0, -1);
    await driveUntil(() => (thiefPlayer()?.z ?? -Infinity) >= -6.4, 0, 1);
    await driveUntil(() => (thiefPlayer()?.x ?? -Infinity) >= 20.2, 1, 0);
    await driveUntil(() => (thiefPlayer()?.z ?? -Infinity) >= 1, 0, 1);
    await driveUntil(() => thiefRoom.state.escaped, 0, 0, { jump: true });
    assert.equal(thiefRoom.state.result, "escaped");
    assert.equal(thiefRoom.state.escapedVia, "vent");

    await rejoined.leave(true);
    await waitFor(
      () => observerRoom.state.phase === "ended" && observerRoom.state.result === "escaped",
      "escaped result",
    );
  } finally {
    await Promise.allSettled(
      rooms.map((room) =>
        Promise.race([
          room.leave(true).catch(() => 0),
          new Promise<number>((resolve) => setTimeout(() => resolve(0), 500)),
        ]),
      ),
    );
    if (listening) {
      await Promise.race([
        server.gracefullyShutdown(false),
        new Promise<void>((resolve) => setTimeout(resolve, 1_000)),
      ]);
    }
  }
});
