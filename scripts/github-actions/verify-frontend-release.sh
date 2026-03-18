#!/usr/bin/env bash
set -euo pipefail

PRIMARY_DOMAIN="${1:?usage: verify-frontend-release.sh <primary-domain> <secondary-domain>}"
SECONDARY_DOMAIN="${2:?usage: verify-frontend-release.sh <primary-domain> <secondary-domain>}"

primary_url="https://${PRIMARY_DOMAIN}"
secondary_url="https://${SECONDARY_DOMAIN}"

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
