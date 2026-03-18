#!/usr/bin/env bash
set -euo pipefail

: "${REGISTRY:?REGISTRY is required}"
: "${ORG:?ORG is required}"
: "${SERVICE_NAME:?SERVICE_NAME is required}"
: "${IMAGE_DIGEST:?IMAGE_DIGEST is required}"
: "${IMAGE_SHA:?IMAGE_SHA is required}"
: "${IMAGE_ARTIFACT:?IMAGE_ARTIFACT is required}"
: "${GITHUB_ENV:?GITHUB_ENV is required}"

echo "IMG=${REGISTRY}/${ORG}/${SERVICE_NAME}:build-${IMAGE_SHA}-${IMAGE_ARTIFACT}@${IMAGE_DIGEST}" >> "${GITHUB_ENV}"
