"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Briefcase,
  ChevronRight,
  ChevronsRight,
  Cloud,
  Cpu,
  Grip,
  KeyRound,
  ListTodo,
  Puzzle,
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
import { XWorkmateAssistantShell } from "@/components/xworkmate/XWorkmateAssistantShell";

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

type SectionTab = {
  key: string;
  label: string;
};

type SectionCard = {
  title: string;
  description: string;
  meta: string;
};

type SectionDefinition = {
  key: WorkspaceDestination;
  label: string;
  description: string;
  icon: LucideIcon;
  tabs: SectionTab[];
  cards?: SectionCard[];
};

type SidebarButtonProps = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
};

type DetailCardProps = {
  title: string;
  description: string;
  meta: string;
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

function createSections(isChinese: boolean): SectionDefinition[] {
  return [
    {
      key: "assistant",
      label: pickCopy(isChinese, "主页", "Home"),
      description: pickCopy(
        isChinese,
        "在线版 XWorkmate 首页，保持与桌面端一致的主工作区壳层。",
        "Online XWorkmate home with the same shell as the desktop workspace.",
      ),
      icon: ListTodo,
      tabs: [
        { key: "queued", label: pickCopy(isChinese, "排队中", "Queued") },
        { key: "main", label: "Main" },
        { key: "assistant", label: "Assistant" },
      ],
    },
    {
      key: "tasks",
      label: pickCopy(isChinese, "任务", "Tasks"),
      description: pickCopy(
        isChinese,
        "与桌面版同步的队列、运行态、历史和计划任务视图。",
        "Queue, running, history, and scheduled views aligned with desktop.",
      ),
      icon: Briefcase,
      tabs: [
        { key: "queue", label: pickCopy(isChinese, "队列", "Queue") },
        { key: "running", label: pickCopy(isChinese, "运行中", "Running") },
        { key: "history", label: pickCopy(isChinese, "历史", "History") },
        { key: "failed", label: pickCopy(isChinese, "失败", "Failed") },
        { key: "scheduled", label: pickCopy(isChinese, "计划中", "Scheduled") },
      ],
      cards: [
        {
          title: pickCopy(isChinese, "任务队列", "Task Queue"),
          description: pickCopy(
            isChinese,
            "当前在线版优先承接桌面端的默认任务壳层，后续继续接运行态与历史列表。",
            "The web version currently prioritizes the default task shell before live and history lists.",
          ),
          meta: pickCopy(isChinese, "对齐桌面端 tabs", "Desktop-aligned tabs"),
        },
        {
          title: pickCopy(isChinese, "计划任务", "Scheduled Jobs"),
          description: pickCopy(
            isChinese,
            "预留 Gateway cron 只读展示区，与桌面端 Scheduled 页签一致。",
            "Reserved for the Gateway cron read-only surface used in desktop Scheduled.",
          ),
          meta: "Gateway cron",
        },
        {
          title: pickCopy(isChinese, "默认任务联动", "Default Task Flow"),
          description: pickCopy(
            isChinese,
            "当前会话可直接作为默认任务启动入口，保持最近桌面版的工作流习惯。",
            "The current conversation remains the default task launch point, matching the latest desktop flow.",
          ),
          meta: pickCopy(isChinese, "当前会话即任务", "Session-first"),
        },
      ],
    },
    {
      key: "skills",
      label: pickCopy(isChinese, "技能", "Skills"),
      description: pickCopy(
        isChinese,
        "管理技能包、能力扩展和 ClawHub 安装入口。",
        "Manage skill packages, extensions, and ClawHub installs.",
      ),
      icon: Sparkles,
      tabs: [
        { key: "installed", label: pickCopy(isChinese, "已安装", "Installed") },
        {
          key: "recommended",
          label: pickCopy(isChinese, "推荐", "Recommended"),
        },
        { key: "clawhub", label: "ClawHub" },
      ],
      cards: [
        {
          title: "ClawHub",
          description: pickCopy(
            isChinese,
            "在线版入口保留技能市场入口，结构与桌面端最近版本一致。",
            "The online workspace keeps the skill market entry aligned with the latest desktop structure.",
          ),
          meta: pickCopy(isChinese, "技能市场", "Marketplace"),
        },
        {
          title: pickCopy(isChinese, "技能包", "Skill Packs"),
          description: pickCopy(
            isChinese,
            "围绕安装、启用和会话内能力扩展组织，而不是散落到多个页面。",
            "Organized around install, enablement, and session capability expansion instead of scattered pages.",
          ),
          meta: pickCopy(isChinese, "结构对齐", "Structure aligned"),
        },
      ],
    },
    {
      key: "nodes",
      label: pickCopy(isChinese, "节点", "Nodes"),
      description: pickCopy(
        isChinese,
        "管理边缘节点、实例和运行状态。",
        "Manage edge nodes, instances, and runtime status.",
      ),
      icon: Grip,
      tabs: [
        { key: "instances", label: pickCopy(isChinese, "实例", "Instances") },
        { key: "capacity", label: pickCopy(isChinese, "容量", "Capacity") },
      ],
      cards: [
        {
          title: pickCopy(isChinese, "边缘节点", "Edge Nodes"),
          description: pickCopy(
            isChinese,
            "桌面版最近更新把节点作为独立工作区保留，在线版首页先同步信息架构。",
            "Recent desktop updates kept nodes as a dedicated workspace, and the web shell now mirrors that IA.",
          ),
          meta: pickCopy(isChinese, "工作区", "Workspace"),
        },
      ],
    },
    {
      key: "agents",
      label: pickCopy(isChinese, "代理", "Agents"),
      description: pickCopy(
        isChinese,
        "管理代理实例、行为配置和活跃代理。",
        "Manage agent instances, behavior configuration, and the active agent.",
      ),
      icon: Bot,
      tabs: [
        { key: "overview", label: pickCopy(isChinese, "概览", "Overview") },
        { key: "routing", label: pickCopy(isChinese, "路由", "Routing") },
      ],
      cards: [
        {
          title: pickCopy(isChinese, "代理路由", "Agent Routing"),
          description: pickCopy(
            isChinese,
            "保留 coding / research / browser 的任务导向切换心智，与桌面端最近工作流一致。",
            "Preserves the coding / research / browser task routing model used by the latest desktop workflow.",
          ),
          meta: pickCopy(isChinese, "任务分流", "Task routing"),
        },
      ],
    },
    {
      key: "mcpServer",
      label: "MCP Hub",
      description: pickCopy(
        isChinese,
        "管理 MCP 连接与工具配置。",
        "Manage MCP connections and tool configuration.",
      ),
      icon: Cpu,
      tabs: [
        { key: "servers", label: pickCopy(isChinese, "服务", "Servers") },
        { key: "tools", label: pickCopy(isChinese, "工具", "Tools") },
      ],
      cards: [
        {
          title: "MCP Hub",
          description: pickCopy(
            isChinese,
            "最近桌面版已将 MCP Server 提升为一级工具分组，在线版同步这一层级。",
            "Recent desktop builds promoted MCP Server into a first-class tools group, now mirrored online.",
          ),
          meta: pickCopy(isChinese, "一级工具", "Primary tool"),
        },
      ],
    },
    {
      key: "clawHub",
      label: "ClawHub",
      description: pickCopy(
        isChinese,
        "浏览并安装技能包、代理模板和连接器。",
        "Browse and install skills, agent templates, and connectors.",
      ),
      icon: Puzzle,
      tabs: [
        { key: "skills", label: pickCopy(isChinese, "技能", "Skills") },
        { key: "templates", label: pickCopy(isChinese, "模板", "Templates") },
        {
          key: "connectors",
          label: pickCopy(isChinese, "连接器", "Connectors"),
        },
      ],
      cards: [
        {
          title: pickCopy(
            isChinese,
            "模板与连接器",
            "Templates and Connectors",
          ),
          description: pickCopy(
            isChinese,
            "ClawHub 不再只是技能列表，而是统一承接扩展分发。",
            "ClawHub is no longer only a skill list; it now acts as the extension distribution surface.",
          ),
          meta: pickCopy(isChinese, "扩展分发", "Extension distribution"),
        },
      ],
    },
    {
      key: "secrets",
      label: pickCopy(isChinese, "密钥", "Secrets"),
      description: pickCopy(
        isChinese,
        "围绕 Vault、提供方和审计组织凭证管理。",
        "Credential management around Vault, providers, and audit.",
      ),
      icon: KeyRound,
      tabs: [
        { key: "vault", label: "Vault" },
        { key: "providers", label: pickCopy(isChinese, "提供方", "Providers") },
        { key: "audit", label: pickCopy(isChinese, "审计", "Audit") },
      ],
      cards: [
        {
          title: "Vault",
          description: pickCopy(
            isChinese,
            "保持桌面端最近的 Vault-first 设计，在线版继续只暴露引用而不展示明文。",
            "Keeps the recent desktop Vault-first design and only exposes references, never raw values.",
          ),
          meta: pickCopy(isChinese, "安全引用", "Secure refs"),
        },
      ],
    },
    {
      key: "aiGateway",
      label: "AI Gateway",
      description: pickCopy(
        isChinese,
        "管理代理、模型与网关配置。",
        "Manage agents, models, and gateway configuration.",
      ),
      icon: Cloud,
      tabs: [
        { key: "models", label: pickCopy(isChinese, "模型", "Models") },
        { key: "agents", label: pickCopy(isChinese, "代理", "Agents") },
        { key: "routes", label: pickCopy(isChinese, "路由", "Routes") },
      ],
      cards: [
        {
          title: pickCopy(isChinese, "模型与代理", "Models and Agents"),
          description: pickCopy(
            isChinese,
            "桌面版最近把 AI Gateway 独立成完整页面，在线版首页同步该模块入口。",
            "Recent desktop updates gave AI Gateway its own full page, and the online shell now mirrors that entry.",
          ),
          meta: pickCopy(isChinese, "独立模块", "Dedicated module"),
        },
      ],
    },
    {
      key: "settings",
      label: pickCopy(isChinese, "设置", "Settings"),
      description: pickCopy(
        isChinese,
        "统一管理工作区、集成、外观和诊断。",
        "Centralize workspace, integrations, appearance, and diagnostics.",
      ),
      icon: Settings2,
      tabs: [
        { key: "general", label: pickCopy(isChinese, "通用", "General") },
        { key: "workspace", label: pickCopy(isChinese, "工作区", "Workspace") },
        { key: "gateway", label: pickCopy(isChinese, "集成", "Integrations") },
        {
          key: "diagnostics",
          label: pickCopy(isChinese, "诊断", "Diagnostics"),
        },
      ],
      cards: [
        {
          title: pickCopy(isChinese, "集成默认项", "Integration Defaults"),
          description: pickCopy(
            isChinese,
            "继续复用当前在线版的集成配置 store 和探测逻辑，不改 API 合约。",
            "Continues to reuse the existing web integration store and probe flow without changing the API contract.",
          ),
          meta: pickCopy(isChinese, "复用现有能力", "Reused capability"),
        },
      ],
    },
    {
      key: "account",
      label: pickCopy(isChinese, "账号", "Account"),
      description: pickCopy(
        isChinese,
        "身份、工作区和当前会话信息。",
        "Identity, workspace, and current session information.",
      ),
      icon: UserCircle2,
      tabs: [
        { key: "profile", label: pickCopy(isChinese, "资料", "Profile") },
        { key: "workspace", label: pickCopy(isChinese, "工作区", "Workspace") },
        { key: "sessions", label: pickCopy(isChinese, "会话", "Sessions") },
      ],
      cards: [
        {
          title: pickCopy(isChinese, "工作区身份", "Workspace Identity"),
          description: pickCopy(
            isChinese,
            "对齐桌面端最近的身份与工作区拆分，避免把账号信息混到业务页面。",
            "Aligns with the desktop split between identity and workspace instead of mixing account details into business pages.",
          ),
          meta: pickCopy(isChinese, "身份上下文", "Identity context"),
        },
      ],
    },
  ];
}

function SidebarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: SidebarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-[16px] border transition",
        active
          ? "border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]"
          : "border-transparent text-[var(--color-text-subtle)] hover:border-[color:var(--color-surface-border)] hover:bg-white/85 hover:text-[var(--color-text)]",
      )}
    >
      <Icon className="h-[19px] w-[19px]" />
    </button>
  );
}

function DesktopChip({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold",
        active
          ? "border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
          : "border-[color:var(--color-surface-border)] bg-white text-[var(--color-text-subtle)]",
      )}
    >
      {label}
    </div>
  );
}

function ToolbarChip({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center rounded-[14px] border px-4 text-sm font-semibold transition",
        active
          ? "border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
          : "border-[color:var(--color-surface-border)] bg-white text-[var(--color-heading)] hover:bg-[var(--color-surface-hover)]",
      )}
    >
      {label}
    </button>
  );
}

function DetailCard({ title, description, meta }: DetailCardProps) {
  return (
    <div className="rounded-[22px] border border-[color:var(--color-surface-border)] bg-white/92 p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-3 inline-flex rounded-full border border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
        {meta}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-heading)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-subtle)]">
        {description}
      </p>
    </div>
  );
}

function SectionOverview({
  isChinese,
  section,
}: {
  isChinese: boolean;
  section: SectionDefinition;
}) {
  return (
    <>
      <div className="rounded-[28px] border border-[color:var(--color-surface-border)] bg-white/96 px-6 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--color-text-subtle)]">
              <DesktopChip label={pickCopy(isChinese, "主页", "Home")} />
              <ChevronRight className="h-4 w-4" />
              <DesktopChip label={section.label} />
            </div>
            <h1 className="mt-4 text-[20px] font-semibold tracking-[-0.03em] text-black">
              {section.label}
            </h1>
            <p className="mt-1 max-w-3xl text-[15px] text-[var(--color-text-subtle)]">
              {section.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {section.tabs.map((tab, index) => (
                <DesktopChip
                  key={tab.key}
                  label={tab.label}
                  active={index === 0}
                />
              ))}
            </div>
          </div>
          <div className="inline-flex h-fit items-center rounded-full border border-[color:var(--color-surface-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-subtle)]">
            {pickCopy(
              isChinese,
              "已对齐最新桌面结构",
              "Aligned with latest desktop IA",
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {(section.cards ?? []).map((card) => (
          <DetailCard
            key={`${section.key}-${card.title}`}
            title={card.title}
            description={card.description}
            meta={card.meta}
          />
        ))}
      </div>
    </>
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
  const [composerValue, setComposerValue] = useState(initialPrompt);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const setScope = useOpenClawConsoleStore((state) => state.setScope);
  const applyDefaults = useOpenClawConsoleStore((state) => state.applyDefaults);
  const setSelectedSessionKey = useOpenClawConsoleStore(
    (state) => state.setSelectedSessionKey,
  );
  const openclawUrl = useOpenClawConsoleStore((state) => state.openclawUrl);
  const vaultUrl = useOpenClawConsoleStore((state) => state.vaultUrl);
  const apisixUrl = useOpenClawConsoleStore((state) => state.apisixUrl);

  useEffect(() => {
    setScope(scopeKey, defaults);
    applyDefaults(defaults);
  }, [applyDefaults, defaults, scopeKey, setScope]);

  useEffect(() => {
    setComposerValue(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (!initialSessionKey.trim()) {
      return;
    }
    setSelectedSessionKey(initialSessionKey);
  }, [initialSessionKey, setSelectedSessionKey]);

  const sections = useMemo(() => createSections(isChinese), [isChinese]);
  const activeDefinition =
    sections.find((section) => section.key === activeSection) ?? sections[0];
  const openclawEndpoint = openclawUrl || defaults.openclawUrl;
  const endpointLabel = formatEndpoint(
    openclawEndpoint,
    pickCopy(isChinese, "未连接目标", "No target"),
  );
  const connected = Boolean(openclawEndpoint.trim());
  const configuredCount = [
    openclawEndpoint,
    vaultUrl || defaults.vaultUrl,
    apisixUrl || defaults.apisixUrl,
  ].filter((item) => item.trim().length > 0).length;

  const primarySections = sections.filter((section) =>
    ["assistant", "tasks", "skills"].includes(section.key),
  );
  const workspaceSections = sections.filter((section) =>
    ["nodes", "agents"].includes(section.key),
  );
  const toolSections = sections.filter((section) =>
    ["mcpServer", "clawHub", "secrets", "aiGateway"].includes(section.key),
  );
  const footerSections = sections.filter((section) =>
    ["settings", "account"].includes(section.key),
  );
  const integrationRoute =
    profile?.profileScope === "tenant-shared"
      ? "/xworkmate/admin"
      : "/xworkmate/integrations";
  const canEditIntegrations = Boolean(profile?.canEditIntegrations);
  const profileModeLabel =
    profile?.profileScope === "tenant-shared"
      ? pickCopy(isChinese, "共享配置", "Shared Profile")
      : pickCopy(isChinese, "个人配置", "Personal Profile");
  const connectionHint = profile
    ? profile.profileScope === "tenant-shared" && !profile.canEditIntegrations
      ? pickCopy(
          isChinese,
          "当前是共享版工作台。只有管理员能修改连接配置，普通成员可直接使用已发布能力。",
          "This is the shared workspace. Only administrators can change integrations, while members can use the published workspace.",
        )
      : profile.profileScope === "tenant-shared"
        ? pickCopy(
            isChinese,
            "你正在维护共享版连接配置，保存后会影响 svc.plus/xworkmate 的共享工作台。",
            "You are editing the shared integrations profile for svc.plus/xworkmate.",
          )
        : pickCopy(
            isChinese,
            "你正在使用租户独享工作台，连接配置只对当前用户生效。",
            "You are using a tenant-private workspace, and the profile only affects the current member.",
          )
    : pickCopy(
        isChinese,
        "未检测到租户配置，当前仍会回退到浏览器会话内的默认连接。",
        "No tenant profile was resolved yet, so the workspace falls back to browser-session defaults.",
      );
  const primaryActionLabel = canEditIntegrations
    ? pickCopy(isChinese, "打开配置页", "Open Config")
    : pickCopy(isChinese, "查看状态", "View Status");
  const secondaryActionLabel = canEditIntegrations
    ? pickCopy(isChinese, "管理连接", "Manage Integrations")
    : pickCopy(isChinese, "等待管理员配置", "Await Admin Setup");

  const openConnections = () => {
    if (!canEditIntegrations) {
      return;
    }
    router.push(integrationRoute);
  };

  return (
    <div className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#f4f7fd_0%,#f6f8fb_32%,#f3f5f8_100%)] text-[var(--color-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(51,102,255,0.10),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.05),_transparent_24%)]" />

      <div className="relative flex h-full min-h-0">
        {sidebarExpanded ? (
          <aside className="flex w-[76px] shrink-0 flex-col border-r border-white/80 bg-[rgba(255,255,255,0.74)] p-3 shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur z-10 transition-all duration-300">
            <div className="flex flex-col gap-2">
              {primarySections.map((section) => (
                <SidebarButton
                  key={section.key}
                  icon={section.icon}
                  label={section.label}
                  active={section.key === activeSection}
                  onClick={() => setActiveSection(section.key)}
                />
              ))}
            </div>

            <div className="my-4 h-px bg-[var(--color-divider)]" />

            <div className="flex flex-col gap-2">
              {workspaceSections.map((section) => (
                <SidebarButton
                  key={section.key}
                  icon={section.icon}
                  label={section.label}
                  active={section.key === activeSection}
                  onClick={() => setActiveSection(section.key)}
                />
              ))}
            </div>

            <div className="my-4 h-px bg-[var(--color-divider)]" />

            <div className="flex flex-col gap-2">
              {toolSections.map((section) => (
                <SidebarButton
                  key={section.key}
                  icon={section.icon}
                  label={section.label}
                  active={section.key === activeSection}
                  onClick={() => setActiveSection(section.key)}
                />
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-2">
              {footerSections.map((section) => (
                <SidebarButton
                  key={section.key}
                  icon={section.icon}
                  label={section.label}
                  active={section.key === activeSection}
                  onClick={() => setActiveSection(section.key)}
                />
              ))}
              <button
                type="button"
                onClick={() => setSidebarExpanded(false)}
                className="mt-2 flex h-12 w-12 items-center justify-center rounded-[16px] border border-transparent bg-white/50 text-[var(--color-text-subtle)] transition hover:text-[var(--color-heading)]"
              >
                <ChevronsRight className="h-[18px] w-[18px] rotate-180" />
              </button>
            </div>
          </aside>
        ) : (
          <div className="absolute left-0 top-4 z-20 px-2">
            <button
              type="button"
              onClick={() => setSidebarExpanded(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/80 bg-white/70 shadow-sm text-[var(--color-text-subtle)] transition hover:text-[var(--color-heading)] backdrop-blur"
            >
              <ListTodo className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col bg-[rgba(255,255,255,0.54)] shadow-[0_24px_64px_rgba(15,23,42,0.07)] backdrop-blur transition-all duration-300",
            !sidebarExpanded && "pl-14",
          )}
        >
          <div className="min-h-0 flex-1 bg-[rgba(248,250,252,0.78)]">
            <div className="flex h-full min-h-0 flex-col">
              {profile ? (
                <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-surface-border)] bg-white/90 px-5 py-3 text-sm text-[var(--color-text-subtle)] shadow-[var(--shadow-sm)]">
                  <Shield className="h-4 w-4 text-[var(--color-primary)]" />
                  <span>
                    {profile.edition === "shared_public"
                      ? pickCopy(isChinese, "共享版", "Shared Edition")
                      : pickCopy(isChinese, "租户独享版", "Tenant Edition")}
                  </span>
                  <span>·</span>
                  <span>{profile.tenant.name}</span>
                  <span>·</span>
                  <span>{profile.membershipRole}</span>
                  <span>·</span>
                  <span>{profileModeLabel}</span>
                  {requestHost ? (
                    <>
                      <span>·</span>
                      <span>{requestHost}</span>
                    </>
                  ) : null}
                </div>
              ) : null}
              {activeSection === "assistant" ? (
                <XWorkmateAssistantShell
                  mode="full"
                  isChinese={isChinese}
                  endpointLabel={endpointLabel}
                  connected={connected}
                  prompt={composerValue}
                  onPromptChange={setComposerValue}
                  onOpenConnections={openConnections}
                  canManageConnections={canEditIntegrations}
                  primaryActionLabel={primaryActionLabel}
                  secondaryActionLabel={secondaryActionLabel}
                  connectionHint={connectionHint}
                  actionDisabled={!canEditIntegrations}
                  showConnectionStatus={
                    profile?.profileScope !== "tenant-shared"
                  }
                />
              ) : (
                <SectionOverview
                  isChinese={isChinese}
                  section={activeDefinition}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <div className="pointer-events-none absolute right-8 top-7 hidden items-center gap-2 rounded-full border border-white/85 bg-white/90 px-3 py-2 text-xs font-semibold text-[var(--color-text-subtle)] shadow-[var(--shadow-sm)] xl:inline-flex">
        <Shield className="h-3.5 w-3.5" />
        {connected
          ? `${pickCopy(isChinese, "在线网关", "Gateway Online")} · ${configuredCount}/3`
          : `${pickCopy(isChinese, "集成概况", "Integrations")} · ${configuredCount}/3`}
      </div>
    </div>
  );
}
