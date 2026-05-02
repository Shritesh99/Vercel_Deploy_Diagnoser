import { waitUntil } from "@vercel/functions";
import { Hono } from "hono";
import { bot } from "./bot.js";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Vercel Deployment Diagnoser bot is running.");
});

app.post("/api/webhooks/github", async (c) => {
  const handler = bot.webhooks.github;
  if (!handler) {
    return c.text("GitHub adapter not configured", 404);
  }

  return handler(c.req.raw, { waitUntil });
});

export default app;
