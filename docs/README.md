# Documentation

This directory follows a standard open-source documentation layout and mirrors the code organization of `console.svc.plus`.

## Languages

- English (EN): this directory (`docs/`)
- Chinese (ZH): `docs/zh/` (stubs / translations)

## Structure

- `getting-started/` — new user path to get running quickly.
- `architecture/` — system design, boundaries, and decisions.
- `usage/` — configuration and how-to guides.
- `api/` — service API references.
- `integrations/` — external systems and providers.
- `advanced/` — performance, security, scalability, customization.
- `development/` — contributor guides and local setup.
- `operations/` — logging, monitoring, troubleshooting, runbooks.
- `governance/` — license, security policy, release process.
- `appendix/` — FAQ, glossary, references.

## Codebase Mapping

- App layer (Next.js): `src/app`, `src/components`, `src/lib`, `src/state`, `src/modules`
- Library layer (vendored): `packages/neurapress`
- Build/runtime glue: `scripts`, `config`, `public`

## Assistant Integrations

The homepage AI assistant and `/panel/api` integrations page read their defaults from environment variables on the server side. Use `.env.example` plus `getting-started/installation.md` for the canonical setup.

Canonical variables:

- `OPENCLAW_GATEWAY_REMOTE_URL`
- `OPENCLAW_GATEWAY_TOKEN`
- `VAULT_SERVER_URL`
- `VAULT_NAMESPACE`
- `VAULT_TOKEN`
- `APISIX_AI_GATEWAY_URL`
- `AI_GATEWAY_ACCESS_TOKEN`

## Index

- Getting Started
  - `getting-started/introduction.md`
  - `getting-started/quickstart.md`
  - `getting-started/installation.md`
  - `getting-started/concepts.md`
- Architecture
  - `architecture/overview.md`
  - `architecture/components.md`
  - `architecture/design-decisions.md`
  - `architecture/roadmap.md`
- Usage
  - `usage/cli.md`
  - `usage/config.md`
  - `usage/deployment.md`
  - `usage/examples.md`
- API
  - `api/overview.md`
  - `api/auth.md`
  - `api/endpoints.md`
  - `api/errors.md`
- Integrations
  - `integrations/databases.md`
  - `integrations/cloud.md`
  - `integrations/cloudflare-web-analytics.md`
  - `integrations/ai-providers.md`
- Advanced
  - `advanced/performance.md`
  - `advanced/security.md`
  - `advanced/scalability.md`
  - `advanced/customization.md`
- Development
  - `development/contributing.md`
  - `development/dev-setup.md`
  - `development/testing.md`
  - `development/code-structure.md`
- Operations
  - `operations/logging.md`
  - `operations/monitoring.md`
  - `operations/backup.md`
  - `operations/troubleshooting.md`
  - `operations/runbooks/README.md`
  - `operations/runbooks/rag-server.md`
- Governance
  - `governance/license.md`
  - `governance/security-policy.md`
  - `governance/release-process.md`
- Appendix
  - `appendix/faq.md`
  - `appendix/glossary.md`
  - `appendix/references.md`
