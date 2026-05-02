import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { verifyVercelSignature } from "../lib/webhook/signature";

describe("verifyVercelSignature", () => {
  afterEach(() => {
    delete process.env.VERCEL_WEBHOOK_SECRET;
  });

  it("verifies valid sha1 signature", () => {
    process.env.VERCEL_WEBHOOK_SECRET = "secret";
    const body = JSON.stringify({ id: "dpl_1" });
    const sig = createHmac("sha1", "secret").update(body).digest("hex");

    expect(verifyVercelSignature(body, sig)).toBe(true);
  });

  it("rejects invalid signature", () => {
    process.env.VERCEL_WEBHOOK_SECRET = "secret";
    const body = JSON.stringify({ id: "dpl_1" });

    expect(verifyVercelSignature(body, "abc123")).toBe(false);
  });
});
