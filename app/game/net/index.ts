"use client";

import { SpacetimeNet } from "./spacetimeNet";
import { ColyseusNet } from "./colyseusNet";
import type { NetClient } from "./types";

/**
 * Which transport carries a room.
 *
 * - `spacetime` (default): the published SpacetimeDB module in `spacetime/`.
 *   One authoritative database every client subscribes to, so room records and
 *   world snapshots arrive live no matter where the page is served from. This
 *   is the only transport that works on a serverless deployment.
 * - `colyseus`: the authoritative match-server path used during migration.
 */
export function createNet(): NetClient {
  return process.env.NEXT_PUBLIC_MATCH_TRANSPORT === "colyseus"
    ? new ColyseusNet()
    : new SpacetimeNet();
}

export * from "./types";
