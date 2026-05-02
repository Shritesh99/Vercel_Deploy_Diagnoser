import { beforeEach, describe, expect, it } from "vitest";
import { DeploymentFailureHandler } from "../lib/core/handler";
import { clearIdempotencyStore } from "../lib/core/idempotency";

describe("DeploymentFailureHandler", () => {
  beforeEach(() => {
    clearIdempotencyStore();
  });

  it("posts a comment for a production failure", async () => {
    const comments: Array<{ pr: number; body: string }> = [];

    const handler = new DeploymentFailureHandler(
      {
        getDiagnosticsFromPayload: async () => ({
          deploymentId: "dpl_1",
          projectName: "demo",
          environment: "production",
          deploymentUrl: "https://demo.vercel.app",
          state: "ERROR",
          commitSha: "abc123",
          logs: ["Build failed: module not found"]
        })
      } as never,
      {
        findPullRequestByCommit: async () => ({ number: 7 }),
        postIssueComment: async (pr: number, body: string) => {
          comments.push({ pr, body });
        }
      } as never,
      {
        diagnose: async () => ({
          rootCause: "Missing dependency in build step",
          evidence: ["Build failed: module not found"],
          fixSuggestions: ["Install missing package", "Commit lockfile"],
          confidence: "high"
        })
      } as never
    );

    const result = await handler.handle({
      id: "dpl_1",
      target: "production",
      state: "ERROR"
    });

    expect(result.status).toBe(200);
    expect(comments).toHaveLength(1);
    expect(comments[0].pr).toBe(7);
    expect(comments[0].body).toContain("Missing dependency in build step");
  });

  it("ignores duplicate events by deployment and state", async () => {
    const handler = new DeploymentFailureHandler(
      {
        getDiagnosticsFromPayload: async () => ({
          deploymentId: "dpl_1",
          projectName: "demo",
          environment: "production",
          deploymentUrl: "https://demo.vercel.app",
          state: "ERROR",
          commitSha: "abc123",
          logs: []
        })
      } as never,
      {
        findPullRequestByCommit: async () => ({ number: 7 }),
        postIssueComment: async () => {}
      } as never,
      {
        diagnose: async () => ({
          rootCause: "test",
          evidence: ["test"],
          fixSuggestions: ["test"],
          confidence: "low"
        })
      } as never
    );

    const payload = { id: "dpl_1", target: "production", state: "ERROR" } as const;
    const first = await handler.handle(payload);
    const second = await handler.handle(payload);

    expect(first.status).toBe(200);
    expect(second.message).toContain("Duplicate");
  });
});
