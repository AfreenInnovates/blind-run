/**
 * There is no sign-in. A room is open to anyone holding the link, so the only
 * things kept about a player are the display name they typed and the anonymous
 * token that lets a refreshed tab reclaim the seat it already holds.
 */

export const PROFILE_NAME_KEY = "heist:name";

/**
 * Whether a JWT is past its `exp` claim.
 *
 * An expired token is rejected with a 401, so it is worth discarding before it
 * is used rather than discovering the failure after the connection is refused.
 */
export function tokenIsExpired(token: string) {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return false;
    const payload = JSON.parse(
      atob(encoded.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: unknown };
    return typeof payload.exp === "number" && payload.exp <= Date.now() / 1000;
  } catch {
    return false;
  }
}
