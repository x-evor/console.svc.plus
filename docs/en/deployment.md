# Deployment

## Production Baseline

- Runtime: `Caddy + Docker Compose`
- Deploy host: `47.120.61.35`
- Domains:
  - `cn.svc.plus`
  - `cn.onwalk.net`
- Frontend release workflow: `.github/workflows/service_release_frontend-deploy.yml`

## Operating Model

The frontend is built in GitHub Actions and shipped as a prebuilt `linux/amd64` image. The host only pulls the image and starts containers; it does not build locally.

`yarn prebuild` bundles the docs, blog, and static content needed by the console. During that phase the CI container runs `scripts/sync-doc-content.sh` (pulling docs from this repo plus `accounts.svc.plus`, `rag-server.svc.plus`, and `postgresql.svc.plus`) and `scripts/sync-blog-content.sh` (cloning `https://github.com/cloud-neutral-workshop/knowledge.git`), so the `knowledge/` directory and all documentation assets already live inside the image before the runtime stage begins.

The stack is static-first:

- Caddy serves `/_next/static/*` and public assets from a shared read-only volume.
- The Next.js standalone container serves dynamic HTML, auth endpoints, and API proxy routes. Static assets and hashed CSS/JS files are extracted by the `frontend-assets` helper task, so the runtime no longer needs to compile anything on the single-node host.
- `knowledge/` and the synced docs/blog assets are copied into the image during the Docker build via the GitHub Actions workflow.

Releases are orchestrated through `.github/workflows/service_release_frontend-deploy.yml`. That workflow clones the knowledge repository, runs the Docker build/push sequence, renders `.env.runtime`, and ships `docker-compose.yml`, `Caddyfile`, and the runtime env file to the host. The control-plane workflow `.github/workflows/service_release_apiserver-deploy.yml` then updates Cloudflare DNS for the release domain (via `scripts/github-actions/update-release-dns.sh`) so `cn.svc.plus` and the redirected alias `cn.onwalk.net` point at the new environment.

This baseline is intentional for the weak-IO single-node host (47.120.61.35). No images are built on the target machine, keeping the deployment lightweight: the host only logs into GHCR, pulls the `dashboard` image, extracts assets into `frontend_static`, and starts `dashboard` plus `caddy` containers via `docker compose`.

If `docs.svc.plus` is later refactored into a dedicated API service, revisit this writeup (and the runbook) so the GitHub Actions pipeline only bundles the API payloads that belong to that new service.

## Related Docs

- `usage/deployment.md`
- `governance/release-process.md`
- `development/dev-setup.md`
