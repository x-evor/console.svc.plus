import type {
  GatewayAgentSummary,
  GatewaySessionSummary,
  OpenClawBootstrapResponse,
} from "@/lib/openclaw/types";

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export type HomeGatewayStatusNode = {
  key: "gateway" | "session" | "agent";
  label: string;
  value: string;
  tone: "healthy" | "warning" | "neutral";
};

export type HomeGatewayHeroViewModel = {
  period: DayPeriod;
  greeting: string;
  headline: string;
  summary: string;
  panelLabel: string;
  statusBadge: string;
  statusTone: "healthy" | "warning" | "neutral";
  statusDescription: string;
  statusNodes: HomeGatewayStatusNode[];
  quickPrompts: string[];
  recentSessions: GatewaySessionSummary[];
  featuredAgents: GatewayAgentSummary[];
};

function trimText(value?: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function compactText(value: string, maxLength = 36): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function deriveDayPeriod(date: Date): DayPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return "morning";
  }
  if (hour >= 12 && hour < 18) {
    return "afternoon";
  }
  if (hour >= 18 && hour < 23) {
    return "evening";
  }
  return "night";
}

function periodCopy(
  isChinese: boolean,
  period: DayPeriod,
  displayName: string,
): Pick<
  HomeGatewayHeroViewModel,
  "greeting" | "headline" | "summary" | "panelLabel"
> {
  if (isChinese) {
    switch (period) {
      case "morning":
        return {
          greeting: "早上好",
          headline: `晨间状态面板，${displayName}`,
          summary: "先看 Gateway 状态，再用一句话启动今天的第一轮协作。",
          panelLabel: "晨间启动",
        };
      case "afternoon":
        return {
          greeting: "下午好",
          headline: `午间工作台，${displayName}`,
          summary: "把当前连接、会话和代理能力收拢在一屏，适合快速接续进行中的工作。",
          panelLabel: "午间续航",
        };
      case "evening":
        return {
          greeting: "晚上好",
          headline: `晚间协作台，${displayName}`,
          summary: "适合回看最近会话、补发一个 prompt，或把工作转交给完整工作台继续推进。",
          panelLabel: "晚间协作",
        };
      case "night":
      default:
        return {
          greeting: "夜深了",
          headline: `夜间守望面板，${displayName}`,
          summary: "用更轻的首页入口确认 Gateway 是否在线，再决定是否进入完整工作台。",
          panelLabel: "夜间巡检",
        };
    }
  }

  switch (period) {
    case "morning":
      return {
        greeting: "Good morning",
        headline: `Morning status board, ${displayName}`,
        summary:
          "Check the gateway first, then kick off the first task with one prompt.",
        panelLabel: "Morning Start",
      };
    case "afternoon":
      return {
        greeting: "Good afternoon",
        headline: `Midday workspace, ${displayName}`,
        summary:
          "Keep connection health, recent sessions, and agents in one place for a fast resume.",
        panelLabel: "Midday Flow",
      };
    case "evening":
      return {
        greeting: "Good evening",
        headline: `Evening workspace, ${displayName}`,
        summary:
          "Review recent sessions, send a fresh prompt, or continue in the full workspace.",
        panelLabel: "Evening Sync",
      };
    case "night":
    default:
      return {
        greeting: "Late night",
        headline: `Night watch panel, ${displayName}`,
        summary:
          "Use the lighter homepage entry to confirm gateway health before moving deeper into work.",
        panelLabel: "Night Watch",
      };
  }
}

function fallbackQuickPrompts(
  isChinese: boolean,
  period: DayPeriod,
): string[] {
  const common = isChinese
    ? ["查看最近会话", "检查 Gateway 状态", "继续当前任务"]
    : ["Show recent sessions", "Check gateway health", "Continue current task"];

  if (period === "morning") {
    return isChinese
      ? ["今天先做什么", "检查 Gateway 状态", "继续昨天的会话"]
      : ["What should I tackle first", "Check gateway health", "Resume yesterday's session"];
  }

  if (period === "night") {
    return isChinese
      ? ["总结今天进展", "检查是否仍在线", "准备明天的任务"]
      : ["Summarize today's work", "Check if the gateway is still online", "Prepare tomorrow's tasks"];
  }

  return common;
}

function deriveStatusTone(
  connected: boolean,
  bootstrapError?: Error | null,
): "healthy" | "warning" | "neutral" {
  if (bootstrapError) {
    return "warning";
  }
  if (connected) {
    return "healthy";
  }
  return "neutral";
}

function deriveStatusBadge(
  isChinese: boolean,
  tone: "healthy" | "warning" | "neutral",
): string {
  if (isChinese) {
    if (tone === "healthy") {
      return "在线可用";
    }
    if (tone === "warning") {
      return "连接异常";
    }
    return "等待配置";
  }

  if (tone === "healthy") {
    return "Gateway Ready";
  }
  if (tone === "warning") {
    return "Needs Attention";
  }
  return "Awaiting Config";
}

function deriveStatusDescription(params: {
  isChinese: boolean;
  tone: "healthy" | "warning" | "neutral";
  sessions: GatewaySessionSummary[];
  agents: GatewayAgentSummary[];
}): string {
  const sessionCount = params.sessions.length;
  const agentCount = params.agents.length;

  if (params.isChinese) {
    if (params.tone === "healthy") {
      return `Gateway 已连接，最近 ${sessionCount} 个会话可续接，当前可用 ${agentCount} 个代理能力。`;
    }
    if (params.tone === "warning") {
      return "Gateway 当前没有成功完成首屏引导，可以直接跳转 XWorkmate 或稍后重试。";
    }
    return "尚未检测到可用 Gateway 配置，首页保留演示入口与降级跳转。";
  }

  if (params.tone === "healthy") {
    return `Gateway connected, ${sessionCount} recent sessions are available, and ${agentCount} agents can be surfaced here.`;
  }
  if (params.tone === "warning") {
    return "The gateway bootstrap did not complete successfully. You can still continue in XWorkmate or retry here.";
  }
  return "No gateway configuration was detected yet. The homepage keeps a reduced entry and fallback navigation.";
}

function buildGatewayNode(
  isChinese: boolean,
  connected: boolean,
  tone: "healthy" | "warning" | "neutral",
): HomeGatewayStatusNode {
  return {
    key: "gateway",
    label: isChinese ? "Gateway" : "Gateway",
    value: connected
      ? isChinese
        ? "实时在线"
        : "Live"
      : tone === "warning"
        ? isChinese
          ? "需重试"
          : "Retry"
        : isChinese
          ? "未配置"
          : "Not configured",
    tone,
  };
}

function buildSessionNode(
  isChinese: boolean,
  sessions: GatewaySessionSummary[],
): HomeGatewayStatusNode {
  const latest = sessions[0];
  const label = isChinese ? "最近会话" : "Latest Session";
  const title = trimText(latest?.derivedTitle) || trimText(latest?.displayName);
  return {
    key: "session",
    label,
    value: title
      ? compactText(title, 18)
      : isChinese
        ? "等待新对话"
        : "Ready for a new run",
    tone: title ? "healthy" : "neutral",
  };
}

function buildAgentNode(
  isChinese: boolean,
  agents: GatewayAgentSummary[],
): HomeGatewayStatusNode {
  const first = agents[0];
  return {
    key: "agent",
    label: isChinese ? "可用代理" : "Active Agents",
    value: first
      ? compactText(first.name, 18)
      : isChinese
        ? "默认助手"
        : "Default assistant",
    tone: first ? "healthy" : "neutral",
  };
}

export function buildQuickPrompts(params: {
  isChinese: boolean;
  period: DayPeriod;
  sessions?: GatewaySessionSummary[];
  agents?: GatewayAgentSummary[];
}): string[] {
  const sessionPrompts =
    params.sessions
      ?.map((session) => trimText(session.derivedTitle) || trimText(session.lastMessagePreview))
      .filter(Boolean)
      .map((value) => compactText(value, 22)) ?? [];
  const agentPrompts =
    params.agents?.map((agent) => compactText(trimText(agent.name), 22)).filter(Boolean) ?? [];

  return [...sessionPrompts, ...agentPrompts, ...fallbackQuickPrompts(params.isChinese, params.period)]
    .filter(Boolean)
    .slice(0, 6);
}

export function buildHomeGatewayHeroViewModel(params: {
  isChinese: boolean;
  displayName: string;
  now?: Date;
  bootstrap?: OpenClawBootstrapResponse | null;
  bootstrapError?: Error | null;
  connected: boolean;
}): HomeGatewayHeroViewModel {
  const now = params.now ?? new Date();
  const period = deriveDayPeriod(now);
  const timeCopy = periodCopy(params.isChinese, period, params.displayName);
  const sessions = params.bootstrap?.sessions.slice(0, 3) ?? [];
  const agents = params.bootstrap?.agents.slice(0, 3) ?? [];
  const tone = deriveStatusTone(params.connected, params.bootstrapError);

  return {
    period,
    ...timeCopy,
    statusBadge: deriveStatusBadge(params.isChinese, tone),
    statusTone: tone,
    statusDescription: deriveStatusDescription({
      isChinese: params.isChinese,
      tone,
      sessions,
      agents,
    }),
    statusNodes: [
      buildGatewayNode(params.isChinese, params.connected, tone),
      buildSessionNode(params.isChinese, sessions),
      buildAgentNode(params.isChinese, agents),
    ],
    quickPrompts: buildQuickPrompts({
      isChinese: params.isChinese,
      period,
      sessions,
      agents,
    }),
    recentSessions: sessions,
    featuredAgents: agents,
  };
}
