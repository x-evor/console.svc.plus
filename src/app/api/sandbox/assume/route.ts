export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { applySessionCookie, deriveMaxAgeFromExpires } from "@lib/authGateway";
import { evaluateAccountAdminAccess } from "@server/account/adminAccess";
import { getAccountServiceApiBaseUrl } from "@server/serviceConfig";
import { getAccountSession } from "@server/account/session";
import type { AccountUserRole } from "@server/account/session";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();
const REQUIRED_ROLES: AccountUserRole[] = ["admin"];
const WRITE_PERMISSIONS = ["admin.settings.write"];

const ROOT_BACKUP_COOKIE = "xc_session_root";
const SANDBOX_EMAIL = "sandbox@svc.plus";

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

export async function POST(request: NextRequest) {
  const session = await getAccountSession(request);
  const user = session.user;

  if (!user || !session.token) {
    return NextResponse.json<ErrorPayload>(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const access = await evaluateAccountAdminAccess(user, {
    roles: REQUIRED_ROLES,
    permissions: WRITE_PERMISSIONS,
    rootOnly: true,
  });
  if (!access.allowed) {
    return NextResponse.json<ErrorPayload>(
      { error: access.reason ?? "forbidden" },
      { status: 403 },
    );
  }

  try {
    const upstream = await fetch(`${ACCOUNT_API_BASE}/admin/assume`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: SANDBOX_EMAIL }),
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        {
          error: "upstream_non_json",
          upstreamStatus: upstream.status,
          upstreamBody: text.slice(0, 2048),
        } as any,
        { status: 502 },
      );
    }

    const payload = (await upstream.json().catch(() => null)) as any;
    if (!payload || typeof payload.token !== "string") {
      return NextResponse.json<ErrorPayload>(
        { error: "invalid_response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ ok: true, assumed: SANDBOX_EMAIL });

    // Backup current root session token only if it's NOT already an assumed session.
    // Check if the current user is NOT the sandbox user.
    if (user.email.toLowerCase() !== SANDBOX_EMAIL) {
      response.cookies.set({
        name: ROOT_BACKUP_COOKIE,
        value: session.token,
        httpOnly: true,
        secure: secureCookies(),
        sameSite: "lax",
        path: "/",
        maxAge: deriveMaxAgeFromExpires(payload.expiresAt),
      });
    }

    // Switch main session to sandbox token.
    applySessionCookie(
      response,
      payload.token,
      deriveMaxAgeFromExpires(payload.expiresAt),
      request.headers.get("host") ?? undefined,
    );

    return response;
  } catch (error) {
    console.error("Failed to assume sandbox", error);
    return NextResponse.json<ErrorPayload>(
      { error: "upstream_unreachable" },
      { status: 502 },
    );
  }
}
