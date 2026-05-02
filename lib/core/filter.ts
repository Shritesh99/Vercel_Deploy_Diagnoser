import type { VercelWebhookPayload } from "./types";

const FAILURE_STATES = new Set(["ERROR", "CANCELED"]);

export function isProductionFailure(payload: VercelWebhookPayload): boolean {
  if (payload.target !== "production") {
    return false;
  }

  if (!payload.state) {
    return false;
  }

  return FAILURE_STATES.has(payload.state);
}
