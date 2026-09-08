import type { InputFrame, PublicPlayerState } from "../../contracts/src";
import {
  DOORS,
  MASSES,
  type CollisionBox,
  doorBox,
  vaultDoorBox,
  wallBoxes,
  WALLS,
} from "./layout";

export interface SimulationConfig {
  walkSpeed: number;
  runSpeed: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  walkSpeed: 4,
  runSpeed: 6.5,
  minX: -22,
  maxX: 22,
  minZ: -10,
  maxZ: 26,
};

export const THIEF_SPAWN = {
  x: 0,
  y: 1.1,
  z: 15.5,
  yaw: 0,
  hp: 100,
  area: "outside",
} as const;

/** Horizontal radius of the Rapier capsule used by the local thief. */
export const PLAYER_RADIUS = 0.32;

export interface SimulationWorld {
  /** The keycard is picked up by the authoritative player position. */
  keycard: boolean;
  /** Doors that have swung open in the authoritative world. */
  doorsOpen: ReadonlySet<string>;
  /** The round vault door has been released by the keypad. */
  vaultOpen: boolean;
}

export const DEFAULT_SIMULATION_WORLD: SimulationWorld = {
  keycard: false,
  doorsOpen: new Set<string>(),
  vaultOpen: false,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const safeDelta = (deltaSeconds: number) =>
  Number.isFinite(deltaSeconds) ? clamp(deltaSeconds, 0, 0.1) : 0;

const STATIC_COLLIDERS: CollisionBox[] = [
  ...WALLS.flatMap(wallBoxes),
  ...MASSES.map((mass) => ({
    minX: mass.x1,
    maxX: mass.x2,
    minZ: mass.z1,
    maxZ: mass.z2,
  })),
];

const collidersFor = (world: SimulationWorld): CollisionBox[] => {
  const colliders = [...STATIC_COLLIDERS];

  for (const door of DOORS) {
    const open =
      world.doorsOpen.has(door.id) && (!door.lock || world.keycard);
    if (!open) colliders.push(doorBox(door));
  }

  if (!world.vaultOpen) colliders.push(vaultDoorBox());
  return colliders;
};

const overlaps = (x: number, z: number, box: CollisionBox) => {
  const nearestX = clamp(x, box.minX, box.maxX);
  const nearestZ = clamp(z, box.minZ, box.maxZ);
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS;
};

const blocked = (x: number, z: number, world: SimulationWorld) =>
  collidersFor(world).some((box) => overlaps(x, z, box));

const segmentHitsBox = (
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  box: CollisionBox,
) => {
  let minT = 0;
  let maxT = 1;
  const axes = [
    [startX, endX, box.minX, box.maxX],
    [startZ, endZ, box.minZ, box.maxZ],
  ] as const;

  for (const [start, end, min, max] of axes) {
    const delta = end - start;
    if (Math.abs(delta) < 1e-9) {
      if (start < min || start > max) return false;
      continue;
    }
    let near = (min - start) / delta;
    let far = (max - start) / delta;
    if (near > far) [near, far] = [far, near];
    minT = Math.max(minT, near);
    maxT = Math.min(maxT, far);
    if (minT > maxT) return false;
  }
  return true;
};

/** Shared 2D visibility test for cameras and guards. */
export function hasLineOfSight(
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  world: SimulationWorld = DEFAULT_SIMULATION_WORLD,
) {
  return !collidersFor(world).some((box) =>
    segmentHitsBox(startX, startZ, endX, endZ, box),
  );
}

export function areaAt(x: number, z: number): string {
  if (x >= 13 && x <= 17 && z >= -10.2 && z <= -7) return "annex";
  if (x >= -22 && x <= -8 && z >= -7 && z <= 7) return "sec";
  if (x >= 8 && x <= 22 && z >= -7 && z <= 7) return "vault";
  if (x >= -8 && x <= -5.5 && z >= 1 && z <= 4) return "wcorr";
  if (x >= 5.5 && x <= 8 && z >= 1 && z <= 4) return "ecorr";
  if (x >= -5.5 && x <= 5.5 && z >= -7 && z <= 7) return "lobby";
  if (x >= -3 && x <= 3 && z >= 7 && z <= 10.5) return "entry";
  return "outside";
}

export function spawnPlayer(id: string, name: string): PublicPlayerState {
  return {
    id,
    name,
    ...THIEF_SPAWN,
  };
}

/** Pure authoritative movement step with deterministic horizontal collision. */
export function stepPlayer(
  player: PublicPlayerState,
  input: InputFrame,
  deltaSeconds: number,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  world: SimulationWorld = DEFAULT_SIMULATION_WORLD,
): PublicPlayerState {
  const moveLength = Math.hypot(input.moveX, input.moveZ);
  const scale = moveLength > 1 ? 1 / moveLength : 1;
  const speed = input.run ? config.runSpeed : config.walkSpeed;
  const dt = safeDelta(deltaSeconds);
  const dx = input.moveX * scale * speed * dt;
  const dz = input.moveZ * scale * speed * dt;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.08));
  let x = player.x;
  let z = player.z;
  const stepX = dx / steps;
  const stepZ = dz / steps;

  for (let index = 0; index < steps; index += 1) {
    const nextX = clamp(x + stepX, config.minX, config.maxX);
    if (!blocked(nextX, z, world)) x = nextX;

    const nextZ = clamp(z + stepZ, config.minZ, config.maxZ);
    if (!blocked(x, nextZ, world)) z = nextZ;
  }

  return {
    ...player,
    x,
    z,
    yaw: input.yaw,
    area: areaAt(x, z),
  };
}

export function stepPlayers(
  players: ReadonlyMap<string, PublicPlayerState>,
  inputs: ReadonlyMap<string, InputFrame>,
  deltaSeconds: number,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  world: SimulationWorld = DEFAULT_SIMULATION_WORLD,
): Map<string, PublicPlayerState> {
  const next = new Map<string, PublicPlayerState>();
  for (const [id, player] of players) {
    const input = inputs.get(id);
    next.set(
      id,
      input ? stepPlayer(player, input, deltaSeconds, config, world) : { ...player },
    );
  }
  return next;
}
