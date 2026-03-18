# Deployment Runbook

## Scope

- Runtime: `console.svc.plus`
- Topology: `Caddy + Docker Compose + GitHub Actions`
- Deploy host: `root@47.120.61.35`
- Public domains:
  - `https://cn.svc.plus`
  - `https://cn.onwalk.net`
- Primary origin: `https://cn.svc.plus`

## Current Delivery Model

The production frontend is deployed as a prebuilt container image from GitHub Actions.

- The target host does not build images locally.
- The workflow builds an `linux/amd64` image and pushes it to `ghcr.io/<owner>/dashboard:<sha>`.
- The host only performs `docker login`, `docker compose pull`, static asset extraction, and `docker compose up`.
- `knowledge/` is cloned during CI build (via `scripts/sync-blog-content.sh`) and synced with other docs (via `scripts/sync-doc-content.sh`) before being packed into the image.
- Static assets are extracted from the image into a shared Docker volume so Caddy can serve `/_next/static/*` and checked-in public files directly.

This is intentionally static-first for the current weak-IO single-node host. Dynamic HTML, auth routes, and API proxy routes still run through the Next.js container. When `docs.svc.plus` is later split into an API/service, revisit this runbook and remove docs content from the frontend image.

## Control Plane & DNS Stage

The control repo (`github-org-cloud-neutral-toolkit`) tracks `console.svc.plus` through `console.svc.plus.code-workspace` and keeps the `subrepos/accounts.svc.plus` pointer in sync via `skills/cross-repo-upstream-submodule-sync`. Releases resolve metadata with that workspace and the `config/single-node-release` manifests. After `.github/workflows/service_release_frontend-deploy.yml` finishes pushing the new image, the control-plane workflow `.github/workflows/service_release_apiserver-deploy.yml` calls `scripts/github-actions/update-release-dns.sh` to update Cloudflare DNS so the new endpoint is reachable under `cn.svc.plus` and `cn.onwalk.net`.

## Future Docs Strategy

Because the frontend currently ships docs content directly (knowledge/blog + rendered markdown), any future split where `docs.svc.plus` becomes an API-backed service should include a repo-level migration plan: stop syncing docs into the frontend image, move documentation storage/serving into the dedicated API, and adjust the runbook/workflow notes above accordingly.

## Runtime Layout

Remote directory:

```bash
/opt/console-svc-plus
```

Files deployed there:

```bash
docker-compose.yml
Caddyfile
.env.runtime
```

Containers:

- `dashboard`: Next.js standalone runtime on port `3000`
- `frontend-assets`: one-shot task that copies `static/` and `public/` into a shared volume
- `caddy`: TLS termination and reverse proxy

## GitHub Actions Inputs

Workflow:

```text
.github/workflows/service_release_frontend-deploy.yml
```

Secrets required:

- `FRONTEND_DEPLOY_SSH_KEY`
- `OPENCLAW_GATEWAY_TOKEN` if used
- `VAULT_TOKEN` if used
- `AI_GATEWAY_ACCESS_TOKEN` if used
- `INTERNAL_SERVICE_TOKEN` if used
- `CLOUDFLARE_API_TOKEN` if used

Repository/environment variables recommended:

- `APP_BASE_URL`
- `NEXT_PUBLIC_APP_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_LOGIN_URL`
- `NEXT_PUBLIC_DOCS_BASE_URL`
- `ACCOUNT_SERVICE_URL`
- `NEXT_PUBLIC_ACCOUNT_SERVICE_URL`
- `SERVER_SERVICE_URL`
- `NEXT_PUBLIC_SERVER_SERVICE_URL`
- `RUNTIME_HOSTNAME`
- `DEPLOYMENT_HOSTNAME`
- `NEXT_PUBLIC_RUNTIME_ENVIRONMENT`
- `NEXT_PUBLIC_RUNTIME_REGION`
- `NEXT_PUBLIC_GISCUS_*`
- `NEXT_PUBLIC_STRIPE_*`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

## Release Flow

1. GitHub Actions checks out the repo.
2. GitHub Actions clones `knowledge/`.
3. Docker builds the frontend image with the public `NEXT_PUBLIC_*` values needed at build time.
4. The image is pushed to GHCR.
5. The workflow renders `.env.runtime`.
6. The workflow uploads `docker-compose.yml`, `Caddyfile`, and `.env.runtime` to the host.
7. The host pulls the new image, refreshes the static asset volume, and starts `dashboard + caddy`.
8. The workflow verifies `cn.svc.plus` and `cn.onwalk.net`.

## Verification Commands

Local syntax checks:

```bash
cd /Users/shenlan/workspaces/cloud-neutral-toolkit/console.svc.plus
bash -n scripts/github-actions/render-frontend-runtime-env.sh
bash -n scripts/github-actions/deploy-frontend-single-node.sh
cp deploy/single-node/.env.runtime.example deploy/single-node/.env.runtime
docker compose -f deploy/single-node/docker-compose.yml --env-file deploy/single-node/.env.runtime config >/tmp/console-compose.rendered.yaml
rm -f deploy/single-node/.env.runtime
python3 - <<'PY'
from pathlib import Path
import yaml
yaml.safe_load(Path('.github/workflows/service_release_frontend-deploy.yml').read_text())
print('workflow yaml ok')
PY
```

Remote checks:

```bash
ssh root@47.120.61.35 "cd /opt/console-svc-plus && docker compose --env-file .env.runtime ps"
ssh root@47.120.61.35 "curl -fsSI -H 'Host: cn.svc.plus' http://127.0.0.1/"
curl -fsSIL https://cn.svc.plus
curl -fsSIL https://cn.onwalk.net
```

## Failure Signatures

- `docker login ghcr.io` fails
  The workflow token or package visibility is wrong.
- `frontend-assets` fails
  The image layout changed and no longer contains `/app/dashboard/static` or `/app/dashboard/public`.
- `cn.svc.plus` returns `502`
  Caddy is up, but the `dashboard` container failed or is not reachable on port `3000`.
- `cn.onwalk.net` does not redirect
  Check the deployed `Caddyfile` and domain DNS.

## Rollback

1. Re-run the workflow with a previous known-good image tag.
2. Or update `/opt/console-svc-plus/.env.runtime` and set `FRONTEND_IMAGE=ghcr.io/<owner>/dashboard:<previous-tag>`.
3. Restart the services:

```bash
ssh root@47.120.61.35 "cd /opt/console-svc-plus && docker compose --env-file .env.runtime run --rm frontend-assets"
ssh root@47.120.61.35 "cd /opt/console-svc-plus && docker compose --env-file .env.runtime up -d dashboard caddy"
```

4. Verify `https://cn.svc.plus` again before closing the incident.
