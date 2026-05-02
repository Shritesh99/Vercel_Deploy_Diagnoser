# Vercel Deployment Failure Diagnoser Bot

GitHub mention-triggered bot that fetches failed Vercel deployment logs and analyzes root cause with Claude.

## What It Does

- Listens to GitHub mentions through Chat SDK webhook.
- Accepts deployment ID from mention command.
- Pulls deployment details and logs from Vercel API.
- Analyzes failure logs with Claude.
- Posts diagnosis back in the same PR/comment thread.

## Mention Commands

- `@<BOT_USERNAME> diagnose deployment=dpl_xxx`
- `@<BOT_USERNAME> diagnose deployment=dpl_xxx focus=build,runtime logs=50 recommendations=off`

## Customization Flags

- `focus=` comma-separated focus areas.
- `logs=` recent log lines to inspect (10-200).
- `recommendations=on|off` include or skip fix steps.

## Environment Variables

- `GITHUB_TOKEN`
- `GITHUB_WEBHOOK_SECRET`
- `REDIS_URL`
- `BOT_USERNAME`
- `VERCEL_TOKEN`
- `ANTHROPIC_API_KEY`
- `AI_MODEL` (optional)
- `DIAGNOSER_DEFAULT_FOCUS` (optional, default: `build,runtime,config`)
- `DIAGNOSER_LOG_WINDOW` (optional, default: `30`)
- `DIAGNOSER_INCLUDE_RECOMMENDATIONS` (optional, default: `true`)

## Run And Deploy

1. Install:

```bash
npm install
```

1. Start local dev:

```bash
npx tsx src/index.ts
```

1. Configure GitHub webhook:
   - URL: `https://<your-domain>/api/webhooks/github`
   - Secret: `GITHUB_WEBHOOK_SECRET`
   - Events: issue comments + pull request review comments
1. Deploy to Vercel.

## Reference

- [Ship a GitHub code review bot with Hono and Redis](https://vercel.com/kb/guide/ship-a-github-code-review-bot-with-hono-and-redis)
