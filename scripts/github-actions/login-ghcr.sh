#!/usr/bin/env bash
set -euo pipefail

ghcr_token="${GHCR_TOKEN:?GHCR_TOKEN is required}"
ghcr_username="${GHCR_USERNAME:?GHCR_USERNAME is required}"

printf '%s' "${ghcr_token}" | docker login ghcr.io -u "${ghcr_username}" --password-stdin
