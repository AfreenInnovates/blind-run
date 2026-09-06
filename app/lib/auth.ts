export const SPACETIME_AUTH_TOKEN_KEY = "heist:spacetime-auth-token";
export const PROFILE_NAME_KEY = "heist:name";

export function claimString(
  claims: Record<string, unknown> | undefined,
  key: string,
) {
  const value = claims?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function profileNameFromClaims(claims: Record<string, unknown> | undefined) {
  const email = claimString(claims, "email");
  const name =
    claimString(claims, "name") ||
    claimString(claims, "preferred_username") ||
    email.split("@")[0] ||
    "Player";

  return name.replace(/\s+/g, " ").slice(0, 16);
}

/**
 * Live view of the stored auth token.
 *
 * The token is written after sign-in returns, which is usually *after* the page
 * that gates on it has already mounted. Reading localStorage once on mount left
 * the room page showing "sign in to join" to someone who had just signed in, so
 * this is a real subscription: same-tab writes fire a custom event, other tabs
 * come through `storage`.
 */
export const AUTH_TOKEN_EVENT = "heist:auth-token-changed";

export function announceAuthTokenChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
}

export function subscribeAuthToken(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_TOKEN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_TOKEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readAuthToken() {
  try {
    return localStorage.getItem(SPACETIME_AUTH_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}
