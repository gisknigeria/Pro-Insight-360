## Summary

Provide a short description of the changes in this PR.

## What I changed
- Fixed integration tests and made them idempotent.
- Added minimal `/settings` endpoint and fixed ordering in conflicts query.
- Added CI workflow to run Prisma migrations and build the frontend.

## How to test
- Ensure required secrets are set (see DEPLOYMENT.md).
- Run the GitHub Actions workflow `CI / Migrate & Build` manually or push to `main`.

## Checklist
- [ ] Environment secrets configured
- [ ] Verified migrations run on staging
- [ ] Frontend builds successfully on Vercel
