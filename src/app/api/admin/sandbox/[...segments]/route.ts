export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { getAccountServiceApiBaseUrl } from "@server/serviceConfig";
import {
  getAccountSession,
  userHasPermission,
  userHasRole,
  userHasRoleOrPermission,
} from "@server/account/session";
import type { AccountUserRole } from "@server/account/session";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();
const READ_ROLES: AccountUserRole[] = ["admin", "operator"];
const WRITE_ROLES: AccountUserRole[] = ["admin"];
const READ_PERMISSIONS = ["admin.settings.read"];
const WRITE_PERMISSIONS = ["admin.settings.write"];

type ErrorPayload = {
  error: string;
};

async function proxyRequest(request: NextRequest) {
  const session = await getAccountSession(request);
  const user = session.user;

  if (!user || !session.token) {
    return NextResponse.json<ErrorPayload>(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { pathname, search } = new URL(request.url);
  // Map /api/admin/sandbox/... to backend /admin/sandbox/...
  const segments = pathname.replace(/^\/api\/admin\/sandbox/, "");
  const targetUrl = `${ACCOUNT_API_BASE}/admin/sandbox${segments}${search}`;

  const method = request.method;
  const isWrite = method !== "GET" && method !== "HEAD";

  if (isWrite) {
    if (
      !(
        (await userHasRole(user, WRITE_ROLES)) ||
        (await userHasPermission(user, WRITE_PERMISSIONS))
      )
    ) {
      return NextResponse.json<ErrorPayload>(
        { error: "forbidden" },
        { status: 403 },
      );
    }
  } else {
    if (!(await userHasRoleOrPermission(user, READ_ROLES, READ_PERMISSIONS))) {
      return NextResponse.json<ErrorPayload>(
        { error: "forbidden" },
        { status: 403 },
      );
    }
  }

  const headers = new Headers({
    Authorization: `Bearer ${session.token}`,
    Accept: "application/json",
  });

  let body: string | undefined;
  if (isWrite) {
    body = await request.text();
    const contentType =
      request.headers.get("content-type") ?? "application/json";
    headers.set("Content-Type", contentType);
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (payload === null) {
      return NextResponse.json<ErrorPayload>(
        { error: "invalid_response" },
        { status: 502 },
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (err: any) {
    return NextResponse.json<ErrorPayload>(
      { error: err.message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}
