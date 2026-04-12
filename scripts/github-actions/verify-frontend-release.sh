#!/usr/bin/env bash
set -euo pipefail

PRIMARY_DOMAIN="${1:?usage: verify-frontend-release.sh <primary-domain>}"

primary_url="https://${PRIMARY_DOMAIN}"

curl -fsSIL "${primary_url}" >/dev/null

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

if [[ ! "${actual_image_tag}" =~ ^[0-9a-f]{7,40}$ ]]; then
  echo "Remote image tag must contain a commit id, got: ${actual_image_tag}" >&2
  exit 1
fi

if [[ "${actual_release_commit}" != "${actual_image_tag}" ]]; then
  echo "Remote release commit mismatch: expected ${actual_image_tag}, got ${actual_release_commit}" >&2
  exit 1
fi

printf 'verified release image: %s\n' "${actual_image_ref}"
printf 'verified release commit: %s\n' "${actual_release_commit}"
