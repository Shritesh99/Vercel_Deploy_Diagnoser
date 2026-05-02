import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { DeploymentDiagnostics, DiagnosisResult } from "../core/types";
import { buildDiagnosisPrompt } from "./prompt";

const diagnosisSchema = z.object({
  rootCause: z.string().min(1),
  evidence: z.array(z.string()).min(1).max(4),
  fixSuggestions: z.array(z.string()).min(1).max(5),
  confidence: z.enum(["high", "medium", "low"])
});

export class ClaudeDiagnoser {
  constructor(private readonly model = process.env.AI_MODEL ?? "claude-opus-4-1") {}

  async diagnose(diagnostics: DeploymentDiagnostics): Promise<DiagnosisResult> {
    const prompt = buildDiagnosisPrompt(diagnostics);

    const result = await generateObject({
      model: anthropic(this.model),
      schema: diagnosisSchema,
      prompt
    });

    return result.object;
  }
}
