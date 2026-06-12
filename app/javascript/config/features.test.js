import { describe, expect, it } from "vitest";
import { logoutDestination } from "./features";

describe("logoutDestination", () => {
  it("returns the portfolio root when portfolio mode is enabled", () => {
    expect(logoutDestination(true)).toBe("/");
  });

  it("returns the login path when portfolio mode is disabled", () => {
    expect(logoutDestination(false)).toBe("/login");
  });
});
