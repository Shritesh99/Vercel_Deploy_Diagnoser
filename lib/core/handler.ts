import { ClaudeDiagnoser } from "../diagnosis/claude";
import { GitHubClient } from "../github/client";
import { VercelClient } from "../vercel/client";
import { isProductionFailure } from "./filter";
import { isDuplicateEvent, makeEventKey } from "./idempotency";
import { mapCommitToPullRequest } from "./pr-mapper";
import type { DiagnosisResult, VercelWebhookPayload } from "./types";

function renderComment(
  diagnosis: DiagnosisResult,
  input: { deploymentId: string; deploymentUrl: string; environment: string; state: string }
): string {
  const evidence = diagnosis.evidence.map((item) => `- ${item}`).join("\n");
  const fixes = diagnosis.fixSuggestions.map((item) => `1. ${item}`).join("\n");

  return [
    `## Vercel Deployment Failure: \`${input.deploymentId}\` (${input.environment})`,
    "",
    `**Status:** ${input.state}`,
    `**Root cause:** ${diagnosis.rootCause}`,
    "",
    "**Evidence**",
    evidence,
    "",
    "**Suggested fixes**",
    fixes,
    "",
    `**Confidence:** ${diagnosis.confidence}`,
    `**Logs:** ${input.deploymentUrl}`
  ].join("\n");
}

export class DeploymentFailureHandler {
  constructor(
    private readonly vercelClient = new VercelClient(),
    private readonly githubClient = new GitHubClient(),
    private readonly diagnoser = new ClaudeDiagnoser()
  ) {}

  async handle(payload: VercelWebhookPayload): Promise<{ status: number; message: string }> {
    if (!isProductionFailure(payload)) {
      return { status: 200, message: "Ignored non-production or non-failure event." };
    }

    const key = makeEventKey(payload.id, payload.state ?? "unknown");
    if (isDuplicateEvent(key)) {
      return { status: 200, message: "Duplicate deployment event ignored." };
    }

    const diagnostics = await this.vercelClient.getDiagnosticsFromPayload(payload);
    const pr = await mapCommitToPullRequest(this.githubClient, diagnostics.commitSha);

    if (!pr) {
      return { status: 202, message: "No linked PR found for deployment commit." };
    }

    let diagnosis: DiagnosisResult;
    try {
      diagnosis = await this.diagnoser.diagnose(diagnostics);
    } catch {
      diagnosis = {
        rootCause: "Automated diagnosis failed to execute.",
        evidence: ["Unable to parse diagnostics with model."],
        fixSuggestions: ["Review full Vercel logs and rerun deployment after fixing root error."],
        confidence: "low"
      };
    }

    const comment = renderComment(diagnosis, {
      deploymentId: diagnostics.deploymentId,
      deploymentUrl: diagnostics.deploymentUrl,
      environment: diagnostics.environment,
      state: diagnostics.state
    });

    await this.githubClient.postIssueComment(pr.number, comment);
    return { status: 200, message: `Comment posted to PR #${pr.number}.` };
  }
}
