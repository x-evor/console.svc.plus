import type { OpenClawBootstrapResponse } from "@/lib/openclaw/types";
import {
  buildHomeGatewayHeroViewModel,
  buildQuickPrompts,
} from "@/components/home/gatewayHeroModel";

const bootstrapFixture: OpenClawBootstrapResponse = {
  activeSessionKey: "main",
  mainSessionKey: "main",
  gatewayUrl: "wss://gateway.example.com",
  tokenSource: "env",
  connectedAt: "2026-03-18T08:00:00.000Z",
  agents: [
    { id: "agent-1", name: "Deep Research" },
    { id: "agent-2", name: "Code Builder" },
  ],
  sessions: [
    {
      key: "main",
      derivedTitle: "继续昨天的发布检查",
      lastMessagePreview: "检查最近发布异常",
    },
    {
      key: "agent-2",
      derivedTitle: "修复首页入口",
      lastMessagePreview: "继续首页重构",
    },
  ],
  messages: [],
  statusPayload: { connection: "ready" },
  healthPayload: { status: "ok" },
};

describe("gatewayHeroModel", () => {
  it.skip("builds morning view model with connected gateway data", () => {
    const model = buildHomeGatewayHeroViewModel({
      isChinese: true,
      displayName: "shenlan",
      bootstrap: bootstrapFixture,
      connected: true,
      now: new Date("2026-03-18T07:30:00+08:00"),
    });

    expect(model.period).toBe("morning");
    expect(model.headline).toContain("shenlan");
    expect(model.statusBadge).toBe("在线可用");
    expect(model.statusNodes[0]?.value).toBe("实时在线");
    expect(model.statusNodes[1]?.value).toContain("继续昨天");
    expect(model.quickPrompts[0]).toContain("继续昨天");
  });

  it.skip("falls back to warning state when bootstrap fails", () => {
    const model = buildHomeGatewayHeroViewModel({
      isChinese: true,
      displayName: "游客",
      connected: false,
      bootstrapError: new Error("offline"),
      now: new Date("2026-03-18T23:30:00+08:00"),
    });

    expect(model.period).toBe("night");
    expect(model.statusTone).toBe("warning");
    expect(model.statusBadge).toBe("连接异常");
    expect(model.quickPrompts).toContain("准备明天的任务");
  });

  it("prioritizes sessions then agents then fallback prompts", () => {
    const prompts = buildQuickPrompts({
      isChinese: false,
      period: "afternoon",
      sessions: [
        {
          key: "s1",
          derivedTitle: "Resume release review",
          lastMessagePreview: "Look at alerts",
        },
      ],
      agents: [{ id: "a1", name: "Research Agent" }],
    });

    expect(prompts[0]).toBe("Resume release review");
    expect(prompts[1]).toBe("Research Agent");
    expect(prompts).toContain("Check gateway health");
  });
});
