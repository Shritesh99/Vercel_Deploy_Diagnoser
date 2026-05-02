import { describe, expect, it } from "vitest";
import { isProductionFailure } from "../lib/core/filter";

describe("isProductionFailure", () => {
  it("returns true for production ERROR", () => {
    expect(isProductionFailure({ id: "dpl_1", target: "production", state: "ERROR" })).toBe(true);
  });

  it("returns false for preview failures", () => {
    expect(isProductionFailure({ id: "dpl_2", target: "preview", state: "ERROR" })).toBe(false);
  });

  it("returns false for successful production deployments", () => {
    expect(isProductionFailure({ id: "dpl_3", target: "production", state: "READY" })).toBe(false);
  });
});
