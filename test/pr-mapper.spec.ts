import { describe, expect, it } from "vitest";
import { mapCommitToPullRequest } from "../lib/core/pr-mapper";

describe("mapCommitToPullRequest", () => {
  it("maps commit SHA to PR through GitHub client", async () => {
    const fakeGitHub = {
      findPullRequestByCommit: async (sha: string) =>
        sha === "abc123" ? { number: 42, title: "Fix", url: "https://github.com/x/y/pull/42" } : null
    };

    const result = await mapCommitToPullRequest(fakeGitHub as never, "abc123");
    expect(result?.number).toBe(42);
  });

  it("returns null when commit SHA is missing", async () => {
    const fakeGitHub = {
      findPullRequestByCommit: async () => ({ number: 42 })
    };

    const result = await mapCommitToPullRequest(fakeGitHub as never, undefined);
    expect(result).toBeNull();
  });
});
