export type Vec3 = [number, number, number];

export const WALL_T = 0.3;
export const DOOR_T = 0.2;

export interface Opening {
  /** position along the wall axis */
  at: number;
  width: number;
  /** clear height of the hole; wall above it becomes a lintel */
  height?: number;
}

export interface WallDef {
  id: string;
  /** "x" walls run along X at a fixed Z, "z" walls run along Z at a fixed X */
  axis: "x" | "z";
  fixed: number;
  from: number;
  to: number;
  openings?: Opening[];
  height?: number;
  /** hidden in spectator views so the building reads as a cutaway */
  cutaway?: boolean;
  color?: string;
}

const OUT = "#6c706d";
const IN = "#8f8b83";

export const WALLS: WallDef[] = [
  // exterior shell
  {
    id: "w-north",
    axis: "x",
    fixed: -7,
    from: -22.15,
    to: 22.15,
    color: OUT,
    // the round vault door lives in this hole
    openings: [{ at: 15, width: 3.6, height: 2.9 }],
  },
  { id: "w-west", axis: "z", fixed: -22, from: -7.15, to: 7.15, color: OUT },
  { id: "w-east", axis: "z", fixed: 22, from: -7.15, to: 7.15, color: OUT },
  {
    id: "w-south-w",
    axis: "x",
    fixed: 7,
    from: -22.15,
    to: -3,
    color: OUT,
    cutaway: true,
  },
  {
    id: "w-south-e",
    axis: "x",
    fixed: 7,
    from: 3,
    to: 22.15,
    color: OUT,
    cutaway: true,
  },
  { id: "w-entry-w", axis: "z", fixed: -3, from: 7, to: 10.65, color: OUT },
  { id: "w-entry-e", axis: "z", fixed: 3, from: 7, to: 10.65, color: OUT },
  {
    id: "w-entry-s",
    axis: "x",
    fixed: 10.5,
    from: -3.15,
    to: 3.15,
    height: 3.2,
    color: OUT,
    openings: [{ at: 0, width: 3.0, height: 2.6 }],
  },

  // vault annex, poking out through the north wall
  { id: "w-annex-w", axis: "z", fixed: 13, from: -10.15, to: -7, color: OUT },
  { id: "w-annex-e", axis: "z", fixed: 17, from: -10.15, to: -7, color: OUT },
  { id: "w-annex-n", axis: "x", fixed: -10, from: 12.85, to: 17.15, color: OUT },

  // interior partitions - each pair frames a short connecting passage
  {
    id: "w-sec-e",
    axis: "z",
    fixed: -8,
    from: -7,
    to: 7,
    color: IN,
    openings: [{ at: 2.5, width: 1.6, height: 2.4 }],
  },
  {
    id: "w-lobby-w",
    axis: "z",
    fixed: -5.5,
    from: -7,
    to: 7,
    color: IN,
    openings: [{ at: 2.5, width: 1.6, height: 2.4 }],
  },
  {
    id: "w-lobby-e",
    axis: "z",
    fixed: 5.5,
    from: -7,
    to: 7,
    color: IN,
    openings: [{ at: 2.5, width: 1.6, height: 2.4 }],
  },
  {
    id: "w-vault-w",
    axis: "z",
    fixed: 8,
    from: -7,
    to: 7,
    color: IN,
    openings: [{ at: 2.5, width: 1.6, height: 2.4 }],
  },
];

/** Solid structure filling the gaps either side of the passages. */
export const MASSES: { x1: number; z1: number; x2: number; z2: number }[] = [
  { x1: -8, z1: -7.15, x2: -5.5, z2: 1 },
  { x1: -8, z1: 4, x2: -5.5, z2: 7.15 },
  { x1: 5.5, z1: -7.15, x2: 8, z2: 1 },
  { x1: 5.5, z1: 4, x2: 8, z2: 7.15 },
];

export interface DoorDef {
  id: string;
  label: string;
  room: string;
  /** centre of the opening */
  at: Vec3;
  /** orientation of the wall the door sits in */
  axis: "x" | "z";
  width: number;
  height: number;
  color: string;
  /** hinge side, so two doors in one passage do not swing into each other */
  swing: 1 | -1;
  lock?: "keycard";
}

export const DOORS: DoorDef[] = [
  {
    id: "door-sec",
    label: "Security room door",
    room: "wcorr",
    at: [-8, 0, 2.5],
    axis: "z",
    width: 1.6,
    height: 2.4,
    color: "#4aa8ff",
    swing: 1,
  },
  {
    id: "door-vault",
    label: "Vault room door",
    room: "ecorr",
    at: [5.5, 0, 2.5],
    axis: "z",
    width: 1.6,
    height: 2.4,
    color: "#ffd23b",
    swing: -1,
    lock: "keycard",
  },
];

/** Shared positions used by authoritative pickup and keypad interaction. */
export const KEYCARD_POSITION = { x: -13.4, z: -5.7 } as const;
export const KEYPAD_POSITION = { x: 17.6, z: -6.75 } as const;

/** Horizontal footprint of the round vault door collider in Rooms.tsx. */
export const VAULT_DOOR = {
  x: 15,
  z: -6.9,
  halfX: 1.8,
  halfZ: 0.2,
} as const;

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Horizontal wall segments matching Building.tsx's visual/collider cuts. */
export function wallBoxes(def: WallDef): CollisionBox[] {
  const out: CollisionBox[] = [];
  const push = (u1: number, u2: number) => {
    if (u2 - u1 < 0.01) return;
    out.push(
      def.axis === "x"
        ? {
            minX: u1,
            maxX: u2,
            minZ: def.fixed - WALL_T / 2,
            maxZ: def.fixed + WALL_T / 2,
          }
        : {
            minX: def.fixed - WALL_T / 2,
            maxX: def.fixed + WALL_T / 2,
            minZ: u1,
            maxZ: u2,
          },
    );
  };

  const openings = [...(def.openings ?? [])].sort((a, b) => a.at - b.at);
  let cursor = def.from;
  for (const opening of openings) {
    const start = opening.at - opening.width / 2;
    const end = opening.at + opening.width / 2;
    push(cursor, start);
    cursor = end;
  }
  push(cursor, def.to);
  return out;
}

export function doorBox(def: DoorDef): CollisionBox {
  const [x, , z] = def.at;
  return def.axis === "x"
    ? {
        minX: x - def.width / 2,
        maxX: x + def.width / 2,
        minZ: z - DOOR_T / 2,
        maxZ: z + DOOR_T / 2,
      }
    : {
        minX: x - DOOR_T / 2,
        maxX: x + DOOR_T / 2,
        minZ: z - def.width / 2,
        maxZ: z + def.width / 2,
      };
}

export function vaultDoorBox(): CollisionBox {
  return {
    minX: VAULT_DOOR.x - VAULT_DOOR.halfX,
    maxX: VAULT_DOOR.x + VAULT_DOOR.halfX,
    minZ: VAULT_DOOR.z - VAULT_DOOR.halfZ,
    maxZ: VAULT_DOOR.z + VAULT_DOOR.halfZ,
  };
}
