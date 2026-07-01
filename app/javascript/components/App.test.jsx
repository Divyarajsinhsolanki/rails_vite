import { describe, expect, it } from "vitest";
import { routeFrameKeyForPath } from "../utils/routeFrameKey";

describe("routeFrameKeyForPath", () => {
  it("keeps chat routes mounted while switching conversations", () => {
    expect(routeFrameKeyForPath("/chat")).toBe("/chat");
    expect(routeFrameKeyForPath("/chat/1")).toBe("/chat");
    expect(routeFrameKeyForPath("/chat/2")).toBe("/chat");
  });

  it("keeps non-chat routes keyed by path", () => {
    expect(routeFrameKeyForPath("/projects")).toBe("/projects");
    expect(routeFrameKeyForPath("/projects/1/dashboard")).toBe("/projects/1/dashboard");
  });
});
