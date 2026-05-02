import type { DeploymentDiagnostics } from "../core/types";

function redact(line: string): string {
  return line
    .replace(/(token|secret|password|apikey)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
}

export function buildDiagnosisPrompt(diagnostics: DeploymentDiagnostics): string {
  const logs = diagnostics.logs.map((line) => `- ${redact(line)}`).join("\n");

  return [
    "You are a senior DevOps engineer diagnosing a failed Vercel production deployment.",
    "Return concise output only based on available evidence.",
    "",
    `Project: ${diagnostics.projectName}`,
    `Deployment ID: ${diagnostics.deploymentId}`,
    `Environment: ${diagnostics.environment}`,
    `State: ${diagnostics.state}`,
    `Commit SHA: ${diagnostics.commitSha ?? "unknown"}`,
    `Deployment URL: ${diagnostics.deploymentUrl}`,
    "",
    "Recent failure logs:",
    logs || "- No logs available"
  ].join("\n");
}
