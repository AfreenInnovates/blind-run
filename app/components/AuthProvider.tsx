"use client";

import { useEffect } from "react";
import { AuthProvider as OidcAuthProvider, useAuth } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import {
  announceAuthTokenChange,
  PROFILE_NAME_KEY,
  SPACETIME_AUTH_TOKEN_KEY,
  profileNameFromClaims,
} from "../lib/auth";

const AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_SPACETIME_AUTH_CLIENT_ID;
const AUTH_ENABLED = Boolean(AUTH_CLIENT_ID);

/**
 * Where the OIDC provider sends the browser back to.
 *
 * Read off the live origin rather than baked in at build time, so localhost,
 * a Vercel preview and the production domain all work from one build - and
 * renaming the domain does not silently bounce every sign-in to a dead host.
 * The env var stays as an override for the rare case that is wrong.
 */
function siteUrl() {
  // The browser's own origin wins. It is the one value that is always correct,
  // and it cannot go stale: a NEXT_PUBLIC_SITE_URL left pointing at localhost
  // was being baked into the production build, so the deployed site sent every
  // sign-in back to a machine the visitor does not have.
  if (typeof window !== "undefined") return window.location.origin;
  return (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}

/**
 * Where the OIDC session lives.
 *
 * The library defaults to sessionStorage, which is per-tab: opening a shared
 * room link in a new tab found no session and demanded a fresh sign-in. Keep it
 * in localStorage so one sign-in covers every tab on the device and survives a
 * reload, until the user actually signs out.
 */
function userStore() {
  if (typeof window === "undefined") return undefined;
  return new WebStorageStateStore({ store: window.localStorage });
}

function AuthStorageBridge({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    // While the library is still restoring a session, `user` is null but the
    // person is not signed out. Clearing the token here is what made a new tab
    // wipe the credential it was about to recover.
    if (auth.isLoading) return;

    const user = auth.user;
    if (!user) {
      try {
        localStorage.removeItem(SPACETIME_AUTH_TOKEN_KEY);
      } catch {
        // Private browsing can still use the current auth session.
      }
      announceAuthTokenChange();
      return;
    }

    const claims = user.profile as Record<string, unknown>;
    const token = user.id_token || user.access_token;
    try {
      if (token) localStorage.setItem(SPACETIME_AUTH_TOKEN_KEY, token);
      localStorage.setItem(PROFILE_NAME_KEY, profileNameFromClaims(claims));
    } catch {
      // The OIDC provider keeps the active session in memory.
    }
    // wake anything gating on the token - it is usually mounted by now
    announceAuthTokenChange();
  }, [auth.user, auth.isLoading]);

  return children;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!AUTH_ENABLED) return children;

  return (
    <OidcAuthProvider
      authority="https://auth.spacetimedb.com/oidc"
      client_id={AUTH_CLIENT_ID}
      redirect_uri={`${siteUrl()}/`}
      post_logout_redirect_uri={`${siteUrl()}/`}
      scope="openid profile email"
      response_type="code"
      userStore={userStore()}
      stateStore={userStore()}
      automaticSilentRenew
      onSigninCallback={() => window.history.replaceState({}, document.title, "/")}
    >
      <AuthStorageBridge>{children}</AuthStorageBridge>
    </OidcAuthProvider>
  );
}
