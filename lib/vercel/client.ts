import type { DeploymentDiagnostics, VercelWebhookPayload } from "../core/types";
import { withRetry } from "../core/retry";

export class VercelClient {
  constructor(
    private readonly token = process.env.VERCEL_TOKEN,
    private readonly baseUrl = "https://api.vercel.com"
  ) {}

  private async request<T>(path: string): Promise<T> {
    if (!this.token) {
      throw new Error("Missing VERCEL_TOKEN");
    }

    const response = await withRetry(async () =>
      fetch(`${this.baseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })
    );

    if (!response.ok) {
      throw new Error(`Vercel API error ${response.status} for ${path}`);
    }

    return (await response.json()) as T;
  }

  async getDiagnosticsFromPayload(payload: VercelWebhookPayload): Promise<DeploymentDiagnostics> {
    const deployment = await this.request<{
      id: string;
      url: string;
      target?: "production" | "preview";
      state: string;
      meta?: Record<string, string>;
      project?: { name?: string };
    }>(`/v13/deployments/${payload.id}`);

    const events = await this.request<{ events?: Array<{ text?: string }> }>(
      `/v2/deployments/${payload.id}/events`
    );

    const logs = (events.events ?? [])
      .map((event) => event.text ?? "")
      .filter((text) => Boolean(text))
      .slice(-30);

    return {
      deploymentId: deployment.id,
      projectName: deployment.project?.name ?? payload.project?.name ?? "unknown-project",
      environment: deployment.target ?? payload.target ?? "preview",
      deploymentUrl: deployment.url ? `https://${deployment.url}` : payload.url ?? "",
      state: deployment.state,
      commitSha: deployment.meta?.githubCommitSha ?? payload.meta?.githubCommitSha,
      logs
    };
  }
}
