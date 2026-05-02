import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import type { DeploymentDiagnostics, DiagnosisCustomization, DiagnosisResult } from "./types.js";

const schema = z.object({
  rootCause: z.string().min(1),
  evidence: z.array(z.string()).min(1).max(4),
  fixSuggestions: z.array(z.string()).min(1).max(5),
  confidence: z.enum(["high", "medium", "low"])
});

function redact(line: string): string {
  return line
    .replace(/(token|secret|password|apikey)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
}

export async function diagnoseDeploymentFailure(
  diagnostics: DeploymentDiagnostics,
  customization: DiagnosisCustomization
): Promise<DiagnosisResult> {
  const model = process.env.AI_MODEL ?? "claude-opus-4-1";
  const logText = diagnostics.logs.map((line) => `- ${redact(line)}`).join("\n");

  const prompt = [
    "You are diagnosing a failed Vercel deployment.",
    `Focus areas: ${customization.focusAreas.join(", ")}.`,
    customization.includeRecommendations
      ? "Include concrete remediation suggestions."
      : "Skip remediation suggestions, give diagnosis only.",
    "",
    `Deployment ID: ${diagnostics.deploymentId}`,
    `Project: ${diagnostics.projectName}`,
    `Environment: ${diagnostics.environment}`,
    `State: ${diagnostics.state}`,
    `Deployment URL: ${diagnostics.deploymentUrl}`,
    "",
    "Logs:",
    logText || "- No logs found"
  ].join("\n");

  const { object } = await generateObject({
    model: anthropic(model),
    schema,
    prompt
  });

  if (!customization.includeRecommendations) {
    return { ...object, fixSuggestions: ["Recommendations disabled for this run."] };
  }

  return object;
}

export function renderDiagnosisComment(
  diagnostics: DeploymentDiagnostics,
  diagnosis: DiagnosisResult
): string {
  const evidence = diagnosis.evidence.map((item) => `- ${item}`).join("\n");
  const fixes = diagnosis.fixSuggestions.map((item) => `1. ${item}`).join("\n");

  return [
    `## Deployment Diagnosis \`${diagnostics.deploymentId}\``,
    "",
    `**Project:** ${diagnostics.projectName}`,
    `**Environment:** ${diagnostics.environment}`,
    `**Status:** ${diagnostics.state}`,
    "",
    `**Root cause:** ${diagnosis.rootCause}`,
    "",
    "**Evidence**",
    evidence,
    "",
    "**Suggested fixes**",
    fixes,
    "",
    `**Confidence:** ${diagnosis.confidence}`,
    `**Logs:** ${diagnostics.deploymentUrl}`
  ].join("\n");
}
