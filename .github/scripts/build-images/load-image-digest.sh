#!/usr/bin/env bash
set -euo pipefail

: "${DIGEST_FILE:?DIGEST_FILE is required}"
: "${GITHUB_ENV:?GITHUB_ENV is required}"

echo "IMAGE_DIGEST=$(tr -d '\n' < "${DIGEST_FILE}")" >> "${GITHUB_ENV}"
