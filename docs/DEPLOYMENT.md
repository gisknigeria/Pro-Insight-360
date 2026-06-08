# Deployment Guide

This document outlines steps to deploy the Pro-Insight 360 app to Vercel (frontend) and Render (backend), and how to run Prisma migrations safely.

## Required environment variables (set these in Vercel / Render / GitHub Secrets)
- `DATABASE_URL` (Postgres connection string for Prisma)
- `DIRECT_DATABASE_URL` (if your migration/deploy process requires a direct URL)
- `JWT_SECRET`
- `FRONTEND_URLS` (comma-separated allowed origins)
- `APP_NAME`
- Optional: `S3`/`AWS` creds, `REDIS_URL`, `EMAIL_*` provider keys
- `RENDER_API_KEY` and `RENDER_SERVICE_ID` (optional, for triggering Render deploys from CI)
- `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` (optional, for triggering Vercel deploys from CI)

## Render (backend)
1. Create a Web Service using the repository and set the root to the repository root.
2. Build command: `npm --prefix "apps/api" install`
3. Start command: `npm --prefix "apps/api" start`
4. Health check path: `/health`
5. Add the environment variables above in Render's dashboard.
6. To run migrations on deploy, use the GitHub Actions workflow `CI / Migrate & Build` which runs `npx prisma migrate deploy`.

## Vercel (frontend)
1. Create a new project from the GitHub repo, set the root directory to `apps/web`.
2. Install command: `npm --prefix "apps/web" install`
3. Build command: `npm --prefix "apps/web" run build`
4. Set `NEXT_PUBLIC_API_URL` to your API base URL (e.g., `https://api.example.com`).
5. Set other frontend env vars as required.

## CI: Migrations and Deploy
- A GitHub Actions workflow `.github/workflows/ci-migrate-deploy.yml` is included. It will:
  - Install dependencies.
  - Run `npx prisma migrate deploy` using `DATABASE_URL` from GitHub Secrets.
  - Build the frontend.
  - Optionally trigger Render and Vercel deploys if API keys are provided in Secrets.

## Running migrations manually (local)
1. Ensure your local `apps/api/.env` contains `DATABASE_URL` (do NOT commit secrets).
2. Run:
```
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

## Notes
- Do not commit production credentials to the repository. Use platform secret storage.
- Test migrations against a staging DB before running in production.
