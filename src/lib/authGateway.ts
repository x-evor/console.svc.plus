import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "xc_session";
export const MFA_COOKIE_NAME = "xc_mfa_challenge";

const SESSION_DEFAULT_MAX_AGE = 60 * 60 * 24; // 24 hours
const MFA_DEFAULT_MAX_AGE = 60 * 10; // 10 minutes

function readEnvValue(key: string): string | undefined {
  const value = process.env[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return undefined;
}

function shouldUseSecureCookies(): boolean {
  const explicit =
    parseBoolean(readEnvValue("SESSION_COOKIE_SECURE")) ??
    parseBoolean(readEnvValue("NEXT_PUBLIC_SESSION_COOKIE_SECURE"));
  if (explicit !== undefined) {
    return explicit;
  }

  if (process.env.NODE_ENV === "production") {
    return true;
  }

  const baseUrl =
    readEnvValue("NEXT_PUBLIC_APP_BASE_URL") ??
    readEnvValue("APP_BASE_URL") ??
    readEnvValue("NEXT_PUBLIC_SITE_URL");

  if (
    typeof baseUrl === "string" &&
    baseUrl.toLowerCase().startsWith("https://")
  ) {
    return true;
  }

  return false;
}

const secureCookieBase = {
  httpOnly: true,
  secure: shouldUseSecureCookies(),
  sameSite: "lax" as const, // Change to lax to support cross-subdomain
  path: "/",
};

/**
 * Resolves the cookie domain based on the current environment.
 * If running on a .svc.plus subdomain, returns '.svc.plus' to allow SSO.
 */
function normalizeHostname(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] ?? "";
  const withoutPort = withoutPath.replace(/:\d+$/, "");
  return withoutPort || undefined;
}

function resolveCookieDomain(requestHost?: string): string | undefined {
  const normalizedRequestHost = normalizeHostname(requestHost);
  if (normalizedRequestHost) {
    if (
      normalizedRequestHost === "svc.plus" ||
      normalizedRequestHost.endsWith(".svc.plus")
    ) {
      return ".svc.plus";
    }
    return undefined;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".svc.plus")) {
      return ".svc.plus";
    }
  }

  // For server-side, check headers or environment
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.APP_BASE_URL || "";
  if (baseUrl.includes(".svc.plus")) {
    return ".svc.plus";
  }

  return undefined;
}

export function applySessionCookie(
  response: NextResponse,
  token: string,
  maxAge?: number,
  requestHost?: string,
) {
  const resolvedMaxAge =
    Number.isFinite(maxAge) && maxAge && maxAge > 0
      ? Math.floor(maxAge)
      : SESSION_DEFAULT_MAX_AGE;
  const domain = resolveCookieDomain(requestHost);

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    ...secureCookieBase,
    maxAge: resolvedMaxAge,
    ...(domain ? { domain } : {}),
  });
}

export function clearSessionCookie(
  response: NextResponse,
  requestHost?: string,
) {
  const domain = resolveCookieDomain(requestHost);
  // Always clear the host-only cookie.
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    ...secureCookieBase,
    maxAge: 0,
  });

  // Also clear the domain-scoped cookie if we can resolve the domain.
  if (domain) {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      ...secureCookieBase,
      maxAge: 0,
      domain,
    });
  }
}

export function applyMfaCookie(
  response: NextResponse,
  token: string,
  maxAge?: number,
) {
  const resolvedMaxAge =
    Number.isFinite(maxAge) && maxAge && maxAge > 0
      ? Math.floor(maxAge)
      : MFA_DEFAULT_MAX_AGE;
  response.cookies.set({
    name: MFA_COOKIE_NAME,
    value: token,
    ...secureCookieBase,
    maxAge: resolvedMaxAge,
  });
}

export function clearMfaCookie(response: NextResponse) {
  // Clear host-only
  response.cookies.set({
    name: MFA_COOKIE_NAME,
    value: "",
    ...secureCookieBase,
    maxAge: 0,
  });
  // Clear domain-scoped if resolved
  const domain = resolveCookieDomain();
  if (domain) {
    response.cookies.set({
      name: MFA_COOKIE_NAME,
      value: "",
      ...secureCookieBase,
      maxAge: 0,
      domain,
    });
  }
}

export function deriveMaxAgeFromExpires(
  expiresAt?: string | number | Date | null,
  fallback = SESSION_DEFAULT_MAX_AGE,
) {
  if (!expiresAt) {
    return fallback;
  }

  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const msUntilExpiry = date.getTime() - Date.now();
  if (!Number.isFinite(msUntilExpiry) || msUntilExpiry <= 0) {
    return fallback;
  }
  return Math.floor(msUntilExpiry / 1000);
}
