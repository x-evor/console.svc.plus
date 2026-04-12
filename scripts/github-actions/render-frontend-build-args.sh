#!/usr/bin/env bash
set -euo pipefail

MODE="${1:---github-output}"

require_env() {
  local key="$1"
  local value="${!key-}"
  if [[ -z "${value}" ]]; then
    echo "Missing required environment variable: ${key}" >&2
    exit 1
  fi
}

emit_lines() {
  require_env CANONICAL_DOMAIN

  local canonical_domain="${CANONICAL_DOMAIN}"
  printf 'NODE_BUILDER_IMAGE=%s\n' "${NODE_BUILDER_IMAGE:-node:22-bookworm}"
  printf 'NODE_RUNTIME_IMAGE=%s\n' "${NODE_RUNTIME_IMAGE:-node:22-slim}"
  printf 'CONTENTLAYER_BUILD=%s\n' "${CONTENTLAYER_BUILD:-true}"
  printf 'NEXT_PUBLIC_APP_BASE_URL=%s\n' "${NEXT_PUBLIC_APP_BASE_URL:-https://${canonical_domain}}"
  printf 'NEXT_PUBLIC_SITE_URL=%s\n' "${NEXT_PUBLIC_SITE_URL:-https://${canonical_domain}}"
  printf 'NEXT_PUBLIC_LOGIN_URL=%s\n' "${NEXT_PUBLIC_LOGIN_URL:-https://${canonical_domain}/login}"
  printf 'NEXT_PUBLIC_DOCS_BASE_URL=%s\n' "${NEXT_PUBLIC_DOCS_BASE_URL:-https://${canonical_domain}/docs}"
  printf 'NEXT_PUBLIC_RUNTIME_ENVIRONMENT=%s\n' "${NEXT_PUBLIC_RUNTIME_ENVIRONMENT:-prod}"
  printf 'NEXT_PUBLIC_RUNTIME_REGION=%s\n' "${NEXT_PUBLIC_RUNTIME_REGION:-cn}"
  printf 'NEXT_PUBLIC_GISCUS_REPO=%s\n' "${NEXT_PUBLIC_GISCUS_REPO:-x-evor/console.svc.plus}"
  printf 'NEXT_PUBLIC_GISCUS_REPO_ID=%s\n' "${NEXT_PUBLIC_GISCUS_REPO_ID-}"
  printf 'NEXT_PUBLIC_GISCUS_CATEGORY=%s\n' "${NEXT_PUBLIC_GISCUS_CATEGORY:-General}"
  printf 'NEXT_PUBLIC_GISCUS_CATEGORY_ID=%s\n' "${NEXT_PUBLIC_GISCUS_CATEGORY_ID-}"
  printf 'NEXT_PUBLIC_PAYPAL_CLIENT_ID=%s\n' "${NEXT_PUBLIC_PAYPAL_CLIENT_ID-}"
  printf 'NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_PAYGO=%s\n' "${NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_PAYGO-}"
  printf 'NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_SUBSCRIPTION=%s\n' "${NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_SUBSCRIPTION-}"
  printf 'NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_PAYGO=%s\n' "${NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_PAYGO-}"
  printf 'NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_SUBSCRIPTION=%s\n' "${NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_SUBSCRIPTION-}"
  printf 'NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_PAYGO=%s\n' "${NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_PAYGO-}"
  printf 'NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_SUBSCRIPTION=%s\n' "${NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_SUBSCRIPTION-}"
}

if [[ "${MODE}" == "--stdout" ]]; then
  emit_lines
  exit 0
fi

if [[ -z "${GITHUB_OUTPUT-}" ]]; then
  echo "GITHUB_OUTPUT is not set" >&2
  exit 1
fi

{
  echo "build_args<<EOF"
  emit_lines
  echo "EOF"
} >> "${GITHUB_OUTPUT}"
