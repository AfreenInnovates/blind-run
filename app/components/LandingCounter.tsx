"use client";

import { useEffect, useState } from "react";
import { DbConnection } from "../game/net/spacetime";
import { tokenIsExpired } from "../lib/auth";

/**
 * The live "moonshots landed" figure.
 *
 * Every browser that opens the site connects to SpacetimeDB and calls
 * `register_landing`, which writes one row per identity - so the number counts
 * distinct visitors rather than page loads, and it counts them globally: a
 * visit from any browser, on any device, ticks the number up for everyone who
 * has the page open, live, without a refresh.
 *
 * `BASE_LANDED` is the pre-launch figure the site shipped with. The real count
 * is added on top rather than replacing it, so the number never appears to
 * fall.
 */
const BASE_LANDED = 150;

export default function LandingCounter() {
  const [landed, setLanded] = useState(0);

  useEffect(() => {
    const host =
      process.env.NEXT_PUBLIC_SPACETIME_HOST || "wss://maincloud.spacetimedb.com";
    const database =
      process.env.NEXT_PUBLIC_SPACETIME_MODULE_NAME || "one-heist-spacetime";
    // Everyone is counted: an anonymous identity is still a distinct visitor.
    const tokenKey = `heist:landing-token:${host}:${database}`;
    let cachedToken = "";
    try {
      cachedToken = localStorage.getItem(tokenKey) ?? "";
      // An expired token is refused with a 401, so drop it before it is used
      // rather than after - the same guard the game transport applies.
      if (cachedToken && tokenIsExpired(cachedToken)) {
        localStorage.removeItem(tokenKey);
        cachedToken = "";
      }
    } catch {
      // A private window still connects, it just gets a new identity each time.
    }

    let conn: DbConnection | null = null;
    let live = true;

    const recount = (db: DbConnection["db"]) => {
      if (!live) return;
      let total = 0;
      for (const _row of db.landingVisit.iter()) total++;
      setLanded(total);
    };

    const connect = (token: string, mayRetryAnonymously: boolean) => {
      if (!live) return;
      try {
        const connection = DbConnection.builder()
          .withUri(host)
          .withDatabaseName(database)
          .withToken(token)
          .onConnect((connected, _identity, nextToken) => {
            try {
              localStorage.setItem(tokenKey, nextToken);
            } catch {
              /* nothing to persist in a private window */
            }
            // idempotent server-side: one row per identity, re-visits are no-ops
            void connected.reducers.registerLanding({});
          })
          .onConnectError(() => {
            // A stored token the module no longer accepts - issued against a
            // different database, or since discarded - is refused without ever
            // being expired, so the guard above cannot catch it. Forget it and
            // come back with a fresh identity; otherwise the seeded figure
            // stays frozen for as long as that token sits in storage.
            if (!mayRetryAnonymously) return;
            try {
              localStorage.removeItem(tokenKey);
            } catch {
              /* nothing to clear in a private window */
            }
            connect("", false);
          })
          .build();

        conn = connection;
        connection.db.landingVisit.onInsert(() => recount(connection.db));
        connection.db.landingVisit.onDelete(() => recount(connection.db));
        connection
          .subscriptionBuilder()
          .onApplied((ctx) => recount(ctx.db))
          .subscribe(["SELECT * FROM landing_visit"]);
      } catch {
        /* the seeded figure is the fallback */
      }
    };

    connect(cachedToken, Boolean(cachedToken));

    return () => {
      live = false;
      conn?.disconnect();
    };
  }, []);

  return <>{(BASE_LANDED + landed).toLocaleString("en-US")}</>;
}
