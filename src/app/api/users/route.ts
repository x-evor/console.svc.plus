export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { getAccountServiceApiBaseUrl } from "@server/serviceConfig";
import {
  getAccountSession,
  userHasRoleOrPermission,
} from "@server/account/session";
import type { AccountUserRole } from "@server/account/session";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();
const USERS_ENDPOINT = `${ACCOUNT_API_BASE}/users`;

const ALLOWED_ROLES: AccountUserRole[] = ["admin", "operator"];
const READ_PERMISSIONS = ["admin.users.list.read"];

type ErrorPayload = {
  error: string;
};

type PermissionAwareHeaders = {
  "X-User-Role": string;
  "X-User-Permissions"?: string;
  "X-Service-Token"?: string;
};

function buildForwardHeaders(
  role: string,
  permissions: string[],
): PermissionAwareHeaders {
  const headers: PermissionAwareHeaders = {
    "X-User-Role": role,
  };
  if (permissions.length > 0) {
    headers["X-User-Permissions"] = permissions.join(",");
  }

  // Add internal service token for service-to-service authentication
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (serviceToken && serviceToken.trim().length > 0) {
    headers["X-Service-Token"] = serviceToken.trim();
  }

  return headers;
}

export async function GET() {
  const session = await getAccountSession();
  const user = session.user;

  if (!user) {
    return NextResponse.json<ErrorPayload>(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  if (!(await userHasRoleOrPermission(user, ALLOWED_ROLES, READ_PERMISSIONS))) {
    return NextResponse.json<ErrorPayload>(
      { error: "forbidden" },
      { status: 403 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${session.token}`,
    ...buildForwardHeaders(user.role, user.permissions),
  });

  const response = await fetch(USERS_ENDPOINT, {
    method: "GET",
    headers,
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
