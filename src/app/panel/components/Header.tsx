"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useUserStore } from "@lib/userStore";
import type { UserRole } from "@lib/userStore";
import { useLanguage } from "@i18n/LanguageProvider";
import { translations } from "@i18n/translations";

const ROLE_BADGES: Record<UserRole, { label: string; className: string }> = {
  guest: {
    label: "Guest",
    className: "bg-[var(--color-badge-muted)] text-[var(--color-text-subtle)]",
  },
  user: {
    label: "User",
    className:
      "bg-[var(--color-accent-muted)] text-[var(--color-accent-foreground)]",
  },
  operator: {
    label: "Operator",
    className:
      "bg-[var(--color-success-muted)] text-[var(--color-success-foreground)]",
  },
  admin: {
    label: "Admin",
    className: "bg-[var(--color-primary-muted)] text-[var(--color-primary)]",
  },
};

interface HeaderProps {
  onMenu: () => void;
  onCollapse?: () => void;
  isCollapsed?: boolean;
}

function resolveAccountInitial(input?: string | null) {
  if (!input) {
    return "?";
  }

  const normalized = input.trim();
  if (!normalized) {
    return "?";
  }

  return normalized.charAt(0).toUpperCase();
}

export default function Header({
  onMenu,
  onCollapse,
  isCollapsed,
}: HeaderProps) {
  const { language } = useLanguage();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const role: UserRole = user?.role ?? "guest";
  const badge = ROLE_BADGES[role];
  const accountLabel =
    user?.name ?? user?.username ?? user?.email ?? "Guest user";
  const accountInitial = resolveAccountInitial(accountLabel);
  const statusBadge = isLoading ? "Syncing" : badge.label;
  const badgeClasses = isLoading
    ? "bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)] opacity-70"
    : badge.className;

  const isRoot = useMemo(() => {
    const email = user?.email?.trim().toLowerCase() ?? "";
    return email === "admin@svc.plus" && role === "admin";
  }, [role, user?.email]);

  const [assumeStatus, setAssumeStatus] = useState<{
    isAssuming: boolean;
    target?: string;
  }>({
    isAssuming: false,
  });
  const [assumeBusy, setAssumeBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/sandbox/assume/status", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await res.json().catch(() => null)) as any;
        if (cancelled) return;
        setAssumeStatus({
          isAssuming: Boolean(payload?.isAssuming),
          target:
            typeof payload?.target === "string" ? payload.target : undefined,
        });
      } catch {
        if (cancelled) return;
        setAssumeStatus({ isAssuming: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAssumeSandbox = async () => {
    if (!isRoot || assumeBusy) return;
    try {
      setAssumeBusy(true);
      const res = await fetch("/api/sandbox/assume", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as any;
        throw new Error(
          (payload && (payload.message || payload.error)) ||
            `Assume failed (${res.status})`,
        );
      }
      router.refresh();
      // Ensure server-rendered parts reflect the new cookie immediately.
      window.location.reload();
    } finally {
      setAssumeBusy(false);
    }
  };

  const handleRevertAssume = async () => {
    if (assumeBusy) return;
    try {
      setAssumeBusy(true);
      const res = await fetch("/api/sandbox/assume/revert", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as any;
        throw new Error(
          (payload && (payload.message || payload.error)) ||
            `Revert failed (${res.status})`,
        );
      }
      router.refresh();
      window.location.reload();
    } finally {
      setAssumeBusy(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 overflow-hidden border-b border-[color:var(--color-surface-border)] bg-white/80 text-[var(--color-text)] shadow-[var(--shadow-soft)] backdrop-blur-xl transition-colors">
      {assumeStatus.isAssuming ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs md:px-6">
          <div className="rounded-[12px] border border-[color:var(--color-warning-muted)] bg-[var(--color-warning-muted)] px-3 py-1.5 text-[var(--color-warning-foreground)]">
            {language === "zh"
              ? `当前处于 Assume: ${assumeStatus.target || "sandbox@svc.plus"}（只读视角）`
              : `Assuming: ${assumeStatus.target || "sandbox@svc.plus"} (read-only view)`}
          </div>
          <button
            type="button"
            onClick={() => void handleRevertAssume()}
            disabled={assumeBusy}
            className="tactile-button tactile-button-subtle min-h-9 px-3 text-[var(--color-warning-foreground)] disabled:opacity-60"
          >
            {assumeBusy
              ? language === "zh"
                ? "处理中…"
                : "Working…"
              : language === "zh"
                ? "退出 Sandbox"
                : "Exit Sandbox"}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2 px-4 py-2 text-xs md:px-6">
          {isRoot ? (
            <button
              type="button"
              onClick={() => void handleAssumeSandbox()}
              disabled={assumeBusy || isLoading}
              className="tactile-button tactile-button-soft min-h-9 border border-[color:var(--color-primary-border)] px-3 text-[var(--color-primary)] disabled:opacity-60"
            >
              {assumeBusy
                ? language === "zh"
                  ? "处理中…"
                  : "Working…"
                : language === "zh"
                  ? "切换到 Sandbox"
                  : "Assume Sandbox"}
            </button>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="tactile-button tactile-button-soft gap-2 px-3 text-sm font-medium text-[var(--color-text-subtle)] md:hidden"
            onClick={onMenu}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>

          {onCollapse && (
            <button
              type="button"
              className="tactile-button tactile-button-soft hidden h-10 w-10 items-center justify-center p-0 text-[var(--color-text-subtle)] md:flex"
              onClick={onCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 md:justify-end">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="tactile-button tactile-button-soft gap-2 px-3 text-sm font-medium text-[var(--color-text-subtle)]"
            >
              返回主页
            </Link>
            <span
              className={`rounded-[12px] px-3 py-1.5 text-xs font-semibold ${badgeClasses}`}
            >
              {statusBadge}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-soft)] transition-colors">
              {isLoading ? (
                <span className="animate-pulse">…</span>
              ) : (
                accountInitial
              )}
            </div>
            <div className="hidden flex-col text-right text-xs text-[var(--color-text-subtle)] transition-colors sm:flex">
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {accountLabel}
              </span>
              <span>
                {user?.email ??
                  (isLoading ? "Checking session…" : "Not signed in")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
