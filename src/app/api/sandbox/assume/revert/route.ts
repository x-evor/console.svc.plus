export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { applySessionCookie } from "@lib/authGateway";
import { getAccountServiceApiBaseUrl } from "@server/serviceConfig";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();

const ROOT_BACKUP_COOKIE = "xc_session_root";

type ErrorPayload = {
  error: string;
};

function secureCookies(): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.APP_BASE_URL || "";
  return baseUrl.toLowerCase().startsWith("https://");
}

async function verifyRootToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${ACCOUNT_API_BASE}/session`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return false;
    }
    const payload = (await res.json().catch(() => null)) as any;
    const email =
      typeof payload?.user?.email === "string"
        ? payload.user.email.trim().toLowerCase()
        : "";
    return email === "admin@svc.plus";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rootToken =
    request.cookies.get(ROOT_BACKUP_COOKIE)?.value?.trim() ?? "";
  if (!rootToken) {
    return NextResponse.json<ErrorPayload>(
      { error: "not_assuming" },
      { status: 400 },
    );
  }

  if (!(await verifyRootToken(rootToken))) {
    return NextResponse.json<ErrorPayload>(
      { error: "root_token_invalid" },
      { status: 403 },
    );
  }

  // Best-effort audit log on accounts.svc.plus. (Cookies are owned by console.)
  try {
    await fetch(`${ACCOUNT_API_BASE}/admin/assume/revert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rootToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Failed to audit assume revert", error);
  }

  const response = NextResponse.json({ ok: true });
  applySessionCookie(
    response,
    rootToken,
    undefined,
    request.headers.get("host") ?? undefined,
  );
  response.cookies.set({
    name: ROOT_BACKUP_COOKIE,
    value: "",
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
