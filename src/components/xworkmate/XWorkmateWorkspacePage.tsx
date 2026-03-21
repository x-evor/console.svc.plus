"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ChevronsRight,
  Cloud,
  Cpu,
  Grip,
  KeyRound,
  ListTodo,
  MessageSquare,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/i18n/LanguageProvider";
import type { IntegrationDefaults } from "@/lib/openclaw/types";
import type { XWorkmateProfileResponse } from "@/lib/xworkmate/types";
import { cn } from "@/lib/utils";
import { useOpenClawConsoleStore } from "@/state/openclawConsoleStore";
import {
  OpenClawAssistantPane,
  type OpenClawAssistantViewState,
} from "@/components/openclaw/OpenClawAssistantPane";

type WorkspaceDestination =
  | "assistant"
  | "tasks"
  | "skills"
  | "nodes"
  | "agents"
  | "mcpServer"
  | "clawHub"
  | "secrets"
  | "aiGateway"
  | "settings"
  | "account";

type NavigationItem = {
  key: WorkspaceDestination;
  label: string;
  icon: LucideIcon;
};

type RailButtonProps = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
};

type DesktopChipProps = {
  label: string;
  icon?: LucideIcon;
  active?: boolean;
};

type CounterBadgeProps = {
  label: string;
  value: number;
};

type SessionSidebarProps = {
  isChinese: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreateTask: () => void;
  runningCount: number;
  currentCount: number;
  skillCount: number;
  taskTitle: string;
  taskPreview: string;
  taskUpdatedLabel: string;
  taskCount: number;
  hasVisibleTask: boolean;
  profileBadge?: string;
};

type WorkspaceHeaderProps = {
  isChinese: boolean;
  title: string;
  statusLabel: string;
  sessionLabel: string;
  connectionLabel: string;
};

type GatewayEmptyStateProps = {
  isChinese: boolean;
  canManageIntegrations: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  primaryActionLabel: string;
  secondaryActionLabel: string;
};

type EmptyComposerProps = {
  isChinese: boolean;
  actionLabel: string;
  onAction: () => void;
};

type PlaceholderPanelProps = {
  isChinese: boolean;
  sectionLabel: string;
  onReturnHome: () => void;
};

function pickCopy<T>(isChinese: boolean, zh: T, en: T): T {
  return isChinese ? zh : en;
}

function formatEndpoint(value: string, emptyLabel: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return emptyLabel;
  }

  try {
    const normalized = trimmed.replace(/^wss?:\/\//, "https://");
    return new URL(normalized).host;
  } catch {
    return trimmed;
  }
}

function resolveTaskTitle(
  label: string | undefined,
  fallbackKey: string,
  isChinese: boolean,
): string {
  const trimmed = label?.trim() ?? "";
  const normalizedFallback = fallbackKey.trim().toLowerCase();
  const normalizedLabel = trimmed.toLowerCase();

  if (
    !trimmed ||
    normalizedLabel === "main" ||
    normalizedLabel === "default task" ||
    normalizedFallback === "main" ||
    normalizedFallback === "agent:main:main"
  ) {
    return pickCopy(isChinese, "默认任务", "Default task");
  }

  return trimmed;
}

function formatRelativeTime(
  value: number | undefined,
  isChinese: boolean,
): string {
  if (!value) {
    return pickCopy(isChinese, "刚刚", "Just now");
  }

  const elapsedMs = Math.max(0, Date.now() - value);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (elapsedMinutes < 1) {
    return pickCopy(isChinese, "刚刚", "Just now");
  }

  if (elapsedMinutes < 60) {
    return pickCopy(
      isChinese,
      `${elapsedMinutes} 分钟前`,
      `${elapsedMinutes} min ago`,
    );
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return pickCopy(
      isChinese,
      `${elapsedHours} 小时前`,
      `${elapsedHours}h ago`,
    );
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return pickCopy(isChinese, `${elapsedDays} 天前`, `${elapsedDays}d ago`);
}

function buildNavigation(isChinese: boolean): {
  primaryItems: NavigationItem[];
  workspaceItems: NavigationItem[];
  toolItems: NavigationItem[];
  footerItems: NavigationItem[];
} {
  return {
    primaryItems: [
      {
        key: "assistant",
        label: pickCopy(isChinese, "主页", "Home"),
        icon: ListTodo,
      },
      {
        key: "tasks",
        label: pickCopy(isChinese, "任务", "Tasks"),
        icon: Briefcase,
      },
      {
        key: "skills",
        label: pickCopy(isChinese, "技能", "Skills"),
        icon: Sparkles,
      },
    ],
    workspaceItems: [
      {
        key: "nodes",
        label: pickCopy(isChinese, "节点", "Nodes"),
        icon: Grip,
      },
      {
        key: "agents",
        label: pickCopy(isChinese, "代理", "Agents"),
        icon: Bot,
      },
    ],
    toolItems: [
      {
        key: "mcpServer",
        label: "MCP Hub",
        icon: Cpu,
      },
      {
        key: "clawHub",
        label: "ClawHub",
        icon: Puzzle,
      },
      {
        key: "secrets",
        label: pickCopy(isChinese, "密钥", "Secrets"),
        icon: KeyRound,
      },
      {
        key: "aiGateway",
        label: "AI Gateway",
        icon: Cloud,
      },
    ],
    footerItems: [
      {
        key: "settings",
        label: pickCopy(isChinese, "设置", "Settings"),
        icon: Settings2,
      },
      {
        key: "account",
        label: pickCopy(isChinese, "账号", "Account"),
        icon: UserCircle2,
      },
    ],
  };
}

function RailButton({
  icon: Icon,
  label,
  active,
  onClick,
}: RailButtonProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-12 w-12 items-center justify-center rounded-[18px] border text-[var(--color-text-subtle)] transition-all",
        active
          ? "border-[color:var(--color-primary-border)] bg-[var(--color-primary)] text-white shadow-[0_16px_32px_rgba(37,99,235,0.24)]"
          : "border-transparent bg-white/72 hover:border-[color:var(--color-surface-border)] hover:bg-white hover:text-[var(--color-heading)]",
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

function DesktopChip({
  label,
  icon: Icon,
  active = false,
}: DesktopChipProps): ReactNode {
  return (
    <div
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
          : "border-[color:var(--color-surface-border)] bg-[rgba(246,248,251,0.94)] text-[var(--color-text-subtle)]",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{label}</span>
    </div>
  );
}

function CounterBadge({ label, value }: CounterBadgeProps): ReactNode {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-subtle)] shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function XWorkmateIconRail({
  navigation,
  activeSection,
  onSelect,
  sidebarExpanded,
  onToggleSidebar,
}: {
  navigation: ReturnType<typeof buildNavigation>;
  activeSection: WorkspaceDestination;
  onSelect: (section: WorkspaceDestination) => void;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
}): ReactNode {
  const groups = [
    navigation.primaryItems,
    navigation.workspaceItems,
    navigation.toolItems,
  ];

  return (
    <aside className="flex w-[76px] shrink-0 flex-col border-r border-white/80 bg-[rgba(249,250,253,0.82)] px-3 py-4 shadow-[0_28px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/90 bg-white text-[var(--color-heading)] shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
        <ListTodo className="h-[18px] w-[18px]" />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {groups.map((group, index) => (
          <div key={`group-${index}`} className="flex flex-col gap-2">
            {group.map((item) => (
              <RailButton
                key={item.key}
                icon={item.icon}
                label={item.label}
                active={item.key === activeSection}
                onClick={() => onSelect(item.key)}
              />
            ))}
            {index < groups.length - 1 ? (
              <div className="mx-auto my-1 h-px w-8 bg-[rgba(148,163,184,0.26)]" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {navigation.footerItems.map((item) => (
          <RailButton
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={item.key === activeSection}
            onClick={() => onSelect(item.key)}
          />
        ))}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="mt-2 flex h-12 w-12 items-center justify-center rounded-[18px] border border-transparent bg-white/72 text-[var(--color-text-subtle)] transition hover:border-[color:var(--color-surface-border)] hover:bg-white hover:text-[var(--color-heading)]"
          title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronsRight
            className={cn(
              "h-[18px] w-[18px] transition-transform",
              sidebarExpanded && "rotate-180",
            )}
          />
        </button>
      </div>
    </aside>
  );
}

function XWorkmateSessionSidebar({
  isChinese,
  searchValue,
  onSearchChange,
  onRefresh,
  onCreateTask,
  runningCount,
  currentCount,
  skillCount,
  taskTitle,
  taskPreview,
  taskUpdatedLabel,
  taskCount,
  hasVisibleTask,
  profileBadge,
}: SessionSidebarProps): ReactNode {
  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-r border-white/85 bg-[rgba(255,255,255,0.82)] p-4 shadow-[0_24px_44px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="rounded-[24px] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,252,0.94))] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={pickCopy(isChinese, "搜索任务", "Search tasks")}
              className="h-14 w-full rounded-[18px] border border-[color:var(--color-surface-border)] bg-white pl-11 pr-4 text-base text-[var(--color-heading)] outline-none transition focus:border-[color:var(--color-primary-border)]"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-[color:var(--color-surface-border)] bg-white text-[var(--color-text-subtle)] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:text-[var(--color-heading)]"
            aria-label={pickCopy(
              isChinese,
              "刷新任务列表",
              "Refresh task list",
            )}
            title={pickCopy(isChinese, "刷新任务列表", "Refresh task list")}
          >
            <RefreshCw className="h-[18px] w-[18px]" />
          </button>
        </div>

        <button
          type="button"
          onClick={onCreateTask}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--color-primary)] px-4 text-base font-semibold text-white shadow-[0_18px_32px_rgba(37,99,235,0.24)] transition hover:bg-[var(--color-primary-hover)]"
        >
          <Plus className="h-4 w-4" />
          <span>{pickCopy(isChinese, "新对话", "New task")}</span>
        </button>

        <div className="mt-4 flex flex-wrap gap-2">
          <CounterBadge
            label={pickCopy(isChinese, "运行中", "Running")}
            value={runningCount}
          />
          <CounterBadge
            label={pickCopy(isChinese, "当前", "Current")}
            value={currentCount}
          />
          <CounterBadge
            label={pickCopy(isChinese, "技能", "Skills")}
            value={skillCount}
          />
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[var(--color-heading)]">
            {pickCopy(isChinese, "任务列表", "Task list")}
          </h2>
          <span className="text-lg font-semibold text-[var(--color-text-subtle)]">
            {taskCount}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-base font-semibold text-[var(--color-text-subtle)]">
          <Cloud className="h-4 w-4" />
          <span>{pickCopy(isChinese, "仅 AI Gateway", "AI Gateway only")}</span>
          <span>{taskCount}</span>
        </div>

        {hasVisibleTask ? (
          <button
            type="button"
            onClick={onCreateTask}
            className="mt-3 block w-full rounded-[18px] border border-[color:var(--color-primary-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,252,0.98))] px-4 py-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition hover:border-[color:var(--color-primary)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[color:var(--color-surface-border)] bg-white text-[var(--color-primary)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-lg font-semibold text-[var(--color-heading)]">
                    {taskTitle}
                  </div>
                  <div className="shrink-0 text-sm font-medium text-[var(--color-text-subtle)]">
                    {taskUpdatedLabel}
                  </div>
                </div>
                <div className="mt-1 truncate text-sm text-[var(--color-text-subtle)]">
                  {taskPreview}
                </div>
              </div>
            </div>
          </button>
        ) : (
          <div className="mt-3 rounded-[18px] border border-dashed border-[color:var(--color-surface-border)] bg-white/86 px-4 py-6 text-center text-sm text-[var(--color-text-subtle)]">
            {pickCopy(
              isChinese,
              "没有匹配的任务，试试换个关键词。",
              "No matching task yet. Try a different keyword.",
            )}
          </div>
        )}
      </div>

      {profileBadge ? (
        <div className="mt-4 rounded-[18px] border border-[color:var(--color-surface-border)] bg-white/92 px-4 py-3 text-sm text-[var(--color-text-subtle)] shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-[var(--color-heading)]">
            <Shield className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="font-semibold">{profileBadge}</span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function XWorkmateWorkspaceHeader({
  isChinese,
  title,
  statusLabel,
  sessionLabel,
  connectionLabel,
}: WorkspaceHeaderProps): ReactNode {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--color-surface-border)] bg-[rgba(255,255,255,0.92)] px-5 py-4 shadow-[0_16px_30px_rgba(15,23,42,0.04)]">
      <div className="min-w-0">
        <h1 className="truncate text-[34px] font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
          {title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <DesktopChip label={statusLabel} active />
          <DesktopChip label="AI Gateway" icon={Cloud} />
          <DesktopChip label="Assistant" icon={MessageSquare} />
          <DesktopChip label={sessionLabel} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DesktopChip
          label={pickCopy(isChinese, "渲染", "Render")}
          icon={Sparkles}
        />
        <DesktopChip label={connectionLabel} />
      </div>
    </header>
  );
}

function XWorkmateGatewayEmptyState({
  isChinese,
  canManageIntegrations,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel,
  secondaryActionLabel,
}: GatewayEmptyStateProps): ReactNode {
  const description = canManageIntegrations
    ? pickCopy(
        isChinese,
        "请先在 Settings -> AI Gateway 中配置地址、API Key 和默认模型，然后继续当前任务。",
        "Set the endpoint, API key, and default model in Settings -> AI Gateway before continuing this task.",
      )
    : pickCopy(
        isChinese,
        "当前工作台使用共享连接配置。请联系管理员完成 AI Gateway 配置，然后回到当前任务继续。",
        "This workspace uses a shared integration profile. Ask an administrator to finish the AI Gateway setup, then continue here.",
      );

  return (
    <div className="flex h-full items-center justify-center px-6 py-12">
      <div className="w-full max-w-[620px] rounded-[24px] border border-[color:var(--color-surface-border)] bg-white/96 p-6 shadow-[0_28px_54px_rgba(15,23,42,0.08)]">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
          <Cloud className="h-5 w-5" />
        </div>

        <h2 className="mt-5 text-[38px] font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
          {pickCopy(
            isChinese,
            "先配置 AI Gateway",
            "Configure AI Gateway first",
          )}
        </h2>
        <p className="mt-3 max-w-[520px] text-lg leading-8 text-[var(--color-text-subtle)]">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[16px] bg-[var(--color-primary)] px-5 text-base font-semibold text-white shadow-[0_18px_32px_rgba(37,99,235,0.24)] transition hover:bg-[var(--color-primary-hover)]"
          >
            <Settings2 className="h-4 w-4" />
            {primaryActionLabel}
          </button>
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[16px] border border-[color:var(--color-surface-border)] bg-white px-5 text-base font-semibold text-[var(--color-heading)] shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition hover:border-[color:var(--color-primary-border)]"
          >
            <Cloud className="h-4 w-4" />
            {secondaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function XWorkmateEmptyComposer({
  isChinese,
  actionLabel,
  onAction,
}: EmptyComposerProps): ReactNode {
  return (
    <div className="border-t border-[color:var(--color-surface-border)] bg-[rgba(255,255,255,0.92)] px-5 py-4">
      <div className="rounded-[24px] border border-[color:var(--color-surface-border)] bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-[color:var(--color-surface-border)] bg-[rgba(246,248,251,0.98)] text-[var(--color-text-subtle)]"
            aria-label={pickCopy(isChinese, "添加附件", "Add attachment")}
          >
            <Plus className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 rounded-[18px] border border-[color:var(--color-surface-border)] bg-[rgba(248,250,252,0.82)] px-4 py-4 text-base text-[var(--color-text-subtle)]">
            {pickCopy(
              isChinese,
              "输入后 XWorkmate 会沿用当前任务上下文持续处理。",
              "XWorkmate will continue from the current task context after the gateway is configured.",
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] bg-[rgba(246,248,251,0.94)] px-3 text-sm font-semibold text-[var(--color-text-subtle)]">
            <Sparkles className="h-4 w-4" />
            {pickCopy(isChinese, "技能", "Skills")}
          </div>
          <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] bg-[rgba(246,248,251,0.94)] px-3 text-sm font-semibold text-[var(--color-text-subtle)]">
            <Bot className="h-4 w-4" />
            {pickCopy(isChinese, "高", "High")}
          </div>

          <button
            type="button"
            onClick={onAction}
            className="ml-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-[16px] bg-[var(--color-primary)] px-5 text-base font-semibold text-white shadow-[0_18px_32px_rgba(37,99,235,0.24)] transition hover:bg-[var(--color-primary-hover)]"
          >
            <Cloud className="h-4 w-4" />
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function XWorkmatePlaceholderPanel({
  isChinese,
  sectionLabel,
  onReturnHome,
}: PlaceholderPanelProps): ReactNode {
  return (
    <div className="flex h-full items-center justify-center px-6 py-12">
      <div className="w-full max-w-[560px] rounded-[24px] border border-[color:var(--color-surface-border)] bg-white/96 p-6 text-center shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-[34px] font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
          {sectionLabel}
        </h2>
        <p className="mt-3 text-lg leading-8 text-[var(--color-text-subtle)]">
          {pickCopy(
            isChinese,
            "本次在线版优先复刻桌面端 assistant 首页，这个入口先保留导航位，不在当前改造范围内。",
            "This pass focuses on the desktop-aligned assistant home. This destination stays as a navigation stub for now.",
          )}
        </p>
        <button
          type="button"
          onClick={onReturnHome}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-[16px] bg-[var(--color-primary)] px-5 text-base font-semibold text-white shadow-[0_18px_32px_rgba(37,99,235,0.24)] transition hover:bg-[var(--color-primary-hover)]"
        >
          <ChevronRight className="h-4 w-4" />
          {pickCopy(isChinese, "返回默认任务", "Back to default task")}
        </button>
      </div>
    </div>
  );
}

export function XWorkmateWorkspacePage({
  defaults,
  profile,
  scopeKey,
  requestHost,
  initialPrompt = "",
  initialSessionKey = "",
}: {
  defaults: IntegrationDefaults;
  profile?: XWorkmateProfileResponse | null;
  scopeKey: string;
  requestHost?: string;
  initialPrompt?: string;
  initialSessionKey?: string;
}) {
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const router = useRouter();
  const [activeSection, setActiveSection] =
    useState<WorkspaceDestination>("assistant");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [assistantState, setAssistantState] =
    useState<OpenClawAssistantViewState | null>(null);

  const setScope = useOpenClawConsoleStore((state) => state.setScope);
  const applyDefaults = useOpenClawConsoleStore((state) => state.applyDefaults);
  const setSelectedSessionKey = useOpenClawConsoleStore(
    (state) => state.setSelectedSessionKey,
  );
  const selectedSessionKey = useOpenClawConsoleStore(
    (state) => state.selectedSessionKey,
  );
  const openclawUrl = useOpenClawConsoleStore((state) => state.openclawUrl);
  const vaultUrl = useOpenClawConsoleStore((state) => state.vaultUrl);
  const apisixUrl = useOpenClawConsoleStore((state) => state.apisixUrl);

  useEffect(() => {
    setScope(scopeKey, defaults);
    applyDefaults(defaults);
  }, [applyDefaults, defaults, scopeKey, setScope]);

  useEffect(() => {
    if (!initialSessionKey.trim()) {
      return;
    }

    setSelectedSessionKey(initialSessionKey.trim());
  }, [initialSessionKey, setSelectedSessionKey]);

  const navigation = useMemo(() => buildNavigation(isChinese), [isChinese]);
  const activeItem = useMemo(() => {
    const items = [
      ...navigation.primaryItems,
      ...navigation.workspaceItems,
      ...navigation.toolItems,
      ...navigation.footerItems,
    ];
    return items.find((item) => item.key === activeSection) ?? items[0];
  }, [activeSection, navigation]);

  const openclawEndpoint = openclawUrl || defaults.openclawUrl;
  const connected = Boolean(openclawEndpoint.trim());
  const endpointLabel = formatEndpoint(
    openclawEndpoint,
    pickCopy(isChinese, "AI Gateway 未配置", "AI Gateway not configured"),
  );
  const configuredCount = [
    openclawEndpoint,
    vaultUrl || defaults.vaultUrl,
    apisixUrl || defaults.apisixUrl,
  ].filter((item) => item.trim().length > 0).length;

  const integrationRoute =
    profile?.profileScope === "tenant-shared"
      ? "/xworkmate/admin"
      : "/xworkmate/integrations";
  const canManageIntegrations = profile
    ? Boolean(profile.canEditIntegrations)
    : true;
  const profileBadge = profile
    ? [
        profile.edition === "shared_public"
          ? pickCopy(isChinese, "共享版", "Shared edition")
          : pickCopy(isChinese, "租户独享版", "Tenant edition"),
        profile.membershipRole,
        requestHost ?? "",
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  const taskTitle = resolveTaskTitle(
    assistantState?.selectedSessionLabel,
    selectedSessionKey || initialSessionKey || "main",
    isChinese,
  );
  const lastMessage =
    assistantState && assistantState.messages.length > 0
      ? assistantState.messages[assistantState.messages.length - 1]
      : undefined;
  const taskPreview =
    lastMessage?.text?.trim() ||
    pickCopy(
      isChinese,
      "连接配置完成后，当前任务会在这里持续同步状态与结果。",
      "Once the gateway is configured, the current task will keep syncing progress and results here.",
    );
  const taskUpdatedLabel = formatRelativeTime(
    lastMessage?.timestampMs,
    isChinese,
  );
  const runningCount =
    assistantState?.connectionState === "connecting" ||
    Boolean(assistantState?.streamingText.trim())
      ? 1
      : 0;
  const currentCount =
    (assistantState?.messages.length ?? 0) > 0 ||
    Boolean(assistantState?.streamingText.trim())
      ? 1
      : 0;
  const taskCount = searchValue.trim()
    ? taskTitle.toLowerCase().includes(searchValue.trim().toLowerCase())
      ? 1
      : 0
    : 1;
  const hasVisibleTask = taskCount > 0;
  const statusLabel = connected
    ? runningCount > 0
      ? pickCopy(isChinese, "运行中", "Running")
      : pickCopy(isChinese, "当前任务", "Current task")
    : pickCopy(isChinese, "排队中", "Queued");
  const connectionLabel = connected
    ? `${pickCopy(isChinese, "仅 AI Gateway", "AI Gateway only")} · ${endpointLabel}`
    : `${pickCopy(isChinese, "仅 AI Gateway", "AI Gateway only")} · ${pickCopy(
        isChinese,
        "AI Gateway 未配置",
        "AI Gateway not configured",
      )}`;
  const primaryActionLabel = canManageIntegrations
    ? pickCopy(isChinese, "配置 AI Gateway", "Configure AI Gateway")
    : pickCopy(isChinese, "查看 AI Gateway", "View AI Gateway");
  const secondaryActionLabel = canManageIntegrations
    ? pickCopy(isChinese, "打开 AI Gateway", "Open AI Gateway")
    : pickCopy(isChinese, "等待管理员配置", "Await admin setup");

  const openIntegrations = () => {
    router.push(integrationRoute);
  };

  const resetToDefaultTask = () => {
    setActiveSection("assistant");
    setSelectedSessionKey("");
  };

  return (
    <div className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#f5f7fb_0%,#f7f9fc_38%,#f4f6fa_100%)] text-[var(--color-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.06),transparent_24%)]" />

      <div className="relative flex h-full min-h-0">
        <XWorkmateIconRail
          navigation={navigation}
          activeSection={activeSection}
          onSelect={setActiveSection}
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded((current) => !current)}
        />

        {sidebarExpanded ? (
          <XWorkmateSessionSidebar
            isChinese={isChinese}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onRefresh={() => setSearchValue("")}
            onCreateTask={resetToDefaultTask}
            runningCount={runningCount}
            currentCount={currentCount}
            skillCount={0}
            taskTitle={taskTitle}
            taskPreview={taskPreview}
            taskUpdatedLabel={taskUpdatedLabel}
            taskCount={taskCount}
            hasVisibleTask={hasVisibleTask}
            profileBadge={profileBadge}
          />
        ) : null}

        <main className="min-w-0 flex-1 p-3">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/85 bg-[rgba(255,255,255,0.70)] shadow-[0_30px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <XWorkmateWorkspaceHeader
              isChinese={isChinese}
              title={
                activeSection === "assistant" ? taskTitle : activeItem.label
              }
              statusLabel={statusLabel}
              sessionLabel={taskTitle}
              connectionLabel={connectionLabel}
            />

            {activeSection === "assistant" ? (
              <>
                <div className="min-h-0 flex-1 bg-[linear-gradient(180deg,rgba(249,250,252,0.72),rgba(245,247,250,0.84))]">
                  {connected ? (
                    <div className="h-full p-4">
                      <OpenClawAssistantPane
                        defaults={defaults}
                        initialQuestion={initialPrompt}
                        initialQuestionKey={initialPrompt ? 1 : undefined}
                        initialSessionKey={initialSessionKey}
                        autoSubmitInitialQuestion={false}
                        variant="page"
                        integrationsHref={integrationRoute}
                        onStateChange={setAssistantState}
                      />
                    </div>
                  ) : (
                    <XWorkmateGatewayEmptyState
                      isChinese={isChinese}
                      canManageIntegrations={canManageIntegrations}
                      onPrimaryAction={openIntegrations}
                      onSecondaryAction={openIntegrations}
                      primaryActionLabel={primaryActionLabel}
                      secondaryActionLabel={secondaryActionLabel}
                    />
                  )}
                </div>

                {!connected ? (
                  <XWorkmateEmptyComposer
                    isChinese={isChinese}
                    actionLabel={primaryActionLabel}
                    onAction={openIntegrations}
                  />
                ) : null}
              </>
            ) : (
              <div className="min-h-0 flex-1 bg-[linear-gradient(180deg,rgba(249,250,252,0.72),rgba(245,247,250,0.84))]">
                <XWorkmatePlaceholderPanel
                  isChinese={isChinese}
                  sectionLabel={activeItem.label}
                  onReturnHome={resetToDefaultTask}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="pointer-events-none absolute right-8 top-7 hidden items-center gap-2 rounded-full border border-white/85 bg-white/90 px-3 py-2 text-xs font-semibold text-[var(--color-text-subtle)] shadow-[0_14px_28px_rgba(15,23,42,0.05)] xl:inline-flex">
        <Shield className="h-3.5 w-3.5 text-[var(--color-primary)]" />
        <span>
          {connected
            ? `${pickCopy(isChinese, "网关在线", "Gateway online")} · ${configuredCount}/3`
            : `${pickCopy(isChinese, "集成概况", "Integrations")} · ${configuredCount}/3`}
        </span>
      </div>
    </div>
  );
}
