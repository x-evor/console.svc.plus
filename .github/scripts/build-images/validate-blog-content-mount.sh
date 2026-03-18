#!/usr/bin/env bash
set -euo pipefail

: "${IMAGE:?IMAGE is required}"
: "${KNOWLEDGE_CONTENT_DIR:?KNOWLEDGE_CONTENT_DIR is required}"

docker pull "${IMAGE}"
docker run --rm \
  -v "${KNOWLEDGE_CONTENT_DIR}:/app/dashboard/src/content/blog:ro" \
  "${IMAGE}" \
  sh -c 'test -d /app/dashboard/src/content/blog'
