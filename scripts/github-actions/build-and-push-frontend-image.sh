#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

require_env() {
  local key="$1"
  local value="${!key-}"
  if [[ -z "${value}" ]]; then
    echo "Missing required environment variable: ${key}" >&2
    exit 1
  fi
}

require_env IMAGE_REF
require_env PRIMARY_DOMAIN

BUILD_ARGS_FILE="$(mktemp)"
trap 'rm -f "${BUILD_ARGS_FILE}"' EXIT

"${SCRIPT_DIR}/render-frontend-build-args.sh" --stdout > "${BUILD_ARGS_FILE}"

build_args=()
while IFS= read -r line; do
  if [[ -z "${line}" ]]; then
    continue
  fi
  build_args+=(--build-arg "${line}")
done < "${BUILD_ARGS_FILE}"

tag_args=(--tag "${IMAGE_REF}")
if [[ "${PUSH_LATEST:-false}" == "true" ]]; then
  require_env IMAGE_LATEST_REF
  tag_args+=(--tag "${IMAGE_LATEST_REF}")
fi

docker buildx build \
  --platform "${DOCKER_PLATFORM:-linux/amd64}" \
  --file "${REPO_ROOT}/Dockerfile" \
  "${tag_args[@]}" \
  "${build_args[@]}" \
  --push \
  "${REPO_ROOT}"
