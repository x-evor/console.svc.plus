#!/usr/bin/env bash
set -euo pipefail

: "${ORG:?ORG is required}"
: "${MANIFEST_DIGEST:?MANIFEST_DIGEST is required}"
: "${TARGET_NS:?TARGET_NS is required}"
: "${GHCR_USERNAME:?GHCR_USERNAME is required}"
: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${DOCKERHUB_USERNAME:?DOCKERHUB_USERNAME is required}"
: "${DOCKERHUB_TOKEN:?DOCKERHUB_TOKEN is required}"

sudo apt-get update -y
sudo apt-get install -y skopeo

src="docker://ghcr.io/${ORG}/dashboard@${MANIFEST_DIGEST}"
dst="docker://docker.io/${TARGET_NS}/dashboard:latest"

skopeo login ghcr.io -u "${GHCR_USERNAME}" -p "${GHCR_TOKEN}"
skopeo login docker.io -u "${DOCKERHUB_USERNAME}" -p "${DOCKERHUB_TOKEN}"
skopeo copy --all "${src}" "${dst}"
