import type { PullRequestRef } from "../core/types";
import { withRetry } from "../core/retry";

export class GitHubClient {
  private readonly token: string;
  private readonly owner: string;
  private readonly repo: string;
  private readonly apiBase = "https://api.github.com";

  constructor(config?: { token?: string; owner?: string; repo?: string }) {
    this.token = config?.token ?? process.env.GITHUB_TOKEN ?? "";
    this.owner = config?.owner ?? process.env.GITHUB_OWNER ?? "";
    this.repo = config?.repo ?? process.env.GITHUB_REPO ?? "";
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.token || !this.owner || !this.repo) {
      throw new Error("Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO");
    }

    const response = await withRetry(async () =>
      fetch(`${this.apiBase}${path}`, {
        ...init,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(init?.headers ?? {})
        }
      })
    );

    if (!response.ok) {
      throw new Error(`GitHub API error ${response.status} for ${path}`);
    }

    return (await response.json()) as T;
  }

  async findPullRequestByCommit(commitSha: string): Promise<PullRequestRef | null> {
    const prs = await this.request<Array<{ number: number; title: string; html_url: string }>>(
      `/repos/${this.owner}/${this.repo}/commits/${commitSha}/pulls`
    );

    if (!prs.length) {
      return null;
    }

    return {
      number: prs[0].number,
      title: prs[0].title,
      url: prs[0].html_url
    };
  }

  async postIssueComment(prNumber: number, body: string): Promise<void> {
    await this.request(`/repos/${this.owner}/${this.repo}/issues/${prNumber}/comments`, {
      method: "POST",
      body: JSON.stringify({ body })
    });
  }
}
