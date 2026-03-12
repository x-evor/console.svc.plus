"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Blocks,
  Bot,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronsLeftRight,
  Cloud,
  KeyRound,
  LayoutDashboard,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserCircle2,
  Vault,
  Waypoints,
  Workflow,
} from "lucide-react";

import LanguageToggle from "@/components/LanguageToggle";
import { OpenClawAssistantPane } from "@/components/openclaw/OpenClawAssistantPane";
import { useTheme } from "@/components/theme";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { useUserStore } from "@/lib/userStore";
import { cn } from "@/lib/utils";
import Card from "@/modules/extensions/builtin/user-center/components/Card";
import { IntegrationsConsole } from "@/modules/extensions/builtin/user-center/components/IntegrationsConsole";
import { useOpenClawConsoleStore } from "@/state/openclawConsoleStore";

type WorkspaceDestination =
  | "assistant"
  | "tasks"
  | "modules"
  | "secrets"
  | "settings"
  | "account";
type SidebarState = "expanded" | "collapsed" | "hidden";

interface SectionTab {
  key: string;
  label: string;
}

interface SectionDefinition {
  key: WorkspaceDestination;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  tabs: SectionTab[];
}

interface SidebarSectionButtonProps {
  section: SectionDefinition;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

interface UtilityButtonProps {
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
}

interface SurfaceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  body?: string;
  action?: ReactNode;
}

interface StatusRowProps {
  label: string;
  value: string;
  ok?: boolean;
}

interface OverviewMetric {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
}

const INITIAL_TABS: Record<WorkspaceDestination, string> = {
  assistant: "workspace",
  tasks: "queue",
  modules: "gateway",
  secrets: "vault",
  settings: "integrations",
  account: "profile",
};

function pickCopy(isChinese: boolean, zh: string, en: string): string {
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

function createSections(isChinese: boolean): SectionDefinition[] {
  return [
    {
      key: "assistant",
      label: pickCopy(isChinese, "助手", "Assistant"),
      shortLabel: pickCopy(isChinese, "助手", "AI"),
      description: pickCopy(
        isChinese,
        "在线版 XWorkmate 主页，承接对话、截图与执行入口。",
        "The online XWorkmate home for chat, screenshots, and execution.",
      ),
      icon: Sparkles,
      tabs: [],
    },
    {
      key: "tasks",
      label: pickCopy(isChinese, "任务", "Tasks"),
      shortLabel: pickCopy(isChinese, "任务", "Tasks"),
      description: pickCopy(
        isChinese,
        "查看队列、运行态和历史会话，保持与桌面端一致的任务视角。",
        "Queue, running work, and history in the same structure as desktop.",
      ),
      icon: Briefcase,
      tabs: [
        { key: "queue", label: pickCopy(isChinese, "队列", "Queue") },
        { key: "running", label: pickCopy(isChinese, "运行中", "Running") },
        { key: "history", label: pickCopy(isChinese, "历史", "History") },
        { key: "failed", label: pickCopy(isChinese, "失败", "Failed") },
        { key: "scheduled", label: pickCopy(isChinese, "定时", "Scheduled") },
      ],
    },
    {
      key: "modules",
      label: pickCopy(isChinese, "模块", "Modules"),
      shortLabel: pickCopy(isChinese, "模块", "Mods"),
      description: pickCopy(
        isChinese,
        "围绕网关、节点、代理和连接器组织在线工作区能力。",
        "Gateway, nodes, agents, skills, and connectors for the online workspace.",
      ),
      icon: Blocks,
      tabs: [
        { key: "gateway", label: pickCopy(isChinese, "Gateway", "Gateway") },
        { key: "nodes", label: pickCopy(isChinese, "节点", "Nodes") },
        { key: "agents", label: pickCopy(isChinese, "代理", "Agents") },
        { key: "skills", label: pickCopy(isChinese, "技能", "Skills") },
        { key: "clawhub", label: "ClawHub" },
        {
          key: "connectors",
          label: pickCopy(isChinese, "连接器", "Connectors"),
        },
      ],
    },
    {
      key: "secrets",
      label: pickCopy(isChinese, "密钥", "Secrets"),
      shortLabel: pickCopy(isChinese, "密钥", "Keys"),
      description: pickCopy(
        isChinese,
        "统一管理 Vault、本地会话覆盖和模型接入凭证。",
        "Manage Vault, session overrides, and provider credentials.",
      ),
      icon: KeyRound,
      tabs: [
        { key: "vault", label: "Vault" },
        {
          key: "local-store",
          label: pickCopy(isChinese, "本地存储", "Local Store"),
        },
        { key: "providers", label: pickCopy(isChinese, "提供方", "Providers") },
        { key: "audit", label: pickCopy(isChinese, "审计", "Audit") },
      ],
    },
    {
      key: "settings",
      label: pickCopy(isChinese, "设置", "Settings"),
      shortLabel: pickCopy(isChinese, "设置", "Prefs"),
      description: pickCopy(
        isChinese,
        "把接口集成、外观和诊断入口收敛到一个在线设置中心。",
        "Bring integrations, appearance, and diagnostics into one settings hub.",
      ),
      icon: LayoutDashboard,
      tabs: [
        { key: "general", label: pickCopy(isChinese, "通用", "General") },
        { key: "workspace", label: pickCopy(isChinese, "工作区", "Workspace") },
        {
          key: "integrations",
          label: pickCopy(isChinese, "集成", "Integrations"),
        },
        { key: "appearance", label: pickCopy(isChinese, "外观", "Appearance") },
        {
          key: "diagnostics",
          label: pickCopy(isChinese, "诊断", "Diagnostics"),
        },
        {
          key: "experimental",
          label: pickCopy(isChinese, "实验性", "Experimental"),
        },
        { key: "about", label: pickCopy(isChinese, "关于", "About") },
      ],
    },
    {
      key: "account",
      label: pickCopy(isChinese, "账号", "Account"),
      shortLabel: pickCopy(isChinese, "账号", "Me"),
      description: pickCopy(
        isChinese,
        "查看当前身份、工作区和会话信息。",
        "Profile, workspace, and current session information.",
      ),
      icon: UserCircle2,
      tabs: [
        { key: "profile", label: pickCopy(isChinese, "资料", "Profile") },
        { key: "workspace", label: pickCopy(isChinese, "工作区", "Workspace") },
        { key: "sessions", label: pickCopy(isChinese, "会话", "Sessions") },
      ],
    },
  ];
}

function SidebarSectionButton({
  section,
  active,
  collapsed,
  onClick,
}: SidebarSectionButtonProps) {
  const Icon = section.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={section.label}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[var(--radius-xl)] border px-3 py-3 text-left transition",
        active
          ? "border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]"
          : "border-transparent text-[var(--color-text-subtle)] hover:border-[color:var(--color-surface-border)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
        collapsed ? "justify-center px-2" : "",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition",
          active
            ? "border-[color:var(--color-primary-border)] bg-white/80 text-[var(--color-primary)]"
            : "border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)] group-hover:text-[var(--color-text)]",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{section.label}</p>
          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-subtle)]">
            {section.description}
          </p>
        </div>
      ) : null}
    </button>
  );
}

function UtilityButton({
  label,
  icon: Icon,
  collapsed,
  active = false,
  onClick,
}: UtilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius-xl)] border px-3 py-2.5 text-sm font-medium transition",
        active
          ? "border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
          : "border-transparent text-[var(--color-text-subtle)] hover:border-[color:var(--color-surface-border)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
        collapsed ? "justify-center px-2" : "",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </button>
  );
}

function SurfaceCard({
  icon: Icon,
  title,
  description,
  body,
  action,
}: SurfaceCardProps) {
  return (
    <Card className="space-y-4 bg-[var(--color-surface)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[var(--color-heading)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--color-text-subtle)]">
            {description}
          </p>
        </div>
      </div>
      {body ? (
        <p className="text-sm leading-6 text-[var(--color-text)]">{body}</p>
      ) : null}
      {action ? <div>{action}</div> : null}
    </Card>
  );
}

function StatusRow({ label, value, ok }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{value}</p>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
          ok
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)]",
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            ok ? "bg-emerald-500" : "bg-[var(--color-text-subtle)]/50",
          )}
        />
        {ok ? "ready" : "pending"}
      </span>
    </div>
  );
}

function OverviewMetrics({ items }: { items: OverviewMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={`${item.label}-${item.value}`}
            className="space-y-3 border-[color:var(--color-surface-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-heading)]">
                  {item.value}
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-subtle)]">
              {item.caption}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

export function XWorkmateWorkspacePage({
  defaults,
}: {
  defaults: IntegrationDefaults;
}) {
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const sections = useMemo(() => createSections(isChinese), [isChinese]);
  const [activeSection, setActiveSection] =
    useState<WorkspaceDestination>("assistant");
  const [activeTabs, setActiveTabs] =
    useState<Record<WorkspaceDestination, string>>(INITIAL_TABS);
  const [sidebarState, setSidebarState] = useState<SidebarState>("expanded");
  const { resolvedTheme, toggleTheme, isDark } = useTheme();
  const user = useUserStore((state) => state.user);

  const openclawUrl = useOpenClawConsoleStore((state) => state.openclawUrl);
  const openclawToken = useOpenClawConsoleStore((state) => state.openclawToken);
  const vaultUrl = useOpenClawConsoleStore((state) => state.vaultUrl);
  const vaultNamespace = useOpenClawConsoleStore(
    (state) => state.vaultNamespace,
  );
  const vaultToken = useOpenClawConsoleStore((state) => state.vaultToken);
  const apisixUrl = useOpenClawConsoleStore((state) => state.apisixUrl);
  const apisixToken = useOpenClawConsoleStore((state) => state.apisixToken);
  const assistantMode = useOpenClawConsoleStore((state) => state.assistantMode);
  const thinking = useOpenClawConsoleStore((state) => state.thinking);
  const selectedSessionKey = useOpenClawConsoleStore(
    (state) => state.selectedSessionKey,
  );

  const activeDefinition =
    sections.find((section) => section.key === activeSection) ?? sections[0];
  const activeTab = activeTabs[activeSection];
  const collapsed = sidebarState === "collapsed";

  const integrationRows = useMemo(
    () => [
      {
        label: "OpenClaw Gateway",
        value: formatEndpoint(
          openclawUrl || defaults.openclawUrl,
          pickCopy(isChinese, "等待地址", "Awaiting endpoint"),
        ),
        ok: Boolean((openclawUrl || defaults.openclawUrl).trim()),
      },
      {
        label: "Vault Server",
        value: formatEndpoint(
          vaultUrl || defaults.vaultUrl,
          pickCopy(isChinese, "未配置", "Not configured"),
        ),
        ok: Boolean((vaultUrl || defaults.vaultUrl).trim()),
      },
      {
        label: "APISIX AI Gateway",
        value: formatEndpoint(
          apisixUrl || defaults.apisixUrl,
          pickCopy(isChinese, "未配置", "Not configured"),
        ),
        ok: Boolean((apisixUrl || defaults.apisixUrl).trim()),
      },
    ],
    [
      apisixUrl,
      defaults.apisixUrl,
      defaults.openclawUrl,
      defaults.vaultUrl,
      isChinese,
      openclawUrl,
      vaultUrl,
    ],
  );

  const accountName =
    user?.name?.trim() ||
    user?.username?.trim() ||
    pickCopy(isChinese, "访客用户", "Guest user");
  const accountEmail = user?.email || "sandbox@svc.plus";
  const workspaceName =
    user?.tenants?.[0]?.name ||
    pickCopy(isChinese, "默认工作区", "Default workspace");
  const openclawEndpoint = openclawUrl || defaults.openclawUrl;
  const vaultEndpoint = vaultUrl || defaults.vaultUrl;
  const configuredIntegrationCount = integrationRows.filter(
    (item) => item.ok,
  ).length;

  const tasksOverview = useMemo<OverviewMetric[]>(
    () => [
      {
        label: pickCopy(isChinese, "总数", "Total"),
        value: selectedSessionKey ? "1+" : "0",
        caption: pickCopy(
          isChinese,
          "从当前会话与对话中派生",
          "Derived from the current session and chat",
        ),
        icon: Briefcase,
      },
      {
        label: pickCopy(isChinese, "运行中", "Running"),
        value: openclawEndpoint.trim()
          ? pickCopy(isChinese, "已就绪", "Ready")
          : pickCopy(isChinese, "离线", "Offline"),
        caption: pickCopy(
          isChinese,
          "主助手承接实时执行流",
          "The main assistant owns live execution",
        ),
        icon: Sparkles,
      },
      {
        label: pickCopy(isChinese, "失败", "Failed"),
        value:
          openclawToken.trim() || defaults.openclawTokenConfigured
            ? "0"
            : "pairing",
        caption: pickCopy(
          isChinese,
          "未配置 shared token 时优先走 pairing",
          "Pairing is preferred when no shared token is set",
        ),
        icon: ShieldCheck,
      },
      {
        label: pickCopy(isChinese, "计划中", "Scheduled"),
        value: pickCopy(isChinese, "预留", "Later"),
        caption: pickCopy(
          isChinese,
          "后续承接 cron / batch 任务",
          "Reserved for future cron and batch work",
        ),
        icon: Workflow,
      },
    ],
    [
      defaults.openclawTokenConfigured,
      isChinese,
      openclawEndpoint,
      openclawToken,
      selectedSessionKey,
    ],
  );

  const modulesOverview = useMemo<OverviewMetric[]>(
    () => [
      {
        label: "Gateway",
        value: formatEndpoint(
          openclawEndpoint,
          pickCopy(isChinese, "未接入", "Not connected"),
        ),
        caption: pickCopy(
          isChinese,
          "当前公开入口仍由 XWorkmate 统一承接",
          "The public workspace is still unified under XWorkmate",
        ),
        icon: Cloud,
      },
      {
        label: pickCopy(isChinese, "节点", "Nodes"),
        value: pickCopy(isChinese, "控制台", "Console"),
        caption: pickCopy(
          isChinese,
          "节点与加速资源仍由控制台管理",
          "Nodes and acceleration resources remain in the console",
        ),
        icon: Waypoints,
      },
      {
        label: pickCopy(isChinese, "代理", "Agents"),
        value: pickCopy(isChinese, "自动", "Auto"),
        caption: pickCopy(
          isChinese,
          "根据对话内容切换 coding / research / browser",
          "Switch between coding / research / browser by task",
        ),
        icon: Bot,
      },
      {
        label: pickCopy(isChinese, "技能", "Skills"),
        value: pickCopy(isChinese, "截图 + 附件", "Capture + Files"),
        caption: pickCopy(
          isChinese,
          "截图、图片、日志与文本共用同一入口",
          "Screenshots, images, logs, and text share one flow",
        ),
        icon: Blocks,
      },
    ],
    [isChinese, openclawEndpoint],
  );

  const secretsOverview = useMemo<OverviewMetric[]>(
    () => [
      {
        label: pickCopy(isChinese, "提供方", "Provider"),
        value: vaultEndpoint.trim()
          ? "Vault"
          : pickCopy(isChinese, "会话", "Session"),
        caption: pickCopy(
          isChinese,
          "优先使用 Vault，必要时允许当前会话覆盖",
          "Prefer Vault, allow session overrides when needed",
        ),
        icon: Vault,
      },
      {
        label: pickCopy(isChinese, "Token 引用", "Token Refs"),
        value: `${
          [
            openclawToken.trim() || defaults.openclawTokenConfigured,
            vaultToken.trim() || defaults.vaultTokenConfigured,
            apisixToken.trim() || defaults.apisixTokenConfigured,
          ].filter(Boolean).length
        }`,
        caption: pickCopy(
          isChinese,
          "env 与会话级覆盖共同组成引用面",
          "Refs are composed from env defaults and session overrides",
        ),
        icon: KeyRound,
      },
      {
        label: pickCopy(isChinese, "密钥引用", "Secret Refs"),
        value: `${configuredIntegrationCount}/3`,
        caption: pickCopy(
          isChinese,
          "按 OpenClaw / Vault / APISIX 三类集成统计",
          "Counted across OpenClaw / Vault / APISIX integrations",
        ),
        icon: ShieldCheck,
      },
      {
        label: pickCopy(isChinese, "最近审计", "Last Audit"),
        value: pickCopy(isChinese, "当前会话", "This session"),
        caption: pickCopy(
          isChinese,
          "前端只保留脱敏引用，不暴露原始值",
          "The UI keeps masked refs only and never exposes raw values",
        ),
        icon: Workflow,
      },
    ],
    [
      apisixToken,
      configuredIntegrationCount,
      defaults.apisixTokenConfigured,
      defaults.openclawTokenConfigured,
      defaults.vaultTokenConfigured,
      isChinese,
      openclawToken,
      vaultEndpoint,
      vaultToken,
    ],
  );

  const settingsOverview = useMemo<OverviewMetric[]>(
    () => [
      {
        label: pickCopy(isChinese, "入口", "Route"),
        value: "/xworkmate",
        caption: pickCopy(
          isChinese,
          "旧 `/services/openclaw` 只保留兼容跳转",
          "The old `/services/openclaw` path is compatibility-only",
        ),
        icon: LayoutDashboard,
      },
      {
        label: pickCopy(isChinese, "外观", "Appearance"),
        value: resolvedTheme,
        caption: pickCopy(
          isChinese,
          "与站点主题保持一致",
          "Uses the same theme system as the site",
        ),
        icon: isDark ? MoonStar : SunMedium,
      },
      {
        label: pickCopy(isChinese, "侧栏", "Sidebar"),
        value: sidebarState,
        caption: pickCopy(
          isChinese,
          "支持 expanded / collapsed / hidden",
          "Supports expanded / collapsed / hidden states",
        ),
        icon: sidebarState === "hidden" ? PanelLeftOpen : PanelLeftClose,
      },
      {
        label: pickCopy(isChinese, "集成", "Integrations"),
        value: `${configuredIntegrationCount}/3`,
        caption: pickCopy(
          isChinese,
          "OpenClaw、Vault、APISIX 三类入口",
          "OpenClaw, Vault, and APISIX are all managed here",
        ),
        icon: Sparkles,
      },
    ],
    [
      configuredIntegrationCount,
      isChinese,
      isDark,
      resolvedTheme,
      sidebarState,
    ],
  );

  const accountOverview = useMemo<OverviewMetric[]>(
    () => [
      {
        label: pickCopy(isChinese, "身份", "Identity"),
        value: accountName,
        caption: accountEmail,
        icon: UserCircle2,
      },
      {
        label: pickCopy(isChinese, "工作区", "Workspace"),
        value: workspaceName,
        caption: pickCopy(
          isChinese,
          "账号页聚焦身份与工作区上下文",
          "The account area stays focused on identity and workspace context",
        ),
        icon: Briefcase,
      },
      {
        label: pickCopy(isChinese, "角色", "Role"),
        value: user?.role || "guest",
        caption: pickCopy(
          isChinese,
          "复用当前控制台会话身份",
          "Reuses the current console session identity",
        ),
        icon: ShieldCheck,
      },
      {
        label: pickCopy(isChinese, "会话", "Session"),
        value: selectedSessionKey || "main",
        caption: pickCopy(
          isChinese,
          "从当前 Gateway 会话中承接上下文",
          "Context is inherited from the current gateway session",
        ),
        icon: Workflow,
      },
    ],
    [
      accountEmail,
      accountName,
      isChinese,
      selectedSessionKey,
      user?.role,
      workspaceName,
    ],
  );

  function setTab(nextTab: string): void {
    setActiveTabs((current) => ({
      ...current,
      [activeSection]: nextTab,
    }));
  }

  function cycleSidebarState(): void {
    setSidebarState((current) => {
      if (current === "expanded") {
        return "collapsed";
      }
      if (current === "collapsed") {
        return "hidden";
      }
      return "expanded";
    });
  }

  function renderAssistantSection(): ReactNode {
    return (
      <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="min-h-0">
          <OpenClawAssistantPane defaults={defaults} variant="page" />
        </div>

        <div className="space-y-4 overflow-y-auto">
          <Card className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                XWorkmate
              </p>
              <h2 className="text-xl font-semibold text-[var(--color-heading)]">
                {pickCopy(
                  isChinese,
                  "在线助手工作台",
                  "Online assistant workspace",
                )}
              </h2>
              <p className="text-sm text-[var(--color-text-subtle)]">
                {pickCopy(
                  isChinese,
                  "和桌面端一样，主屏负责对话、截图、附件和执行反馈；OpenClaw 只保留为底层 gateway。",
                  "Like desktop, the main workspace owns chat, screenshots, attachments, and execution feedback while OpenClaw remains the underlying gateway.",
                )}
              </p>
            </div>
            <div className="grid gap-3">
              {integrationRows.map((row) => (
                <StatusRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  ok={row.ok}
                />
              ))}
            </div>
          </Card>

          <SurfaceCard
            icon={Workflow}
            title={pickCopy(
              isChinese,
              "截图仍然走聊天模式",
              "Screenshots stay in assistant chat mode",
            )}
            description={pickCopy(
              isChinese,
              "不再套壳 browser automation/control UI。",
              "No browser automation shell or separate control UI.",
            )}
            body={pickCopy(
              isChinese,
              "当前页截图会直接作为附件进入会话，和文本、日志、图片共用同一条 assistant 流程。",
              "Current-page screenshots enter the same assistant flow as text, logs, and images.",
            )}
            action={
              <button
                type="button"
                onClick={() => setActiveSection("tasks")}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
              >
                {pickCopy(isChinese, "查看任务视图", "Open tasks view")}
                <ArrowRight className="h-4 w-4" />
              </button>
            }
          />

          <SurfaceCard
            icon={ShieldCheck}
            title={pickCopy(
              isChinese,
              "Pairing 优先，其次 token",
              "Pairing first, token second",
            )}
            description={pickCopy(
              isChinese,
              "已经接入 challenge / device token 模式。",
              "The challenge / device token pairing flow is active.",
            )}
            body={pickCopy(
              isChinese,
              "首次连接可以使用 shared token 建链，后续回落到 device token。认证失配时会自动提示重新配对。",
              "The first connection can use a shared token, then fall back to a stored device token. Pairing guidance appears automatically if auth drifts.",
            )}
            action={
              <button
                type="button"
                onClick={() => {
                  setActiveSection("settings");
                  setActiveTabs((current) => ({
                    ...current,
                    settings: "integrations",
                  }));
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
              >
                {pickCopy(
                  isChinese,
                  "打开融合设置",
                  "Open integration settings",
                )}
                <ChevronRight className="h-4 w-4" />
              </button>
            }
          />

          <SurfaceCard
            icon={Waypoints}
            title={pickCopy(isChinese, "工作区默认值", "Workspace defaults")}
            description={pickCopy(
              isChinese,
              "当前会话状态",
              "Current session state",
            )}
            body={`${pickCopy(isChinese, "模式", "Mode")}: ${assistantMode} · ${pickCopy(isChinese, "推理", "Reasoning")}: ${thinking} · ${pickCopy(isChinese, "会话", "Session")}: ${selectedSessionKey || "main"}`}
            action={
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/panel/api"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
                >
                  API
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/panel"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
                >
                  Console
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  function renderTasksSection(): ReactNode {
    if (activeTab === "running") {
      return (
        <div className="grid gap-4 xl:grid-cols-3">
          <SurfaceCard
            icon={Sparkles}
            title={pickCopy(isChinese, "实时执行流", "Live execution stream")}
            description={pickCopy(
              isChinese,
              "聊天与工具调用在主助手屏持续输出。",
              "Chat and tool calls stream in the assistant view.",
            )}
            body={pickCopy(
              isChinese,
              "这里保留运行态入口，具体输出继续在助手页面里呈现，避免再套一个控制台壳。",
              "Running work stays discoverable here while actual output remains in the assistant workspace.",
            )}
          />
          <SurfaceCard
            icon={Bot}
            title={pickCopy(isChinese, "当前活跃会话", "Active session")}
            description={pickCopy(
              isChinese,
              "由 gateway session key 维持。",
              "Maintained by the gateway session key.",
            )}
            body={
              selectedSessionKey ||
              pickCopy(
                isChinese,
                "当前使用主会话 main。",
                "Currently using the main session.",
              )
            }
          />
          <SurfaceCard
            icon={ChevronRight}
            title={pickCopy(isChinese, "回到助手主屏", "Return to assistant")}
            description={pickCopy(
              isChinese,
              "继续当前任务。",
              "Continue the current task.",
            )}
            action={
              <button
                type="button"
                onClick={() => setActiveSection("assistant")}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
              >
                {pickCopy(isChinese, "打开助手", "Open assistant")}
                <ArrowRight className="h-4 w-4" />
              </button>
            }
          />
        </div>
      );
    }

    if (activeTab === "history") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={Workflow}
            title={pickCopy(isChinese, "会话历史", "Conversation history")}
            description={pickCopy(
              isChinese,
              "保留工作上下文，而不是重复开新窗口。",
              "Keep context instead of spawning separate shells.",
            )}
            body={pickCopy(
              isChinese,
              "最近的任务会以 session key 和助手标题形式回放，截图、附件和回答共享同一份历史。",
              "Recent work is replayed through session keys and assistant titles; screenshots, attachments, and replies stay together.",
            )}
          />
          <SurfaceCard
            icon={ShieldCheck}
            title={pickCopy(
              isChinese,
              "失败任务的处理方式",
              "How failed tasks are handled",
            )}
            description={pickCopy(
              isChinese,
              "配对失败、设备 token 失配、网关认证错误。",
              "Pairing failures, device token mismatches, and gateway auth errors.",
            )}
            body={pickCopy(
              isChinese,
              "这些错误会优先返回给主助手与集成页，避免再维护一套孤立的错误界面。",
              "These errors surface through the assistant and integration settings instead of a separate failure shell.",
            )}
          />
        </div>
      );
    }

    if (activeTab === "failed") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={ShieldCheck}
            title={pickCopy(isChinese, "认证与 Pairing", "Auth and pairing")}
            description={pickCopy(
              isChinese,
              "典型失败场景。",
              "Typical failure scenarios.",
            )}
            body={pickCopy(
              isChinese,
              "包括 shared token 缺失、device token mismatch、审批未完成等情况。处理入口统一放在融合设置。",
              "This covers missing shared tokens, device token mismatches, and pending approvals. Recovery starts in integration settings.",
            )}
            action={
              <button
                type="button"
                onClick={() => {
                  setActiveSection("settings");
                  setActiveTabs((current) => ({
                    ...current,
                    settings: "diagnostics",
                  }));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
              >
                {pickCopy(isChinese, "查看诊断", "Open diagnostics")}
                <ArrowRight className="h-4 w-4" />
              </button>
            }
          />
          <SurfaceCard
            icon={Cloud}
            title={pickCopy(isChinese, "地址与网络", "Endpoint and network")}
            description={pickCopy(
              isChinese,
              "网关地址没填或网络不可达。",
              "Missing gateway endpoint or network reachability issues.",
            )}
            body={pickCopy(
              isChinese,
              "地址和 token 都优先允许通过会话覆盖，不把调试值写死在页面里。",
              "Endpoints and tokens remain session-overridable and are never hardcoded into the page.",
            )}
          />
        </div>
      );
    }

    if (activeTab === "scheduled") {
      return (
        <SurfaceCard
          icon={Workflow}
          title={pickCopy(
            isChinese,
            "预留给持续任务",
            "Reserved for recurring work",
          )}
          description={pickCopy(
            isChinese,
            "和桌面端一样保留调度视图。",
            "The scheduling view remains available like desktop.",
          )}
          body={pickCopy(
            isChinese,
            "当前 Web 版先完成助手主工作区和集成页，后续再承接定时执行与批处理任务。",
            "The web version prioritizes the assistant workspace and integrations first, then recurring and batch work can land here later.",
          )}
        />
      );
    }

    return (
      <div className="grid gap-4 xl:grid-cols-3">
        <SurfaceCard
          icon={Briefcase}
          title={pickCopy(isChinese, "任务队列入口", "Task queue entry")}
          description={pickCopy(
            isChinese,
            "文本、附件、截图都会流入同一条队列。",
            "Text, files, and screenshots flow through one queue.",
          )}
          body={pickCopy(
            isChinese,
            "不再拆分成 browser automation 或 gateway control 两套 UI，统一由助手工作区执行。",
            "Browser automation and gateway control shells are removed; the assistant workspace owns execution.",
          )}
        />
        <SurfaceCard
          icon={Workflow}
          title={pickCopy(isChinese, "运行策略", "Execution policy")}
          description={pickCopy(
            isChinese,
            "Pairing 后可直接复用设备身份。",
            "Paired devices can reconnect with stored identity.",
          )}
          body={pickCopy(
            isChinese,
            "首次连接使用 shared token，后续优先使用 device token，这和桌面端的 pairing 流程保持一致。",
            "The first connection uses a shared token and later prefers device tokens, matching desktop pairing.",
          )}
        />
        <SurfaceCard
          icon={ArrowRight}
          title={pickCopy(isChinese, "立即开始", "Start now")}
          description={pickCopy(
            isChinese,
            "返回主助手屏开始一个任务。",
            "Return to the assistant home to start a task.",
          )}
          action={
            <button
              type="button"
              onClick={() => setActiveSection("assistant")}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
            >
              {pickCopy(isChinese, "打开主助手", "Open assistant")}
              <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      </div>
    );
  }

  function renderModulesSection(): ReactNode {
    if (activeTab === "gateway") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={Cloud}
            title={pickCopy(isChinese, "OpenClaw Gateway", "OpenClaw Gateway")}
            description={pickCopy(
              isChinese,
              "作为 XWorkmate 在线版的执行总线。",
              "Execution backbone for the XWorkmate web workspace.",
            )}
            body={pickCopy(
              isChinese,
              "界面上已经去掉不合理的 gateway control 套壳，只保留真正需要的接入状态、pairing 和聊天能力。",
              "The UI removes the extra gateway-control shell and keeps only the access state, pairing, and chat capabilities that matter.",
            )}
          />
          <SurfaceCard
            icon={Waypoints}
            title={pickCopy(
              isChinese,
              "模型与代理入口",
              "Model and agent entry",
            )}
            description={pickCopy(
              isChinese,
              "当前根据问题自动挑选 coding / research / browser 等代理。",
              "Questions can route into coding, research, or browser-style agents.",
            )}
            body={pickCopy(
              isChinese,
              "默认入口仍是主助手，代理选择保留在同一个工作区中，不额外拆页面。",
              "The main assistant stays the default entry and agent selection remains inside the same workspace.",
            )}
          />
        </div>
      );
    }

    if (activeTab === "nodes") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={Waypoints}
            title={pickCopy(
              isChinese,
              "全球加速接入",
              "Global acceleration access",
            )}
            description={pickCopy(
              isChinese,
              "接入向导仍保留在首页 hover 行为里。",
              "The onboarding guide still lives behind the homepage hover interaction.",
            )}
            body={pickCopy(
              isChinese,
              "点击“全球加速网络”仍进入控制台，悬停时继续显示接入向导，和你要求的交互一致。",
              "Clicking the Global Acceleration card still enters the console, while hover continues to reveal the onboarding guide.",
            )}
            action={
              <Link
                href="/panel"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
              >
                {pickCopy(isChinese, "进入控制台", "Open console")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <SurfaceCard
            icon={Cloud}
            title={pickCopy(isChinese, "节点状态", "Node status")}
            description={pickCopy(
              isChinese,
              "当前保持轻量在线版。",
              "A lightweight online view for now.",
            )}
            body={pickCopy(
              isChinese,
              "节点配置仍然由控制台与加速面板承担，XWorkmate 在线版只负责工作流入口和接入说明。",
              "Node configuration remains in the console and acceleration panels; the online XWorkmate page focuses on workflow entry and guidance.",
            )}
          />
        </div>
      );
    }

    if (activeTab === "agents") {
      return (
        <div className="grid gap-4 xl:grid-cols-3">
          <SurfaceCard
            icon={Bot}
            title="Coding"
            description={pickCopy(
              isChinese,
              "适合代码、日志和部署问题。",
              "Best for code, logs, and deployment work.",
            )}
          />
          <SurfaceCard
            icon={Sparkles}
            title="Research"
            description={pickCopy(
              isChinese,
              "适合调研、分析和对比。",
              "Best for research, analysis, and comparison.",
            )}
          />
          <SurfaceCard
            icon={Workflow}
            title="Browser"
            description={pickCopy(
              isChinese,
              "适合网页与交互检查。",
              "Best for website and interaction checks.",
            )}
          />
        </div>
      );
    }

    if (activeTab === "skills") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={Sparkles}
            title={pickCopy(
              isChinese,
              "截图 + 附件",
              "Screenshots + attachments",
            )}
            description={pickCopy(
              isChinese,
              "作为统一技能入口。",
              "A unified skill entry.",
            )}
            body={pickCopy(
              isChinese,
              "截图、日志、配置文件和图片都从同一个 composer 发出，避免再跳到单独控制台。",
              "Screenshots, logs, config files, and images all leave from the same composer instead of bouncing to another console shell.",
            )}
          />
          <SurfaceCard
            icon={Workflow}
            title={pickCopy(
              isChinese,
              "ClawHub / Connectors 预留位",
              "ClawHub / connectors staging",
            )}
            description={pickCopy(
              isChinese,
              "后续扩展仍以模块形式并入。",
              "Future expansion still lands here as modules.",
            )}
            body={pickCopy(
              isChinese,
              "你要求的路由名已经从产品名角度收敛到 XWorkmate，后续即使底层网关变化，这个入口也还能继续承接。",
              "The route is now product-facing as XWorkmate, so it can continue to host future gateways without another rename.",
            )}
          />
        </div>
      );
    }

    if (activeTab === "clawhub") {
      return (
        <SurfaceCard
          icon={Blocks}
          title="ClawHub"
          description={pickCopy(
            isChinese,
            "为未来的 OpenClaw 类产品保留统一入口。",
            "A unified home for future OpenClaw-like products.",
          )}
          body={pickCopy(
            isChinese,
            "这也是为什么公开路由改成 `/xworkmate`，而不是继续把产品和底层网关名字绑死在一起。",
            "This is also why the public route moves to `/xworkmate` instead of binding the product name to the gateway forever.",
          )}
        />
      );
    }

    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard
          icon={Vault}
          title={pickCopy(
            isChinese,
            "Vault / APISIX / OpenClaw",
            "Vault / APISIX / OpenClaw",
          )}
          description={pickCopy(
            isChinese,
            "三个关键接入都通过环境变量或会话覆盖提供。",
            "All three key integrations come from env or session overrides.",
          )}
          body={pickCopy(
            isChinese,
            "这样在线版和桌面端都不会把联调地址或 token 写死在界面里。",
            "That keeps both the web and desktop versions free of hardcoded endpoints or tokens.",
          )}
        />
        <SurfaceCard
          icon={ArrowRight}
          title={pickCopy(
            isChinese,
            "打开融合设置",
            "Open integration settings",
          )}
          description={pickCopy(
            isChinese,
            "直接跳到设置页完成联调。",
            "Jump straight into the settings view to configure integrations.",
          )}
          action={
            <button
              type="button"
              onClick={() => {
                setActiveSection("settings");
                setActiveTabs((current) => ({
                  ...current,
                  settings: "integrations",
                }));
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
            >
              {pickCopy(isChinese, "进入设置", "Open settings")}
              <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      </div>
    );
  }

  function renderSecretsSection(): ReactNode {
    if (activeTab === "local-store") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={ShieldCheck}
            title={pickCopy(
              isChinese,
              "浏览器会话覆盖",
              "Browser session overrides",
            )}
            description={pickCopy(
              isChinese,
              "调试值只保留在当前会话。",
              "Debug values stay in the current browser session only.",
            )}
            body={`${pickCopy(isChinese, "OpenClaw token", "OpenClaw token")}: ${openclawToken.trim() ? pickCopy(isChinese, "当前会话已设置", "set in session") : pickCopy(isChinese, "未覆盖，回退到服务器", "not overridden")}`}
          />
          <SurfaceCard
            icon={Vault}
            title={pickCopy(
              isChinese,
              "服务端设备身份",
              "Server-side device identity",
            )}
            description={pickCopy(
              isChinese,
              "Pairing 生成的 device token 由服务端持久化。",
              "Pairing-generated device tokens are persisted server-side.",
            )}
            body={pickCopy(
              isChinese,
              "浏览器不会直接管理 device token，页面只负责提示和重新配对入口。",
              "The browser does not manage device tokens directly; the page only exposes status and recovery.",
            )}
          />
        </div>
      );
    }

    if (activeTab === "providers") {
      return (
        <div className="grid gap-4 xl:grid-cols-3">
          <StatusRow
            label="OpenClaw"
            value={
              openclawToken.trim()
                ? pickCopy(
                    isChinese,
                    "会话 token 已覆盖",
                    "session token override",
                  )
                : pickCopy(
                    isChinese,
                    "优先 env / pairing",
                    "env / pairing preferred",
                  )
            }
            ok={Boolean((openclawUrl || defaults.openclawUrl).trim())}
          />
          <StatusRow
            label="Vault"
            value={
              vaultToken.trim()
                ? pickCopy(
                    isChinese,
                    "会话 token 已覆盖",
                    "session token override",
                  )
                : pickCopy(isChinese, "优先 env", "env preferred")
            }
            ok={Boolean((vaultUrl || defaults.vaultUrl).trim())}
          />
          <StatusRow
            label="APISIX"
            value={
              apisixToken.trim()
                ? pickCopy(
                    isChinese,
                    "会话 token 已覆盖",
                    "session token override",
                  )
                : pickCopy(isChinese, "优先 env", "env preferred")
            }
            ok={Boolean((apisixUrl || defaults.apisixUrl).trim())}
          />
        </div>
      );
    }

    if (activeTab === "audit") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={ShieldCheck}
            title={pickCopy(isChinese, "无硬编码", "No hardcoded secrets")}
            description={pickCopy(
              isChinese,
              "遵循你给的约束。",
              "Matches the constraint you set.",
            )}
            body={pickCopy(
              isChinese,
              "OpenClaw、Vault、APISIX 三个关键地址和 token 都支持服务端 env 预填，页面只允许会话级覆盖。",
              "OpenClaw, Vault, and APISIX all support server-side env defaults, while the UI only allows session-level overrides.",
            )}
          />
          <SurfaceCard
            icon={KeyRound}
            title={pickCopy(isChinese, "审计重点", "Audit focus")}
            description={pickCopy(
              isChinese,
              "区分 env、session、device token。",
              "Differentiate env, session, and device tokens.",
            )}
            body={pickCopy(
              isChinese,
              "这样既方便联调，也避免把远端 shared token 长期暴露在前端状态里。",
              "That keeps debugging easy without turning the shared token into a permanent frontend secret.",
            )}
          />
        </div>
      );
    }

    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard
          icon={Vault}
          title="Vault"
          description={pickCopy(
            isChinese,
            "用于托管密钥和敏感配置。",
            "Hosts secrets and sensitive configuration.",
          )}
          body={`${pickCopy(isChinese, "地址", "Endpoint")}: ${formatEndpoint(vaultUrl || defaults.vaultUrl, pickCopy(isChinese, "未配置", "Not configured"))}${vaultNamespace.trim() ? ` · Namespace: ${vaultNamespace}` : ""}`}
        />
        <SurfaceCard
          icon={ShieldCheck}
          title={pickCopy(isChinese, "融合设置", "Integration settings")}
          description={pickCopy(
            isChinese,
            "继续补全 Vault / APISIX / OpenClaw。",
            "Complete Vault / APISIX / OpenClaw setup here.",
          )}
          action={
            <button
              type="button"
              onClick={() => {
                setActiveSection("settings");
                setActiveTabs((current) => ({
                  ...current,
                  settings: "integrations",
                }));
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
            >
              {pickCopy(isChinese, "进入设置", "Open settings")}
              <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      </div>
    );
  }

  function renderSettingsSection(): ReactNode {
    if (activeTab === "integrations") {
      return (
        <IntegrationsConsole
          defaults={defaults}
          onOpenAssistant={() => {
            setActiveSection("assistant");
          }}
        />
      );
    }

    if (activeTab === "appearance") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={isDark ? MoonStar : SunMedium}
            title={pickCopy(isChinese, "外观模式", "Appearance mode")}
            description={pickCopy(
              isChinese,
              "与全站主题共享。",
              "Shared with the site theme.",
            )}
            body={`${pickCopy(isChinese, "当前主题", "Current theme")}: ${resolvedTheme}`}
            action={
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
              >
                {pickCopy(isChinese, "切换主题", "Toggle theme")}
              </button>
            }
          />
          <SurfaceCard
            icon={sidebarState === "hidden" ? PanelLeftOpen : PanelLeftClose}
            title={pickCopy(isChinese, "侧栏状态", "Sidebar state")}
            description={pickCopy(
              isChinese,
              "扩展 / 收起 / 隐藏。",
              "Expanded / collapsed / hidden.",
            )}
            body={sidebarState}
            action={
              <button
                type="button"
                onClick={cycleSidebarState}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
              >
                {pickCopy(isChinese, "切换侧栏", "Cycle sidebar")}
              </button>
            }
          />
        </div>
      );
    }

    if (activeTab === "diagnostics") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={ShieldCheck}
            title={pickCopy(isChinese, "接入诊断", "Integration diagnostics")}
            description={pickCopy(
              isChinese,
              "配对、认证与可达性。",
              "Pairing, auth, and reachability.",
            )}
            body={pickCopy(
              isChinese,
              "优先检查 OpenClaw pairing，其次检查 Vault 与 APISIX 的地址和 token 来源。",
              "Start with OpenClaw pairing, then inspect Vault and APISIX endpoints and token sources.",
            )}
            action={
              <Link
                href="/panel/api"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
              >
                {pickCopy(
                  isChinese,
                  "打开 API 集成页",
                  "Open API integrations",
                )}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <SurfaceCard
            icon={Workflow}
            title={pickCopy(isChinese, "当前配置源", "Current config sources")}
            description={pickCopy(
              isChinese,
              "区分 env 与 session。",
              "Separate env from session overrides.",
            )}
            body={[
              `OpenClaw: ${openclawToken.trim() ? "session" : defaults.openclawTokenConfigured ? "env" : "pairing only"}`,
              `Vault: ${vaultToken.trim() ? "session" : defaults.vaultTokenConfigured ? "env" : "manual"}`,
              `APISIX: ${apisixToken.trim() ? "session" : defaults.apisixTokenConfigured ? "env" : "manual"}`,
            ].join(" · ")}
          />
        </div>
      );
    }

    if (activeTab === "general" || activeTab === "workspace") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={LayoutDashboard}
            title={pickCopy(
              isChinese,
              "工作区默认入口",
              "Workspace default entry",
            )}
            description={pickCopy(
              isChinese,
              "直接进入 XWorkmate 助手主页。",
              "Enter the XWorkmate assistant home directly.",
            )}
            body={pickCopy(
              isChinese,
              "公开入口已经从 `/services/openclaw` 收敛到 `/xworkmate`，旧路径只做兼容跳转。",
              "The public entry now resolves to `/xworkmate`, while the old path remains a compatibility redirect.",
            )}
          />
          <SurfaceCard
            icon={Sparkles}
            title={pickCopy(isChinese, "在线版定位", "Online edition scope")}
            description={pickCopy(
              isChinese,
              "保持桌面端的信息架构。",
              "Keep the desktop information architecture.",
            )}
            body={pickCopy(
              isChinese,
              "助手、任务、模块、密钥、设置、账号六个主分区都已经在线化；底层网关名称不再暴露成产品主路由。",
              "Assistant, tasks, modules, secrets, settings, and account are all available online; the gateway name no longer becomes the public product route.",
            )}
          />
        </div>
      );
    }

    if (activeTab === "experimental") {
      return (
        <SurfaceCard
          icon={Sparkles}
          title={pickCopy(isChinese, "实验性区域", "Experimental area")}
          description={pickCopy(
            isChinese,
            "预留给后续在线工作流扩展。",
            "Reserved for future online workflow extensions.",
          )}
          body={pickCopy(
            isChinese,
            "后续如果接入更多 OpenClaw 类后端，仍然沿用 XWorkmate 这个产品入口，不再反向暴露后端实现名。",
            "Future OpenClaw-like backends can still land under the XWorkmate product entry without exposing backend implementation names.",
          )}
        />
      );
    }

    return (
      <SurfaceCard
        icon={Sparkles}
        title="XWorkmate"
        description={pickCopy(
          isChinese,
          "在线版产品说明。",
          "Online product summary.",
        )}
        body={pickCopy(
          isChinese,
          "XWorkmate 在线版延续桌面端主页信息架构，统一承接聊天、截图、pairing、集成和工作区配置。",
          "The online XWorkmate edition keeps the desktop information architecture and unifies chat, screenshots, pairing, integrations, and workspace configuration.",
        )}
      />
    );
  }

  function renderAccountSection(): ReactNode {
    if (activeTab === "workspace") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={Briefcase}
            title={pickCopy(isChinese, "当前工作区", "Current workspace")}
            description={pickCopy(
              isChinese,
              "从会话身份中解析。",
              "Derived from the current session identity.",
            )}
            body={`${workspaceName} · ${user?.tenants?.[0]?.role || user?.role || "guest"}`}
          />
          <SurfaceCard
            icon={LayoutDashboard}
            title={pickCopy(isChinese, "控制台入口", "Console entry")}
            description={pickCopy(
              isChinese,
              "需要更细粒度的资源与实例操作时使用。",
              "Use for resource and instance management.",
            )}
            action={
              <Link
                href="/panel"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
              >
                {pickCopy(isChinese, "进入控制台", "Open console")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      );
    }

    if (activeTab === "sessions") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard
            icon={UserCircle2}
            title={pickCopy(isChinese, "当前身份", "Current identity")}
            description={pickCopy(
              isChinese,
              "浏览器会话与网关会话协同。",
              "Browser and gateway sessions work together.",
            )}
            body={`${accountName} · ${accountEmail}`}
          />
          <SurfaceCard
            icon={Waypoints}
            title={pickCopy(isChinese, "助手会话", "Assistant session")}
            description={pickCopy(
              isChinese,
              "当前选中的 gateway 会话。",
              "Currently selected gateway session.",
            )}
            body={selectedSessionKey || "main"}
          />
        </div>
      );
    }

    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard
          icon={UserCircle2}
          title={accountName}
          description={accountEmail}
          body={pickCopy(
            isChinese,
            "XWorkmate 在线版复用当前账号态，不额外创建新的助手身份层。",
            "The online XWorkmate edition reuses the current account state instead of creating another assistant identity layer.",
          )}
        />
        <SurfaceCard
          icon={Briefcase}
          title={workspaceName}
          description={pickCopy(isChinese, "当前工作区", "Current workspace")}
          body={pickCopy(
            isChinese,
            "如果你需要更细的账号设置，继续使用控制台账户页；XWorkmate 保留日常工作入口。",
            "Use the console account page for deeper profile settings; XWorkmate keeps the day-to-day workspace entry.",
          )}
          action={
            <Link
              href="/panel/account"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
            >
              {pickCopy(isChinese, "打开账户页", "Open account page")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  function renderMainContent(): ReactNode {
    switch (activeSection) {
      case "assistant":
        return renderAssistantSection();
      case "tasks":
        return renderTasksSection();
      case "modules":
        return renderModulesSection();
      case "secrets":
        return renderSecretsSection();
      case "settings":
        return renderSettingsSection();
      case "account":
        return renderAccountSection();
      default:
        return null;
    }
  }

  function renderSectionOverview(): ReactNode {
    switch (activeSection) {
      case "tasks":
        return <OverviewMetrics items={tasksOverview} />;
      case "modules":
        return <OverviewMetrics items={modulesOverview} />;
      case "secrets":
        return <OverviewMetrics items={secretsOverview} />;
      case "settings":
        return <OverviewMetrics items={settingsOverview} />;
      case "account":
        return <OverviewMetrics items={accountOverview} />;
      default:
        return null;
    }
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)]">
      {sidebarState === "hidden" ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-start p-4">
          <button
            type="button"
            onClick={() => setSidebarState("expanded")}
            className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-background)]/95 text-[var(--color-text)] shadow-[var(--shadow-md)] backdrop-blur transition hover:border-[color:var(--color-primary-border)] hover:text-[var(--color-primary)]"
            title={pickCopy(isChinese, "展开侧栏", "Show sidebar")}
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="flex h-full min-h-0">
        {sidebarState !== "hidden" ? (
          <aside
            className={cn(
              "flex h-full shrink-0 flex-col border-r border-[color:var(--color-surface-border)] bg-[var(--color-background)]/90 px-3 py-4 backdrop-blur transition-[width] duration-200",
              collapsed ? "w-[96px]" : "w-[310px]",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-xl)] px-2 py-2",
                collapsed ? "justify-center" : "",
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                <Sparkles className="h-6 w-6" />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-[var(--color-heading)]">
                    XWorkmate
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-text-subtle)]">
                    {pickCopy(
                      isChinese,
                      "Online Workspace",
                      "Online Workspace",
                    )}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
              {sections.map((section) => (
                <SidebarSectionButton
                  key={section.key}
                  section={section}
                  active={section.key === activeSection}
                  collapsed={collapsed}
                  onClick={() => setActiveSection(section.key)}
                />
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-[color:var(--color-surface-border)] pt-4">
              <UtilityButton
                label={pickCopy(isChinese, "切换主题", "Toggle theme")}
                icon={isDark ? MoonStar : SunMedium}
                collapsed={collapsed}
                onClick={toggleTheme}
              />
              <div
                className={cn(
                  "rounded-[var(--radius-xl)] border border-transparent p-1",
                  collapsed ? "hidden" : "block",
                )}
              >
                <LanguageToggle />
              </div>
              <UtilityButton
                label={pickCopy(isChinese, "融合设置", "Integration settings")}
                icon={LayoutDashboard}
                collapsed={collapsed}
                active={activeSection === "settings"}
                onClick={() => {
                  setActiveSection("settings");
                  setActiveTabs((current) => ({
                    ...current,
                    settings: "integrations",
                  }));
                }}
              />
              <UtilityButton
                label={pickCopy(isChinese, "切换侧栏", "Cycle sidebar")}
                icon={ChevronsLeftRight}
                collapsed={collapsed}
                onClick={cycleSidebarState}
              />

              <button
                type="button"
                onClick={() => setActiveSection("account")}
                title={accountName}
                className={cn(
                  "mt-2 flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-3 text-left transition hover:border-[color:var(--color-primary-border)]",
                  collapsed ? "justify-center px-2" : "",
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-muted)] text-sm font-semibold text-[var(--color-primary)]">
                  {(
                    user?.username?.charAt(0) ||
                    accountName.charAt(0) ||
                    "X"
                  ).toUpperCase()}
                </div>
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                      {accountName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-subtle)]">
                      {workspaceName}
                    </p>
                  </div>
                ) : null}
              </button>
            </div>
          </aside>
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[color:var(--color-surface-border)] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  {pickCopy(isChinese, "XWorkmate 在线版", "XWorkmate Online")}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-[var(--color-heading)]">
                    {activeDefinition.label}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-subtle)]">
                    {activeDefinition.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {sidebarState !== "hidden" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSidebarState((current) =>
                        current === "expanded" ? "collapsed" : "expanded",
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
                  >
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                    {pickCopy(isChinese, "收展侧栏", "Toggle sidebar")}
                  </button>
                ) : null}
                <Link
                  href="/panel"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
                >
                  Console
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection("settings");
                    setActiveTabs((current) => ({
                      ...current,
                      settings: "integrations",
                    }));
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
                >
                  {pickCopy(isChinese, "融合设置", "Integration settings")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {activeDefinition.tabs.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeDefinition.tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTab(tab.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      tab.key === activeTab
                        ? "border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                        : "border-[color:var(--color-surface-border)] text-[var(--color-text-subtle)] hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface)]",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-5">
            <div className="space-y-5">
              {renderSectionOverview()}
              {renderMainContent()}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
