#!/usr/bin/env bash
set -euo pipefail

CANONICAL_DOMAIN="${1:?usage: verify-frontend-release.sh <canonical-domain> <served-domains>}"
SERVED_DOMAINS="${2:?usage: verify-frontend-release.sh <canonical-domain> <served-domains>}"
EXPECTED_DASHBOARD_URL="https://${CANONICAL_DOMAIN}"

curl_headers=(
  -H 'user-agent: Mozilla/5.0 (compatible; console-release-validator/1.0; +https://www.svc.plus)'
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  -H 'accept-language: en-US,en;q=0.9'
)

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "${value}"
}

parse_release_metadata() {
  local payload="$1"
  RELEASE_PAYLOAD="${payload}" python3 - <<'PY'
import json
import os

payload = json.loads(os.environ["RELEASE_PAYLOAD"])
print(payload.get("releaseImageRef", ""))
print(payload.get("releaseImageTag", ""))
print(payload.get("releaseCommit", ""))
print(payload.get("dashboardUrl", ""))
PY
}

require_http_200() {
  local url="$1"
  shift

  local http_code
  http_code="$(curl -sS -o /dev/null -w '%{http_code}' "$@" "${url}")"
  if [[ "${http_code}" != "200" ]]; then
    echo "Expected HTTP 200 from ${url}, got ${http_code}" >&2
    exit 1
  fi
}

verify_domain() {
  local domain="$1"
  local url="https://${domain}"
  local homepage_html asset_path release_payload release_metadata
  local actual_image_ref actual_image_tag actual_release_commit actual_dashboard_url
  local release_lines

  require_http_200 "${url}" "${curl_headers[@]}"
  printf 'verified homepage for %s: 200\n' "${domain}" >&2

  homepage_html="$(curl -fsSL "${curl_headers[@]}" "${url}")"
  asset_path="$(printf '%s' "${homepage_html}" | grep -Eo '/_next/static/[^"'"'"' ]+\.(css|js)' | head -n 1)"
  if [[ -z "${asset_path}" ]]; then
    echo "Could not find a _next/static asset on ${url}" >&2
    exit 1
  fi

  require_http_200 "${url}${asset_path}" "${curl_headers[@]}"
  printf 'verified static asset for %s: %s%s\n' "${domain}" "${url}" "${asset_path}" >&2

  require_http_200 "${url}/api/ping" "${curl_headers[@]}"
  release_payload="$(curl -fsSL "${curl_headers[@]}" "${url}/api/ping")"
  release_metadata="$(parse_release_metadata "${release_payload}")"

  mapfile -t release_lines <<< "${release_metadata}"
  actual_image_ref="${release_lines[0]-}"
  actual_image_tag="${release_lines[1]-}"
  actual_release_commit="${release_lines[2]-}"
  actual_dashboard_url="${release_lines[3]-}"

  if [[ -z "${actual_image_ref}" || -z "${actual_image_tag}" || -z "${actual_release_commit}" ]]; then
    echo "Remote release metadata is incomplete for ${domain}: ${release_payload}" >&2
    exit 1
  fi

  if [[ ! "${actual_image_tag}" =~ ^[0-9a-f]{7,40}$ ]]; then
    echo "Remote image tag must contain a commit id for ${domain}, got: ${actual_image_tag}" >&2
    exit 1
  fi

  if [[ "${actual_release_commit}" != "${actual_image_tag}" ]]; then
    echo "Remote release commit mismatch for ${domain}: expected ${actual_image_tag}, got ${actual_release_commit}" >&2
    exit 1
  fi

  if [[ "${actual_dashboard_url}" != "${EXPECTED_DASHBOARD_URL}" ]]; then
    echo "Remote dashboardUrl mismatch for ${domain}: expected ${EXPECTED_DASHBOARD_URL}, got ${actual_dashboard_url}" >&2
    exit 1
  fi

  printf 'verified release image for %s: %s\n' "${domain}" "${actual_image_ref}" >&2
  printf 'verified release commit for %s: %s\n' "${domain}" "${actual_release_commit}" >&2
  printf 'verified dashboardUrl for %s: %s\n' "${domain}" "${actual_dashboard_url}" >&2

  printf '%s\t%s\t%s\t%s\t%s\n' "${domain}" "${actual_image_ref}" "${actual_image_tag}" "${actual_release_commit}" "${actual_dashboard_url}"
}

mapfile -t served_domains < <(
  printf '%s' "${SERVED_DOMAINS}" | tr ',' '\n' | while IFS= read -r domain; do
    domain="$(trim "${domain}")"
    if [[ -n "${domain}" ]]; then
      printf '%s\n' "${domain}"
    fi
  done
)

if [[ "${#served_domains[@]}" -eq 0 ]]; then
  echo "No served domains were provided." >&2
  exit 1
fi

canonical_found=false
declare -a verification_rows=()

for domain in "${served_domains[@]}"; do
  if [[ "${domain}" == "${CANONICAL_DOMAIN}" ]]; then
    canonical_found=true
  fi
  verification_rows+=("$(verify_domain "${domain}")")
done

if [[ "${canonical_found}" != "true" ]]; then
  echo "Canonical domain ${CANONICAL_DOMAIN} must be included in served domains: ${SERVED_DOMAINS}" >&2
  exit 1
fi

reference_image_ref=""
reference_image_tag=""
reference_release_commit=""
reference_dashboard_url=""

for row in "${verification_rows[@]}"; do
  IFS=$'\t' read -r domain actual_image_ref actual_image_tag actual_release_commit actual_dashboard_url <<< "${row}"

  if [[ -z "${reference_image_ref}" ]]; then
    reference_image_ref="${actual_image_ref}"
    reference_image_tag="${actual_image_tag}"
    reference_release_commit="${actual_release_commit}"
    reference_dashboard_url="${actual_dashboard_url}"
    continue
  fi

  if [[ "${actual_image_ref}" != "${reference_image_ref}" ]]; then
    echo "Release image mismatch across served domains: ${domain} returned ${actual_image_ref}, expected ${reference_image_ref}" >&2
    exit 1
  fi

  if [[ "${actual_image_tag}" != "${reference_image_tag}" ]]; then
    echo "Release tag mismatch across served domains: ${domain} returned ${actual_image_tag}, expected ${reference_image_tag}" >&2
    exit 1
  fi

  if [[ "${actual_release_commit}" != "${reference_release_commit}" ]]; then
    echo "Release commit mismatch across served domains: ${domain} returned ${actual_release_commit}, expected ${reference_release_commit}" >&2
    exit 1
  fi

  if [[ "${actual_dashboard_url}" != "${reference_dashboard_url}" ]]; then
    echo "dashboardUrl mismatch across served domains: ${domain} returned ${actual_dashboard_url}, expected ${reference_dashboard_url}" >&2
    exit 1
  fi
done
