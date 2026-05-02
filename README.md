# Vercel Deploy Diagnoser

A Vercel webhook-driven GitHub bot that posts a new PR comment for each failed production deployment, including Claude-based diagnosis and actionable fixes.

## Features

- Verifies Vercel webhook signatures.
- Filters to failed production deployments only.
- Resolves linked PR from commit SHA.
- Diagnoses failure with Claude Opus via Vercel AI SDK.
- Posts a new GitHub PR comment for each failed deployment.
- Adds retry behavior and deployment-state idempotency keys.

## Project Structure

- `app/api/webhooks/vercel/route.ts`: webhook entrypoint.
- `lib/core/handler.ts`: orchestration pipeline.
- `lib/vercel/client.ts`: Vercel API integration.
- `lib/github/client.ts`: GitHub API integration.
- `lib/diagnosis/claude.ts`: Claude structured diagnosis.
- `test/*.spec.ts`: unit tests.

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```bash
npm install
```

3. Run tests:

```bash
npm test
```

4. Configure Vercel webhook to call your endpoint:

`/api/webhooks/vercel`

## Required Permissions

- GitHub PAT should allow creating PR issue comments in the target repository.
- Vercel token should allow reading deployment details/events.
