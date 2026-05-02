import type { DiagnosisCustomization } from "./types.js";

const DEFAULT_FOCUS = ["build", "runtime", "config"];

export function getDefaultCustomization(): DiagnosisCustomization {
  const envFocus = process.env.DIAGNOSER_DEFAULT_FOCUS;
  const focusAreas = envFocus
    ? envFocus.split(",").map((v) => v.trim()).filter(Boolean)
    : DEFAULT_FOCUS;

  const logWindowRaw = Number(process.env.DIAGNOSER_LOG_WINDOW ?? "30");
  const logWindow = Number.isFinite(logWindowRaw) ? Math.min(Math.max(logWindowRaw, 10), 200) : 30;

  return {
    focusAreas,
    logWindow,
    includeRecommendations: process.env.DIAGNOSER_INCLUDE_RECOMMENDATIONS !== "false"
  };
}

export function parseMentionCustomization(text: string): Partial<DiagnosisCustomization> {
  const input = text.toLowerCase();
  const updates: Partial<DiagnosisCustomization> = {};

  const focusMatch = input.match(/focus=([a-z0-9,_-]+)/);
  if (focusMatch) {
    updates.focusAreas = focusMatch[1].split(",").map((v) => v.trim()).filter(Boolean);
  }

  const logsMatch = input.match(/logs=(\d{1,3})/);
  if (logsMatch) {
    updates.logWindow = Math.min(Math.max(Number(logsMatch[1]), 10), 200);
  }

  if (input.includes("recommendations=off")) {
    updates.includeRecommendations = false;
  } else if (input.includes("recommendations=on")) {
    updates.includeRecommendations = true;
  }

  return updates;
}

export function mergeCustomization(
  base: DiagnosisCustomization,
  updates: Partial<DiagnosisCustomization>
): DiagnosisCustomization {
  return {
    focusAreas: updates.focusAreas?.length ? updates.focusAreas : base.focusAreas,
    logWindow: updates.logWindow ?? base.logWindow,
    includeRecommendations: updates.includeRecommendations ?? base.includeRecommendations
  };
}
