#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEPLOY_SOURCE_DIR="${REPO_ROOT}/deploy/single-node"

require_env() {
  local key="$1"
  local value="${!key-}"
  if [[ -z "${value}" ]]; then
    echo "Missing required environment variable: ${key}" >&2
    exit 1
  fi
}

require_env DEPLOY_HOST
require_env DEPLOY_USER
require_env DEPLOY_DIR
require_env SINGLE_NODE_VPS_SSH_PRIVATE_KEY
require_env GHCR_USERNAME
require_env GHCR_PASSWORD
require_env FRONTEND_IMAGE
require_env PRIMARY_DOMAIN
require_env SECONDARY_DOMAIN

GHCR_REGISTRY="${GHCR_REGISTRY:-ghcr.io}"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

RUNTIME_ENV_FILE="${WORK_DIR}/.env.runtime"
RELEASE_ARCHIVE="${WORK_DIR}/console-svc-plus-release.tgz"
REMOTE_ARCHIVE="/tmp/console-svc-plus-release-${GITHUB_SHA:-manual}.tgz"
SSH_KEY_FILE="${WORK_DIR}/deploy.key"
KNOWN_HOSTS_FILE="${WORK_DIR}/known_hosts"

bash "${SCRIPT_DIR}/render-frontend-runtime-env.sh" "${RUNTIME_ENV_FILE}"

cp "${DEPLOY_SOURCE_DIR}/docker-compose.yml" "${WORK_DIR}/docker-compose.yml"
cp "${DEPLOY_SOURCE_DIR}/Caddyfile" "${WORK_DIR}/Caddyfile"

tar -C "${WORK_DIR}" -czf "${RELEASE_ARCHIVE}" \
  docker-compose.yml \
  Caddyfile \
  .env.runtime

printf '%s\n' "${SINGLE_NODE_VPS_SSH_PRIVATE_KEY}" > "${SSH_KEY_FILE}"
chmod 600 "${SSH_KEY_FILE}"
ssh-keyscan -H "${DEPLOY_HOST}" > "${KNOWN_HOSTS_FILE}"

SSH_BASE=(
  ssh
  -i "${SSH_KEY_FILE}"
  -o StrictHostKeyChecking=yes
  -o UserKnownHostsFile="${KNOWN_HOSTS_FILE}"
  "${DEPLOY_USER}@${DEPLOY_HOST}"
)

SCP_BASE=(
  scp
  -i "${SSH_KEY_FILE}"
  -o StrictHostKeyChecking=yes
  -o UserKnownHostsFile="${KNOWN_HOSTS_FILE}"
)

printf '%s' "${GHCR_PASSWORD}" | "${SSH_BASE[@]}" "docker login '${GHCR_REGISTRY}' -u '${GHCR_USERNAME}' --password-stdin"

"${SCP_BASE[@]}" "${RELEASE_ARCHIVE}" "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_ARCHIVE}"

"${SSH_BASE[@]}" \
  "DEPLOY_DIR='${DEPLOY_DIR}' REMOTE_ARCHIVE='${REMOTE_ARCHIVE}' PROJECT_NAME='console-svc-plus' bash -s" <<'EOF'
set -euo pipefail

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}" "${REMOTE_ARCHIVE}"' EXIT

mkdir -p "${DEPLOY_DIR}"
tar -xzf "${REMOTE_ARCHIVE}" -C "${tmp_dir}"

install -m 0644 "${tmp_dir}/docker-compose.yml" "${DEPLOY_DIR}/docker-compose.yml"
install -m 0644 "${tmp_dir}/Caddyfile" "${DEPLOY_DIR}/Caddyfile"
install -m 0600 "${tmp_dir}/.env.runtime" "${DEPLOY_DIR}/.env.runtime"

cd "${DEPLOY_DIR}"
docker compose --project-name "${PROJECT_NAME}" --env-file .env.runtime pull dashboard caddy
docker compose --project-name "${PROJECT_NAME}" --env-file .env.runtime run --rm frontend-assets
docker compose --project-name "${PROJECT_NAME}" --env-file .env.runtime up -d --remove-orphans dashboard caddy
docker compose --project-name "${PROJECT_NAME}" --env-file .env.runtime ps
EOF
