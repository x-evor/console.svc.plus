#!/usr/bin/env bash
set -euo pipefail

: "${IMAGE_DIGEST:?IMAGE_DIGEST is required}"
: "${OUTPUT_FILE:?OUTPUT_FILE is required}"

printf '%s\n' "${IMAGE_DIGEST}" > "${OUTPUT_FILE}"
