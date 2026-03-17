import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/authGateway";
import type { AccountSessionUser } from "@/server/account/session";
import { getAccountServiceApiBaseUrl } from "@/server/serviceConfig";
import type { XWorkmateProfileResponse } from "@/lib/xworkmate/types";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();

type AccountSessionResponse = {
  user?: AccountSessionUser | null;
};

function buildForwardHeaders(
  token: string,
  host?: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  const normalizedHost = String(host ?? "").trim();
  if (normalizedHost) {
    headers["X-Forwarded-Host"] = normalizedHost;
  }
  return headers;
}

export async function getXWorkmateSessionContext(
  host?: string | null,
): Promise<{
  user: AccountSessionUser | null;
  profile: XWorkmateProfileResponse | null;
}> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value?.trim();
  if (!token) {
    return { user: null, profile: null };
  }

  const requestHeaders = buildForwardHeaders(token, host);

  const [sessionResponse, profileResponse] = await Promise.all([
    fetch(`${ACCOUNT_API_BASE}/session`, {
      method: "GET",
      headers: requestHeaders,
      cache: "no-store",
    }).catch(() => null),
    fetch(`${ACCOUNT_API_BASE}/xworkmate/profile`, {
      method: "GET",
      headers: requestHeaders,
      cache: "no-store",
    }).catch(() => null),
  ]);

  let user: AccountSessionUser | null = null;
  if (sessionResponse?.ok) {
    const payload = (await sessionResponse
      .json()
      .catch(() => null)) as AccountSessionResponse | null;
    user = payload?.user ?? null;
  }

  let profile: XWorkmateProfileResponse | null = null;
  if (profileResponse?.ok) {
    profile = (await profileResponse
      .json()
      .catch(() => null)) as XWorkmateProfileResponse | null;
  }

  return { user, profile };
}
