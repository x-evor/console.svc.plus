export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { getAccountServiceApiBaseUrl } from "@server/serviceConfig";
import {
  getAccountSession,
  userHasPermission,
  userHasRole,
} from "@server/account/session";
import type { AccountUserRole } from "@server/account/session";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();
const REQUIRED_ROLES: AccountUserRole[] = ["admin", "operator"];
const WRITE_PERMISSIONS = ["admin.blacklist.write"];

type ErrorPayload = {
  error: string;
};

type RouteParams = {
  params: Promise<{
    email: string;
  }>;
};

function resolveEmail(param?: string): string | null {
  if (!param) {
    return null;
  }
  const trimmed = param.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  const { email: emailParam } = await params;
  const email = resolveEmail(emailParam);
  if (!email) {
    return NextResponse.json<ErrorPayload>(
      { error: "invalid_email" },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${ACCOUNT_API_BASE}/admin/blacklist/${encodeURIComponent(email)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);
  if (payload === null) {
    return NextResponse.json<ErrorPayload>(
      { error: "invalid_response" },
      { status: 502 },
    );
  }

  return NextResponse.json(payload, { status: response.status });
}
