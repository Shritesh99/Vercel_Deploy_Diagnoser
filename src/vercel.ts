import type { DeploymentDiagnostics } from "./types.js";

export class VercelClient {
  constructor(
    private readonly token = process.env.VERCEL_TOKEN,
    private readonly baseUrl = "https://api.vercel.com"
  ) {}

  private async request<T>(path: string): Promise<T> {
    if (!this.token) {
      throw new Error("Missing VERCEL_TOKEN");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Vercel API error ${response.status} (${path})`);
    }

    return (await response.json()) as T;
  }

  async getDiagnosticsByDeploymentId(
    deploymentId: string,
    logWindow: number
  ): Promise<DeploymentDiagnostics> {
    const deployment = await this.request<{
      id: string;
      url: string;
      target?: string;
      state: string;
      meta?: Record<string, string>;
      project?: { name?: string };
    }>(`/v13/deployments/${deploymentId}`);

    const events = await this.request<{ events?: Array<{ text?: string }> }>(
      `/v2/deployments/${deploymentId}/events`
    );

    const logs = (events.events ?? [])
      .map((event) => event.text ?? "")
      .filter(Boolean)
      .slice(-logWindow);

    return {
      deploymentId: deployment.id,
      projectName: deployment.project?.name ?? "unknown-project",
      environment: deployment.target ?? "unknown",
      state: deployment.state,
      deploymentUrl: deployment.url ? `https://${deployment.url}` : "",
      commitSha: deployment.meta?.githubCommitSha,
      logs
    };
  }
}
