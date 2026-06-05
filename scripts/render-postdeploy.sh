#!/usr/bin/env bash
set -euo pipefail

# Render post-deploy helper
# Use this to run migrations and build the API on the Render instance

echo "Running post-deploy steps..."
corepack enable
pnpm install --frozen-lockfile
cd "apps/api"
echo "Running Prisma migrations..."
pnpm prisma migrate deploy
echo "Building API..."
pnpm run build:api
echo "Post-deploy complete."
