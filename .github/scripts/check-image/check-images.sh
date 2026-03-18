#!/usr/bin/env bash
set -euo pipefail

: "${TAG:?TAG is required}"
: "${IMAGE_LIST_FILE:?IMAGE_LIST_FILE is required}"

while IFS= read -r image; do
  [ -n "${image}" ] || continue
  echo "Checking ${image}:${TAG}"
  docker manifest inspect "${image}:${TAG}" > /dev/null
  docker pull "${image}:${TAG}" > /dev/null
done < "${IMAGE_LIST_FILE}"
