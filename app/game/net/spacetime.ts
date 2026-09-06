"use client";

/*
 * Client schema for the published `one-heist-spacetime` module.
 *
 * This file used to be hand-maintained, which is how it drifted: the module
 * grew user_profile, account_email, landing_visit and spectator_grace while
 * this side still described five tables, and SpacetimeDB addresses tables and
 * reducers by index - so the first subscription update failed to decode and the
 * whole app crashed.
 *
 * It is now generated. Do not edit by hand. After changing spacetime/src,
 * republish and regenerate:
 *
 *   spacetimedb-cli publish --server maincloud one-heist-spacetime -y
 *   spacetimedb-cli generate --lang typescript \
 *     --out-dir app/game/net/spacetime_bindings --module-path spacetime -y
 */
export * from "./spacetime_bindings";
