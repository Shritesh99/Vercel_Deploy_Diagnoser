import type { PullRequestRef } from "./types";
import { GitHubClient } from "../github/client";

export async function mapCommitToPullRequest(
  github: GitHubClient,
  commitSha?: string
): Promise<PullRequestRef | null> {
  if (!commitSha) {
    return null;
  }

  return github.findPullRequestByCommit(commitSha);
}
