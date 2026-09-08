export type MatchMode = "crew" | "crowd";
export type MatchPhase = "lobby" | "countdown" | "playing" | "ended";
export type PlayerRole = "thief" | "spectator";
export const COMMAND_CODES = [
  "LEFT",
  "RIGHT",
  "FORWARD",
  "BACK",
  "RUN",
  "HIDE",
  "STOP",
] as const;
export type CommandCode = (typeof COMMAND_CODES)[number];

export const MATCH_LIMITS: Record<MatchMode, { maxPlayers: number; minPlayers: number }> = {
  crew: { maxPlayers: 4, minPlayers: 2 },
  crowd: { maxPlayers: 50, minPlayers: 2 },
};

export interface InputFrame {
  /** Monotonically increasing client sequence number. */
  seq: number;
  /** Normalized horizontal movement intent in [-1, 1]. */
  moveX: number;
  /** Normalized forward movement intent in [-1, 1]. */
  moveZ: number;
  /** Look heading in radians. */
  yaw: number;
  run: boolean;
  jump: boolean;
  interact: boolean;
}

export interface PublicPlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  area: string;
}

export interface PublicMatchState {
  mode: MatchMode;
  phase: MatchPhase;
  tick: number;
  serverTime: number;
  players: PublicPlayerState[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/** Validate and bound an untrusted room message before it reaches simulation. */
export function parseInputFrame(value: unknown): InputFrame | null {
  if (typeof value !== "object" || value === null) return null;

  const input = value as Partial<Record<keyof InputFrame, unknown>>;
  const seq = input.seq;
  if (
    typeof seq !== "number" ||
    !Number.isSafeInteger(seq) ||
    seq < 0
  ) {
    return null;
  }

  return {
    seq,
    moveX: clamp(finite(input.moveX, 0), -1, 1),
    moveZ: clamp(finite(input.moveZ, 0), -1, 1),
    yaw: finite(input.yaw, 0),
    run: input.run === true,
    jump: input.jump === true,
    interact: input.interact === true,
  };
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw roles deterministically without exposing roles in public state. */
export function drawRoles(
  playerIds: readonly string[],
  seed: number,
): Map<string, PlayerRole> {
  const order = [...playerIds].sort();
  const random = mulberry32(seed);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }

  return new Map(order.map((id, index) => [id, index === 0 ? "thief" : "spectator"]));
}
