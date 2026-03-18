#!/usr/bin/env bash
set -euo pipefail

: "${AMD_DIGEST_FILE:?AMD_DIGEST_FILE is required}"
: "${ARM_DIGEST_FILE:?ARM_DIGEST_FILE is required}"
: "${GITHUB_ENV:?GITHUB_ENV is required}"

echo "AMD_DIGEST=$(tr -d '\n' < "${AMD_DIGEST_FILE}")" >> "${GITHUB_ENV}"
echo "ARM_DIGEST=$(tr -d '\n' < "${ARM_DIGEST_FILE}")" >> "${GITHUB_ENV}"
