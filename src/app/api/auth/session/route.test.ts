// @vitest-environment node

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const cookiesMock = vi.hoisted(() => vi.fn());
const ORIGINAL_ENV = { ...process.env };

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

describe("/api/auth/session", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    cookiesMock.mockReset();
    process.env = { ...ORIGINAL_ENV };
    process.env.ACCOUNT_SERVICE_URL = "https://accounts.svc.plus";
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    process.env = ORIGINAL_ENV;
  });

  it("drops guest sessions instead of exposing them as authenticated users", async () => {
    cookiesMock.mockResolvedValue({
      get(name: string) {
        if (name === "xc_session") {
          return { value: "guest-session-token" };
        }
        return undefined;
      },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "guest-1",
            email: "guest@svc.plus",
            role: "guest",
            username: "guest",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const request = new NextRequest("https://console.svc.plus/api/auth/session", {
      headers: {
        host: "console.svc.plus",
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
  });
});
