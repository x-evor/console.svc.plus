import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { GatewayHero } from "@/components/home/GatewayHero";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/i18n/LanguageProvider", () => ({
  useLanguage: () => ({
    language: "zh",
  }),
}));

vi.mock("@/lib/userStore", () => ({
  useUserStore: (selector: (state: { user: { name: string } }) => unknown) =>
    selector({
      user: {
        name: "Guest",
      },
    }),
}));

const sendPromptMock = vi.fn();

vi.mock("@/components/home/useGatewayHero", () => ({
  useGatewayHero: () => ({
    bootstrap: {
      activeSessionKey: "session-1",
      agents: [{ id: "agent-1", name: "Deep Research" }],
      sessions: [{ key: "session-1", derivedTitle: "排查首页入口" }],
    },
    bootstrapError: null,
    bootstrapLoading: false,
    gatewayConfigured: true,
    sendPrompt: sendPromptMock,
    sendState: {
      isSending: false,
      responseText: "这是首页首轮真实响应。",
      errorMessage: "",
      activeSessionKey: "session-1",
    },
  }),
}));

const defaults: IntegrationDefaults = {
  openclawUrl: "wss://gateway.example.com",
  openclawOrigin: "",
  openclawTokenConfigured: true,
  vaultUrl: "",
  vaultNamespace: "",
  vaultTokenConfigured: false,
  vaultSecretPath: "",
  vaultSecretKey: "",
  apisixUrl: "",
  apisixTokenConfigured: false,
};

describe("GatewayHero", () => {
  beforeEach(() => {
    pushMock.mockReset();
    sendPromptMock.mockReset();
  });

  it("renders zh guest as 游客 and shows live gateway content", () => {
    render(<GatewayHero defaults={defaults} />);

    expect(screen.getByText(/游客/)).toBeInTheDocument();
    expect(screen.getByText("在线可用")).toBeInTheDocument();
    expect(screen.getAllByText("Deep Research").length).toBeGreaterThan(0);
    expect(screen.getByText("这是首页首轮真实响应。")).toBeInTheDocument();
  });

  it("sends prompt and carries session key to workspace", async () => {
    sendPromptMock.mockResolvedValue("session-1");
    render(<GatewayHero defaults={defaults} />);

    fireEvent.change(screen.getByPlaceholderText("有什么想问的？"), {
      target: { value: "检查今天状态" },
    });
    fireEvent.click(screen.getByRole("button", { name: /发送/ }));
    expect(sendPromptMock).toHaveBeenCalledWith("检查今天状态");

    fireEvent.click(screen.getByRole("button", { name: /继续到工作台/ }));
    expect(pushMock).toHaveBeenCalledWith(
      "/xworkmate?prompt=%E6%A3%80%E6%9F%A5%E4%BB%8A%E5%A4%A9%E7%8A%B6%E6%80%81&sessionKey=session-1",
    );
  });
});
