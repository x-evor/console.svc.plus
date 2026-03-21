import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { XWorkmateWorkspacePage } from "@/components/xworkmate/XWorkmateWorkspacePage";

const pushMock = vi.fn();
const assistantPaneMock = vi.fn();

const mockStore = {
  setScope: vi.fn(),
  applyDefaults: vi.fn(),
  setSelectedSessionKey: vi.fn(),
  selectedSessionKey: "",
  openclawUrl: "",
  vaultUrl: "",
  apisixUrl: "",
};

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

vi.mock("@/state/openclawConsoleStore", () => ({
  useOpenClawConsoleStore: (selector: (state: typeof mockStore) => unknown) =>
    selector(mockStore),
}));

vi.mock("@/components/openclaw/OpenClawAssistantPane", () => ({
  OpenClawAssistantPane: (props: { integrationsHref?: string }) => {
    assistantPaneMock(props);
    return (
      <div data-testid="assistant-pane">
        assistant-pane:{props.integrationsHref ?? "missing"}
      </div>
    );
  },
}));

const emptyDefaults: IntegrationDefaults = {
  openclawUrl: "",
  openclawOrigin: "",
  openclawTokenConfigured: false,
  vaultUrl: "",
  vaultNamespace: "",
  vaultTokenConfigured: false,
  vaultSecretPath: "",
  vaultSecretKey: "",
  apisixUrl: "",
  apisixTokenConfigured: false,
};

describe("XWorkmateWorkspacePage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    assistantPaneMock.mockReset();
    mockStore.setScope.mockReset();
    mockStore.applyDefaults.mockReset();
    mockStore.setSelectedSessionKey.mockReset();
    mockStore.selectedSessionKey = "";
    mockStore.openclawUrl = "";
    mockStore.vaultUrl = "";
    mockStore.apisixUrl = "";
  });

  it("renders the desktop-style AI Gateway empty state and routes to xworkmate integrations", () => {
    render(
      <XWorkmateWorkspacePage
        defaults={emptyDefaults}
        profile={null}
        scopeKey="test-scope"
      />,
    );

    expect(screen.getByText("先配置 AI Gateway")).toBeInTheDocument();
    expect(
      screen.getByText(
        /请先在 Settings -> AI Gateway 中配置地址、API Key 和默认模型/,
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", { name: "配置 AI Gateway" })[0],
    );
    expect(pushMock).toHaveBeenCalledWith("/xworkmate/integrations");
  });

  it("renders the assistant pane when a gateway target is available", () => {
    const connectedDefaults: IntegrationDefaults = {
      ...emptyDefaults,
      openclawUrl: "wss://gateway.example.com",
      openclawTokenConfigured: true,
    };

    mockStore.openclawUrl = "wss://gateway.example.com";

    render(
      <XWorkmateWorkspacePage
        defaults={connectedDefaults}
        profile={null}
        scopeKey="test-scope"
      />,
    );

    expect(screen.getByTestId("assistant-pane")).toBeInTheDocument();
    expect(assistantPaneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        integrationsHref: "/xworkmate/integrations",
      }),
    );
  });
});
