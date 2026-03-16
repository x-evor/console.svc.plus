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
const REQUIRED_ROLES: AccountUserRole[] = ["admin", "operator"];
const READ_PERMISSIONS = ["admin.blacklist.read"];
const WRITE_PERMISSIONS = ["admin.blacklist.write"];

type ErrorPayload = {
  error: string;
};

export async function GET(request: NextRequest) {
  const session = await getAccountSession(request);
  const user = session.user;

  if (!user || !session.token) {
    return NextResponse.json<ErrorPayload>(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  if (
    !(await userHasRoleOrPermission(user, REQUIRED_ROLES, READ_PERMISSIONS))
  ) {
    return NextResponse.json<ErrorPayload>(
      { error: "forbidden" },
      { status: 403 },
    );
  }

  const response = await fetch(`${ACCOUNT_API_BASE}/admin/blacklist`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.token}`,
      Accept: "application/json",
    },
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

  if (
    !(
      (await userHasRole(user, REQUIRED_ROLES)) ||
      (await userHasPermission(user, WRITE_PERMISSIONS))
    )
  ) {
    return NextResponse.json<ErrorPayload>(
      { error: "forbidden" },
      { status: 403 },
    );
  }

  const body = await request.text();

  const response = await fetch(`${ACCOUNT_API_BASE}/admin/blacklist`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.token}`,
      Accept: "application/json",
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
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
}
