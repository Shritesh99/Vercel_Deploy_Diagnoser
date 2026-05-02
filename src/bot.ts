import { Chat } from "chat";
import { createGitHubAdapter } from "@chat-adapter/github";
import { createRedisState } from "@chat-adapter/state-redis";
import { getDefaultCustomization, mergeCustomization, parseMentionCustomization } from "./config.js";
import { diagnoseDeploymentFailure, renderDiagnosisComment } from "./diagnose.js";
import { VercelClient } from "./vercel.js";

const defaults = getDefaultCustomization();
const vercelClient = new VercelClient();

function textFromMessage(message: unknown): string {
  if (!message || typeof message !== "object") {
    return "";
  }

  const maybe = message as { text?: string; content?: string };
  return maybe.text ?? maybe.content ?? "";
}

function extractDeploymentId(text: string): string | null {
  const byFlag = text.match(/deployment=([a-zA-Z0-9_:-]+)/);
  if (byFlag?.[1]) {
    return byFlag[1];
  }

  const fallback = text.match(/dpl_[a-zA-Z0-9]+/);
  return fallback?.[0] ?? null;
}

function usageMessage(): string {
  return [
    "Usage:",
    "- `@bot diagnose deployment=dpl_xxx`",
    "- `@bot diagnose deployment=dpl_xxx focus=build,runtime logs=50 recommendations=off`"
  ].join("\n");
}

export const bot = new Chat({
  userName: process.env.BOT_USERNAME ?? "vercel-diagnoser",
  adapters: {
    github: createGitHubAdapter()
  },
  state: createRedisState()
});

bot.onNewMention(async (thread, message) => {
  const text = textFromMessage(message);
  const lower = text.toLowerCase();

  if (!lower.includes("diagnose")) {
    await thread.post(usageMessage());
    return;
  }

  const deploymentId = extractDeploymentId(text);
  if (!deploymentId) {
    await thread.post("Please provide deployment id, e.g. `deployment=dpl_xxx`.");
    return;
  }

  const customization = mergeCustomization(defaults, parseMentionCustomization(text));
  await thread.post(`Analyzing failed deployment \`${deploymentId}\`...`);

  try {
    const diagnostics = await vercelClient.getDiagnosticsByDeploymentId(
      deploymentId,
      customization.logWindow
    );

    if (diagnostics.state !== "ERROR" && diagnostics.state !== "CANCELED") {
      await thread.post(
        `Deployment \`${deploymentId}\` is in state \`${diagnostics.state}\`, not a failed terminal state.`
      );
      return;
    }

    const diagnosis = await diagnoseDeploymentFailure(diagnostics, customization);
    await thread.post(renderDiagnosisComment(diagnostics, diagnosis));
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown error";
    await thread.post(`Diagnosis failed: ${messageText}`);
  }
});
