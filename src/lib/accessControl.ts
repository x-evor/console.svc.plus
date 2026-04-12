import { useMemo } from "react";

import { useUserStore } from "./userStore";
import type { SessionUser, TenantMembership, UserRole } from "./userStore";

type AccessReason = "unauthenticated" | "forbidden";

export type AccessDecision = {
  allowed: boolean;
  reason?: AccessReason;
  userRole: UserRole | null;
  userTenants?: TenantMembership[];
  tenantId?: string;
};

export type AccessRule = {
  requireLogin?: boolean;
  allowGuests?: boolean;
  roles?: UserRole[];
  permissions?: string[];
};

const KNOWN_ROLES: UserRole[] = ["user", "operator", "admin"];

function normalizeRoles(roles?: UserRole[]): UserRole[] | undefined {
  if (!roles || roles.length === 0) {
    return undefined;
  }
  const known = new Set<UserRole>();
  for (const role of roles) {
    if (KNOWN_ROLES.includes(role)) {
      known.add(role);
    }
  }
  return known.size ? Array.from(known) : undefined;
}

function normalizePermissions(permissions?: string[]): string[] | undefined {
  if (!permissions || permissions.length === 0) {
    return undefined;
  }
  const known = new Set<string>();
  for (const permission of permissions) {
    const trimmed = permission.trim();
    if (trimmed.length > 0) {
      known.add(trimmed);
    }
  }
  return known.size ? Array.from(known) : undefined;
}

export function resolveAccess(
  user: SessionUser,
  rule?: AccessRule,
): AccessDecision {
  const normalizedRule = rule ?? {};
  const normalizedRoles = normalizeRoles(normalizedRule.roles);
  const normalizedPermissions = normalizePermissions(
    normalizedRule.permissions,
  );

  const allowGuests =
    normalizedRule.allowGuests ??
    (!normalizedRule.requireLogin &&
      !normalizedRoles &&
      !normalizedPermissions);
  const requiresLogin = Boolean(normalizedRule.requireLogin);

  if (!user) {
    if (
      requiresLogin ||
      !allowGuests ||
      Boolean(normalizedRoles?.length) ||
      Boolean(normalizedPermissions?.length)
    ) {
      return { allowed: false, reason: "unauthenticated", userRole: null };
    }

    return { allowed: true, userRole: null };
  }

  const role: UserRole = user.role;
  const userPermissions = new Set(user?.permissions ?? []);
  const roleAllowed = normalizedRoles
    ? normalizedRoles.includes(role)
    : undefined;
  const permissionAllowed = normalizedPermissions
    ? normalizedPermissions.every(
        (permission) =>
          userPermissions.has(permission) || userPermissions.has("*"),
      )
    : undefined;

  if (
    normalizedRoles &&
    normalizedPermissions &&
    normalizedRoles.length > 0 &&
    normalizedPermissions.length > 0
  ) {
    if (!roleAllowed && !permissionAllowed) {
      return {
        allowed: false,
        reason: "forbidden",
        userRole: role,
      };
    }
  } else if (normalizedRoles && !roleAllowed) {
    return {
      allowed: false,
      reason: "forbidden",
      userRole: role,
    };
  }

  if (
    !normalizedRoles &&
    normalizedPermissions &&
    normalizedPermissions.length > 0
  ) {
    const userPermissions = new Set(user?.permissions ?? []);
    const missing = normalizedPermissions.some(
      (permission) =>
        !userPermissions.has(permission) && !userPermissions.has("*"),
    );
    if (missing) {
      return {
        allowed: false,
        reason: "forbidden",
        userRole: role,
      };
    }
  }

  return {
    allowed: true,
    userRole: role,
    userTenants: user?.tenants,
    tenantId: user?.tenantId,
  };
}

export function useAccess(rule?: AccessRule) {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);

  const decision = useMemo(() => resolveAccess(user, rule), [user, rule]);

  return {
    ...decision,
    isLoading,
  };
}
