import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, clearSessionCookie } from "@lib/authGateway";
import {
  getAccountServiceApiBaseUrl,
  getAccountServiceBaseUrl,
} from "@server/serviceConfig";
import {
  buildInternalServiceHeaders,
  isServiceTokenConfigured,
} from "@server/internalServiceAuth";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();
const ACCOUNT_BASE = getAccountServiceBaseUrl();

type AccountUser = {
  id?: string;
  uuid?: string;
  proxyUuid?: string;
  proxyUuidExpiresAt?: string;
  name?: string;
  username?: string;
  email: string;
  mfaEnabled?: boolean;
  mfaPending?: boolean;
  mfa?: {
    totpEnabled?: boolean;
    totpPending?: boolean;
    totpSecretIssuedAt?: string;
    totpConfirmedAt?: string;
    totpLockedUntil?: string;
  };
  role?: string;
  groups?: string[];
  permissions?: string[];
  readOnly?: boolean;
  tenantId?: string;
  tenants?: Array<{
    id?: string;
    name?: string;
    role?: string;
  }>;
};

type SessionResponse = {
  user?: AccountUser | null;
  error?: string;
};

type SandboxGuestResponse = {
  email?: string;
  proxyUuid?: string;
  proxyUuidExpiresAt?: string;
  error?: string;
};

function normalizeRole(role: unknown): string {
  if (typeof role !== "string") {
    return "user";
  }
  const normalized = role.trim().toLowerCase();
  if (!normalized) {
    return "user";
  }
  if (normalized === "root" || normalized === "super_admin") {
    return "admin";
  }
  if (normalized === "readonly" || normalized === "read_only") {
    return "user";
  }
  return normalized;
}

async function fetchSession(token: string, requestHost?: string | null) {
  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(requestHost && requestHost.trim().length > 0
          ? {
              "X-Forwarded-Host": requestHost.trim(),
            }
          : {}),
      },
      cache: "no-store",
    });

    const data = (await response.json().catch(() => ({}))) as SessionResponse;
    return { response, data };
  } catch (error) {
    console.error("Session lookup proxy failed", error);
    return { response: null, data: null };
  }
}

async function fetchSandboxGuest(): Promise<AccountUser | null> {
  if (!isServiceTokenConfigured()) {
    return null;
  }

  try {
    const response = await fetch(`${ACCOUNT_BASE}/api/internal/sandbox/guest`, {
      method: "GET",
      headers: buildInternalServiceHeaders({
        Accept: "application/json",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response
      .json()
      .catch(() => null)) as SandboxGuestResponse | null;
    const proxyUuid =
      typeof payload?.proxyUuid === "string" ? payload.proxyUuid.trim() : "";
    if (!proxyUuid) {
      return null;
    }

    const proxyUuidExpiresAt =
      typeof payload?.proxyUuidExpiresAt === "string" &&
      payload.proxyUuidExpiresAt.trim().length > 0
        ? payload.proxyUuidExpiresAt.trim()
        : undefined;

    // Shape this as a pseudo-session user for the Guest/Demo experience.
    return {
      id: proxyUuid,
      uuid: proxyUuid,
      proxyUuid,
      proxyUuidExpiresAt,
      name: "Guest user",
      username: "guest",
      email: "sandbox@svc.plus",
      role: "guest",
      groups: ["guest", "sandbox"],
      permissions: ["read"],
      readOnly: true,
      tenantId: "guest-sandbox",
      tenants: [{ id: "guest-sandbox", name: "Guest Sandbox", role: "guest" }],
      mfaEnabled: false,
      mfaPending: false,
    };
  } catch (error) {
    console.error("Sandbox guest session proxy failed", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  void request;
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const sandboxGuest = await fetchSandboxGuest();
    return NextResponse.json({ user: sandboxGuest });
  }

  const requestHost = request.headers.get("host");
  const { response, data } = await fetchSession(token, requestHost);
  if (!response || !response.ok || !data?.user) {
    const res = NextResponse.json({ user: null });
    clearSessionCookie(res, requestHost ?? undefined);
    return res;
  }

  const rawUser = data.user as AccountUser;
  const identifier =
    typeof rawUser.uuid === "string" && rawUser.uuid.trim().length > 0
      ? rawUser.uuid.trim()
      : typeof rawUser.id === "string"
        ? rawUser.id.trim()
        : undefined;

  const rawMfa = rawUser.mfa ?? {};
  const derivedMfaEnabled = Boolean(rawUser.mfaEnabled ?? rawMfa.totpEnabled);
  const derivedMfaPendingSource =
    typeof rawUser.mfaPending === "boolean"
      ? rawUser.mfaPending
      : typeof rawMfa.totpPending === "boolean"
        ? rawMfa.totpPending
        : false;
  const derivedMfaPending = derivedMfaPendingSource && !derivedMfaEnabled;

  const normalizedRole = normalizeRole(rawUser.role);
  const rawRole =
    typeof rawUser.role === "string" ? rawUser.role.trim().toLowerCase() : "";
  const normalizedGroups = Array.isArray(rawUser.groups)
    ? rawUser.groups
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value) => value.trim())
    : [];
  const normalizedPermissions = Array.isArray(rawUser.permissions)
    ? rawUser.permissions
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value) => value.trim())
    : [];
  const normalizedUsernameLower = String(rawUser.username ?? "")
    .trim()
    .toLowerCase();
  const normalizedNameLower = String(rawUser.name ?? "")
    .trim()
    .toLowerCase();
  const identifierLower = (identifier ?? "").toLowerCase();
  const normalizedReadOnly =
    Boolean(rawUser.readOnly) ||
    normalizedGroups.some((group) => group.toLowerCase() === "readonly role") ||
    rawRole === "readonly" ||
    rawRole === "read_only" ||
    String(rawUser.email ?? "")
      .trim()
      .toLowerCase() === "sandbox@svc.plus";
  const normalizedProxyUuid =
    typeof rawUser.proxyUuid === "string" && rawUser.proxyUuid.trim().length > 0
      ? rawUser.proxyUuid.trim()
      : undefined;
  const normalizedProxyUuidExpiresAt =
    typeof rawUser.proxyUuidExpiresAt === "string" &&
    rawUser.proxyUuidExpiresAt.trim().length > 0
      ? rawUser.proxyUuidExpiresAt.trim()
      : undefined;

  const normalizedTenantId =
    typeof rawUser.tenantId === "string" && rawUser.tenantId.trim().length > 0
      ? rawUser.tenantId.trim()
      : undefined;
  const normalizedTenants = Array.isArray(rawUser.tenants)
    ? rawUser.tenants
        .map((tenant) => {
          if (!tenant || typeof tenant !== "object") {
            return null;
          }

          const identifier =
            typeof tenant.id === "string" && tenant.id.trim().length > 0
              ? tenant.id.trim()
              : undefined;
          if (!identifier) {
            return null;
          }

          const normalizedTenant: { id: string; name?: string; role?: string } =
            {
              id: identifier,
            };

          if (
            typeof tenant.name === "string" &&
            tenant.name.trim().length > 0
          ) {
            normalizedTenant.name = tenant.name.trim();
          }

          if (
            typeof tenant.role === "string" &&
            tenant.role.trim().length > 0
          ) {
            normalizedTenant.role = tenant.role.trim().toLowerCase();
          }

          return normalizedTenant;
        })
        .filter(
          (tenant): tenant is { id: string; name?: string; role?: string } =>
            Boolean(tenant),
        )
    : undefined;

  const normalizedMfa = Object.keys(rawMfa).length
    ? {
        ...rawMfa,
        totpEnabled: Boolean(rawMfa.totpEnabled ?? derivedMfaEnabled),
        totpPending: Boolean(rawMfa.totpPending ?? derivedMfaPending),
      }
    : {
        totpEnabled: derivedMfaEnabled,
        totpPending: derivedMfaPending,
      };

  const normalizedUser = identifier
    ? { ...rawUser, id: identifier, uuid: identifier }
    : rawUser;

  return NextResponse.json({
    user: {
      ...normalizedUser,
      mfaEnabled: derivedMfaEnabled,
      mfaPending: derivedMfaPending,
      mfa: normalizedMfa,
      role: normalizedRole,
      groups: normalizedGroups,
      permissions: normalizedPermissions,
      readOnly: normalizedReadOnly,
      proxyUuid: normalizedProxyUuid,
      proxyUuidExpiresAt: normalizedProxyUuidExpiresAt,
      tenantId: normalizedTenantId,
      tenants: normalizedTenants,
    },
  });
}

export async function DELETE(request: NextRequest) {
  void request;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await fetch(`${ACCOUNT_API_BASE}/session`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }).catch(() => null);
  }

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response, request.headers.get("host") ?? undefined);
  return response;
}
