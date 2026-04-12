#!/usr/bin/env bash
set -euo pipefail

PRIMARY_DOMAIN="${1:?usage: verify-frontend-release.sh <primary-domain> <secondary-domain>}"
SECONDARY_DOMAIN="${2:?usage: verify-frontend-release.sh <primary-domain> <secondary-domain>}"
EXPECTED_IMAGE_REF="${3:?usage: verify-frontend-release.sh <primary-domain> <secondary-domain> <expected-image-ref>}"

primary_url="https://${PRIMARY_DOMAIN}"
secondary_url="https://${SECONDARY_DOMAIN}"
expected_image_tag_match="$(printf '%s' "${EXPECTED_IMAGE_REF}" | sed -nE 's#^.+:([^:@]+)$#\1#p')"
EXPECTED_IMAGE_TAG="${expected_image_tag_match}"

if [[ -z "${EXPECTED_IMAGE_TAG}" ]]; then
  echo "Expected image ref must include a tag, got: ${EXPECTED_IMAGE_REF}" >&2
  exit 1
fi

if [[ ! "${EXPECTED_IMAGE_TAG}" =~ ^[0-9a-f]{7,40}$ ]]; then
  echo "Expected image tag must contain a commit id, got: ${EXPECTED_IMAGE_TAG}" >&2
  exit 1
fi

curl -fsSIL "${primary_url}" >/dev/null

secondary_headers="$(curl -fsSIL "${secondary_url}")"
redirect_target="$(printf '%s\n' "${secondary_headers}" | awk 'tolower($1) == "location:" {print $2}' | tail -n 1 | tr -d '\r')"
if [[ "${redirect_target}" != "https://${PRIMARY_DOMAIN}/" && "${redirect_target}" != "https://${PRIMARY_DOMAIN}" ]]; then
  echo "Unexpected secondary redirect target: ${redirect_target}" >&2
  exit 1
fi

homepage_html="$(curl -fsSL "${primary_url}")"
asset_path="$(printf '%s' "${homepage_html}" | grep -Eo '/_next/static/[^"'"'"' ]+\.(css|js)' | head -n 1)"
if [[ -z "${asset_path}" ]]; then
  echo "Could not find a _next/static asset on the homepage" >&2
  exit 1
fi

curl -fsSIL "${primary_url}${asset_path}" >/dev/null
printf 'verified static asset: %s%s\n' "${primary_url}" "${asset_path}"

release_payload="$(curl -fsSL "${primary_url}/api/ping")"
release_metadata="$(
  RELEASE_PAYLOAD="${release_payload}" python3 - <<'PY'
import json
import os

payload = json.loads(os.environ["RELEASE_PAYLOAD"])
print(payload.get("releaseImageRef", ""))
print(payload.get("releaseImageTag", ""))
print(payload.get("releaseCommit", ""))
PY
)"

mapfile -t release_lines <<< "${release_metadata}"
actual_image_ref="${release_lines[0]-}"
actual_image_tag="${release_lines[1]-}"
actual_release_commit="${release_lines[2]-}"

if [[ -z "${actual_image_ref}" || -z "${actual_image_tag}" || -z "${actual_release_commit}" ]]; then
  echo "Remote release metadata is incomplete: ${release_payload}" >&2
  exit 1
fi

if [[ "${actual_image_ref}" != "${EXPECTED_IMAGE_REF}" ]]; then
  echo "Remote image ref mismatch: expected ${EXPECTED_IMAGE_REF}, got ${actual_image_ref}" >&2
  exit 1
fi

if [[ "${actual_image_tag}" != "${EXPECTED_IMAGE_TAG}" ]]; then
  echo "Remote image tag mismatch: expected ${EXPECTED_IMAGE_TAG}, got ${actual_image_tag}" >&2
  exit 1
fi

if [[ "${actual_release_commit}" != "${EXPECTED_IMAGE_TAG}" ]]; then
  echo "Remote release commit mismatch: expected ${EXPECTED_IMAGE_TAG}, got ${actual_release_commit}" >&2
  exit 1
fi

printf 'verified release image: %s\n' "${actual_image_ref}"
printf 'verified release commit: %s\n' "${actual_release_commit}"
