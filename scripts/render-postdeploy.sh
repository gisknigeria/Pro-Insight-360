#!/usr/bin/env bash
set -euo pipefail

# Render post-deploy helper
# Use this to run migrations and build the API on the Render instance

echo "Running post-deploy steps..."
npm ci
cd "apps/api"
echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma
echo "Building API..."
npm -w api run build
echo "Post-deploy complete."
