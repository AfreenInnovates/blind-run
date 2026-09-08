import assert from "node:assert/strict";
import test from "node:test";
import { parseInputFrame } from "../packages/contracts/src";
import {
  areaAt,
  DEFAULT_SIMULATION_WORLD,
  DEFAULT_SIMULATION_CONFIG,
  spawnPlayer,
  stepPlayer,
  hasLineOfSight,
} from "../packages/sim/src";

const input = (value: Record<string, unknown>) => {
  const parsed = parseInputFrame({ seq: 1, ...value });
  assert.ok(parsed);
  return parsed;
};

const walk = (
  player: ReturnType<typeof spawnPlayer>,
  movement: Record<string, unknown>,
  world = DEFAULT_SIMULATION_WORLD,
) => {
  let current = player;
  for (let tick = 0; tick < 30; tick += 1) {
    current = stepPlayer(current, input(movement), 0.1, undefined, world);
  }
  return current;
};

test("movement is deterministic and diagonal input is normalized", () => {
  const player = spawnPlayer("p1", "Runner");
  const first = stepPlayer(player, input({ moveX: 1, moveZ: 1 }), 0.5);
  const second = stepPlayer(player, input({ moveX: 1, moveZ: 1 }), 0.5);

  assert.deepEqual(first, second);
  assert.ok(Math.abs(first.x - (first.z - player.z)) < 1e-12);
  assert.ok(first.x < DEFAULT_SIMULATION_CONFIG.walkSpeed * 0.5);
});

test("movement cannot leave the simulation bounds", () => {
  const player = {
    ...spawnPlayer("p1", "Runner"),
    x: DEFAULT_SIMULATION_CONFIG.maxX,
    z: DEFAULT_SIMULATION_CONFIG.minZ,
  };

  const next = stepPlayer(
    player,
    input({ moveX: 1, moveZ: -1, run: true }),
    1,
  );

  assert.equal(next.x, DEFAULT_SIMULATION_CONFIG.maxX);
  assert.equal(next.z, DEFAULT_SIMULATION_CONFIG.minZ);
});

test("authoritative movement reports the facility area", () => {
  assert.equal(areaAt(-15, 0), "sec");
  assert.equal(areaAt(15, 0), "vault");
  assert.equal(areaAt(0, 0), "lobby");
  assert.equal(areaAt(0, 20), "outside");
});

test("movement stops at a solid wall instead of crossing the facility shell", () => {
  const next = walk({ ...spawnPlayer("p1", "Runner"), x: 0, z: 0 }, { moveX: 1 });

  assert.ok(next.x < 5.1);
  assert.equal(next.area, "lobby");
});

test("a locked door stays solid until the keycard and open state are authoritative", () => {
  const start = { ...spawnPlayer("p1", "Runner"), x: 0, z: 2.5 };
  const locked = walk(start, { moveX: 1 });
  const forgedOpen = walk(start, { moveX: 1 }, {
    keycard: false,
    doorsOpen: new Set(["door-vault"]),
    vaultOpen: false,
  });
  const unlocked = walk(start, { moveX: 1 }, {
    keycard: true,
    doorsOpen: new Set(["door-vault"]),
    vaultOpen: false,
  });

  assert.ok(locked.x < 5.1);
  assert.ok(forgedOpen.x < 5.1);
  assert.ok(unlocked.x > 6.5);
});

test("the round vault door blocks the annex until the vault is released", () => {
  const start = { ...spawnPlayer("p1", "Runner"), x: 15, z: -5.8 };
  const closed = walk(start, { moveZ: -1 });
  const open = walk(start, { moveZ: -1 }, {
    keycard: true,
    doorsOpen: new Set(["door-vault"]),
    vaultOpen: true,
  });

  assert.ok(closed.z > -6.5);
  assert.ok(open.z < -7.5);
});

test("shared visibility respects walls and closed doors", () => {
  assert.equal(hasLineOfSight(0, 0, 10, 0), false);
  assert.equal(hasLineOfSight(0, 2.5, 6, 2.5), false);
  assert.equal(
    hasLineOfSight(0, 2.5, 6, 2.5, {
      keycard: true,
      doorsOpen: new Set(["door-vault"]),
      vaultOpen: false,
    }),
    true,
  );
});
