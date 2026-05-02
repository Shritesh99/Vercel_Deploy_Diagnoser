export type DeploymentState = "READY" | "ERROR" | "CANCELED" | "BUILDING" | "QUEUED";

export interface VercelWebhookPayload {
  id: string;
  target?: "production" | "preview";
  state?: DeploymentState | string;
  url?: string;
  meta?: Record<string, string>;
  creator?: { username?: string };
  project?: { id?: string; name?: string };
  createdAt?: number;
}

export interface DeploymentDiagnostics {
  deploymentId: string;
  projectName: string;
  environment: "production" | "preview";
  deploymentUrl: string;
  state: string;
  commitSha?: string;
  logs: string[];
}

export interface DiagnosisResult {
  rootCause: string;
  evidence: string[];
  fixSuggestions: string[];
  confidence: "high" | "medium" | "low";
}

export interface PullRequestRef {
  number: number;
  title?: string;
  url?: string;
}
