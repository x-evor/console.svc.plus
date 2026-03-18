#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false
if [[ "${1-}" == "--dry-run" ]]; then
  DRY_RUN=true
  shift
fi

TARGET_IP="${1:?usage: ensure-frontend-dns.sh [--dry-run] <target-ip> <primary-domain> <secondary-domain>}"
PRIMARY_DOMAIN="${2:?usage: ensure-frontend-dns.sh [--dry-run] <target-ip> <primary-domain> <secondary-domain>}"
SECONDARY_DOMAIN="${3:?usage: ensure-frontend-dns.sh [--dry-run] <target-ip> <primary-domain> <secondary-domain>}"
PROXIED="${CLOUDFLARE_PROXIED:-true}"

require_env() {
  local key="$1"
  local value="${!key-}"
  if [[ -z "${value}" ]]; then
    echo "Missing required environment variable: ${key}" >&2
    exit 1
  fi
}

json_get() {
  local expression="$1"
  python3 -c "import json,sys; data=json.load(sys.stdin); ${expression}"
}

dns_payload() {
  local domain="$1"
  DOMAIN="${domain}" TARGET_IP="${TARGET_IP}" PROXIED="${PROXIED}" python3 -c \
    'import json, os; print(json.dumps({"type": "A", "name": os.environ["DOMAIN"], "content": os.environ["TARGET_IP"], "ttl": 1, "proxied": os.environ["PROXIED"].lower() == "true"}))'
}

upsert_record() {
  local domain="$1"
  local payload
  local response
  local record_id

  payload="$(dns_payload "${domain}")"

  if [[ "${DRY_RUN}" == "true" ]]; then
    printf 'dry-run: upsert %s -> %s\n' "${domain}" "${TARGET_IP}"
    printf '%s\n' "${payload}"
    return 0
  fi

  response="$(
    curl -fsS \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_TAG}/dns_records?type=A&name=${domain}"
  )"

  if [[ "$(printf '%s' "${response}" | json_get 'print("true" if data.get("success") else "false")')" != "true" ]]; then
    echo "Failed to query Cloudflare DNS records for ${domain}" >&2
    exit 1
  fi

  record_id="$(printf '%s' "${response}" | json_get 'result=data.get("result", []); print(result[0]["id"] if result else "")')"

  if [[ -n "${record_id}" ]]; then
    response="$(
      curl -fsS -X PUT \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "${payload}" \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_TAG}/dns_records/${record_id}"
    )"
  else
    response="$(
      curl -fsS -X POST \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "${payload}" \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_TAG}/dns_records"
    )"
  fi

  if [[ "$(printf '%s' "${response}" | json_get 'print("true" if data.get("success") else "false")')" != "true" ]]; then
    echo "Failed to upsert Cloudflare DNS record for ${domain}" >&2
    exit 1
  fi

  printf 'updated: %s -> %s\n' "${domain}" "${TARGET_IP}"
}

if [[ "${DRY_RUN}" != "true" ]]; then
  require_env CLOUDFLARE_API_TOKEN
  require_env CLOUDFLARE_ZONE_TAG
fi

upsert_record "${PRIMARY_DOMAIN}"
upsert_record "${SECONDARY_DOMAIN}"
