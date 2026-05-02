import { DeploymentFailureHandler } from "../../../../lib/core/handler";
import type { VercelWebhookPayload } from "../../../../lib/core/types";
import { verifyVercelSignature } from "../../../../lib/webhook/signature";

const handler = new DeploymentFailureHandler();

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-vercel-signature") ?? request.headers.get("x-vercel-signature-sha256");

  if (!verifyVercelSignature(rawBody, signature)) {
    return Response.json({ message: "Invalid webhook signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as VercelWebhookPayload;
  const result = await handler.handle(payload);

  return Response.json({ message: result.message }, { status: result.status });
}
