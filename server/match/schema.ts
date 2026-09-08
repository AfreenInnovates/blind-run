import { schema, t, type SchemaType } from "@colyseus/schema";

/** Public state only. Secrets such as role assignment live outside this schema. */
export const PublicPlayer = schema(
  {
    id: t.string().default(""),
    name: t.string().default("Player"),
    x: t.float32().default(0),
    y: t.float32().default(1.1),
    z: t.float32().default(15.5),
    yaw: t.float32().default(0),
    hp: t.uint8().default(100),
    area: t.string().default("outside"),
    connected: t.boolean().default(true),
    rejoinUntil: t.float64().default(0),
  },
  "PublicPlayer",
);

export type PublicPlayer = SchemaType<typeof PublicPlayer>;

export const MatchState = schema(
  {
    code: t.string().default(""),
    hostId: t.string().default(""),
    mode: t.string().default("crew"),
    phase: t.string().default("lobby"),
    maxPlayers: t.uint8().default(4),
    startsAt: t.float64().default(0),
    seed: t.uint32().default(0),
    createdAt: t.float64().default(0),
    result: t.string().default(""),
    thiefId: t.string().default(""),
    keycard: t.boolean().default(false),
    codeFound: t.boolean().default(false),
    doorSecOpen: t.boolean().default(false),
    doorVaultOpen: t.boolean().default(false),
    vaultOpen: t.boolean().default(false),
    alarm: t.float32().default(0),
    spotted: t.boolean().default(false),
    alarmDisabled: t.boolean().default(false),
    ventOpen: t.boolean().default(false),
    loot: t.uint32().default(0),
    score: t.uint32().default(0),
    escaped: t.boolean().default(false),
    escapedVia: t.string().default(""),
    tick: t.uint32().default(0),
    serverTime: t.float64().default(0),
    players: t.map(PublicPlayer),
  },
  "MatchState",
);

export type MatchState = SchemaType<typeof MatchState>;
