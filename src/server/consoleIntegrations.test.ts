// @vitest-environment node

import { afterAll, beforeEach, describe, expect, it } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("consoleIntegrations", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.EXTERNAL_SERVICES;
    delete process.env.NEXT_PUBLIC_EXTERNAL_SERVICES;
    delete process.env.EXTERNAL_SERVICE;
    delete process.env.NEXT_PUBLIC_EXTERNAL_SERVICE;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("parses configured external services into a stable list", async () => {
    process.env.EXTERNAL_SERVICES =
      "docs.svc.plus, xworkmate.svc.plus\nopenclaw-gateway.svc.plus";

    const { getConsoleIntegrationDefaults } = await import("./consoleIntegrations");

    expect(getConsoleIntegrationDefaults().externalServices).toEqual([
      "docs.svc.plus",
      "xworkmate.svc.plus",
      "openclaw-gateway.svc.plus",
    ]);
  });

  it("defaults to an empty external services list when unset", async () => {
    const { getConsoleIntegrationDefaults } = await import("./consoleIntegrations");

    expect(getConsoleIntegrationDefaults().externalServices).toEqual([]);
  });

  it("accepts the singular external service env var as a fallback", async () => {
    process.env.EXTERNAL_SERVICE = "docs.svc.plus;xworkmate.svc.plus";

    const { getConsoleIntegrationDefaults } = await import("./consoleIntegrations");

    expect(getConsoleIntegrationDefaults().externalServices).toEqual([
      "docs.svc.plus",
      "xworkmate.svc.plus",
    ]);
  });
});
