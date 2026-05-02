import { waitUntil } from "@vercel/functions";
import { Hono } from "hono";
import { bot } from "./bot.js";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Vercel Deployment Diagnoser bot is running.");
});

app.post("/api/webhooks/github", async (c) => {
	try {
		console.log("Webhook received");

		const handler = bot.webhooks.github;
		if (!handler) {
			console.log("GitHub adapter not configured");
			return c.text("GitHub adapter not configured", 404);
		}

		console.log("Calling GitHub handler...");
		const response = await handler(c.req.raw, { waitUntil });
		console.log("Handler completed successfully");
		return response;
	} catch (error) {
		console.error("Webhook error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error("Error details:", errorMessage);
		return c.text(`Internal server error: ${errorMessage}`, 500);
	}
});

export default app;
