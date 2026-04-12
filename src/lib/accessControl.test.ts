import { describe, expect, it } from "vitest";

import { resolveAccess } from "@lib/accessControl";

describe("accessControl", () => {
  it("blocks unauthenticated access when login is required", () => {
    expect(
      resolveAccess(null, {
        requireLogin: true,
      }),
    ).toMatchObject({
      allowed: false,
      reason: "unauthenticated",
    });
  });

  it("allows anonymous access only when guests are explicitly allowed", () => {
    expect(
      resolveAccess(null, {
        allowGuests: true,
      }),
    ).toMatchObject({
      allowed: true,
    });
  });
});
