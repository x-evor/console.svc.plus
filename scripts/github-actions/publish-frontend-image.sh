#!/usr/bin/env bash
set -euo pipefail

bash scripts/github-actions/build-and-push-frontend-image.sh

printf 'image_ref=%s\n' "${IMAGE_REF:?IMAGE_REF is required}" >> "${GITHUB_OUTPUT}"
printf 'image_tag=%s\n' "${IMAGE_TAG:?IMAGE_TAG is required}" >> "${GITHUB_OUTPUT}"
