import { describe, expect, it } from "vitest";

import {
  hasPublicUserEmail,
  resolvePublicUserEmail,
} from "@lib/publicUserIdentity";

describe("publicUserIdentity", () => {
  it("returns the public email value when present", () => {
    expect(
      resolvePublicUserEmail({
        email: "admin@svc.plus",
        role: "admin",
      }),
    ).toBe("admin@svc.plus");
  });

  it("normalizes empty public emails", () => {
    expect(
      resolvePublicUserEmail({
        email: "   ",
      }),
    ).toBe("");
  });

  it("detects whether a public email should be rendered", () => {
    expect(hasPublicUserEmail({ email: "" })).toBe(false);
    expect(
      hasPublicUserEmail({
        email: "admin@svc.plus",
        role: "admin",
      }),
    ).toBe(true);
  });
});
