#!/usr/bin/env bash
set -euo pipefail

: "${REGISTRY:?REGISTRY is required}"
: "${ORG:?ORG is required}"
: "${IMAGE_SHA:?IMAGE_SHA is required}"
: "${AMD_DIGEST:?AMD_DIGEST is required}"
: "${ARM_DIGEST:?ARM_DIGEST is required}"
: "${TAGS_CSV:?TAGS_CSV is required}"
: "${GITHUB_ENV:?GITHUB_ENV is required}"

src_amd="${REGISTRY}/${ORG}/dashboard:build-${IMAGE_SHA}-linux-amd64@${AMD_DIGEST}"
src_arm="${REGISTRY}/${ORG}/dashboard:build-${IMAGE_SHA}-linux-arm64@${ARM_DIGEST}"

first_tag=""
while IFS= read -r tag; do
  [ -n "${tag}" ] || continue
  if [ -z "${first_tag}" ]; then
    first_tag="${tag}"
  fi
  docker buildx imagetools create -t "${tag}" "${src_amd}" "${src_arm}"
done < <(printf '%s' "${TAGS_CSV}" | tr ',' '\n')

[ -n "${first_tag}" ] || {
  echo "No tags were generated." >&2
  exit 1
}

manifest_digest="$(docker buildx imagetools inspect "${first_tag}" --format '{{.Digest}}')"
echo "MANIFEST_DIGEST=${manifest_digest}" >> "${GITHUB_ENV}"
echo "FINAL_TAG=${first_tag}" >> "${GITHUB_ENV}"
