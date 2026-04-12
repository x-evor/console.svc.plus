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

GHCR_REGISTRY="${GHCR_REGISTRY:-ghcr.io}"

reject_remote_build_configuration() {
  local compose_file="$1"

  if grep -Eq '^[[:space:]]*(build|dockerfile):' "${compose_file}"; then
    echo "Deployment package must reference prebuilt images only; compose build directives are forbidden." >&2
    exit 1
  fi
}

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

reject_remote_build_configuration "${WORK_DIR}/docker-compose.yml"

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

printf '%s' "${GHCR_PASSWORD}" | "${SSH_BASE[@]}" \
  "GHCR_REGISTRY='${GHCR_REGISTRY}' GHCR_USERNAME='${GHCR_USERNAME}' bash -s" <<'EOF'
set -euo pipefail

require_sudo_prefix() {
  if [[ "${EUID}" -eq 0 ]]; then
    return 0
  fi

  if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
    printf 'sudo -n'
    return 0
  fi

  echo "Remote host requires root or passwordless sudo to install or manage Docker." >&2
  exit 1
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi

  local sudo_prefix
  sudo_prefix="$(require_sudo_prefix)"

  if command -v apt-get >/dev/null 2>&1; then
    ${sudo_prefix} apt-get update
    if ! DEBIAN_FRONTEND=noninteractive ${sudo_prefix} apt-get install -y docker.io docker-compose-plugin; then
      DEBIAN_FRONTEND=noninteractive ${sudo_prefix} apt-get install -y docker.io docker-compose-v2
    fi

    if command -v systemctl >/dev/null 2>&1; then
      ${sudo_prefix} systemctl enable --now docker
    else
      ${sudo_prefix} service docker start
    fi

    return 0
  fi

  echo "Docker is not installed and this script only knows how to install it on apt-based hosts." >&2
  exit 1
}

docker_runner() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi

  local sudo_prefix
  sudo_prefix="$(require_sudo_prefix)"

  if ${sudo_prefix} docker info >/dev/null 2>&1; then
    printf '%s' "${sudo_prefix}"
    return 0
  fi

  echo "Docker is installed but not accessible for the deploy user." >&2
  exit 1
}

ensure_docker
docker_prefix="$(docker_runner)"
printf '%s' "${GHCR_PASSWORD}" | ${docker_prefix:+${docker_prefix} }docker login "${GHCR_REGISTRY}" -u "${GHCR_USERNAME}" --password-stdin
EOF

"${SCP_BASE[@]}" "${RELEASE_ARCHIVE}" "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_ARCHIVE}"

"${SSH_BASE[@]}" \
  "DEPLOY_DIR='${DEPLOY_DIR}' REMOTE_ARCHIVE='${REMOTE_ARCHIVE}' PROJECT_NAME='console-svc-plus' bash -s" <<'EOF'
set -euo pipefail

require_sudo_prefix() {
  if [[ "${EUID}" -eq 0 ]]; then
    return 0
  fi

  if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
    printf 'sudo -n'
    return 0
  fi

  echo "Remote host requires root or passwordless sudo to install or manage Docker." >&2
  exit 1
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi

  local sudo_prefix
  sudo_prefix="$(require_sudo_prefix)"

  if command -v apt-get >/dev/null 2>&1; then
    ${sudo_prefix} apt-get update
    if ! DEBIAN_FRONTEND=noninteractive ${sudo_prefix} apt-get install -y docker.io docker-compose-plugin; then
      DEBIAN_FRONTEND=noninteractive ${sudo_prefix} apt-get install -y docker.io docker-compose-v2
    fi

    if command -v systemctl >/dev/null 2>&1; then
      ${sudo_prefix} systemctl enable --now docker
    else
      ${sudo_prefix} service docker start
    fi

    return 0
  fi

  echo "Docker is not installed and this script only knows how to install it on apt-based hosts." >&2
  exit 1
}

docker_runner() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi

  local sudo_prefix
  sudo_prefix="$(require_sudo_prefix)"

  if ${sudo_prefix} docker info >/dev/null 2>&1; then
    printf '%s' "${sudo_prefix}"
    return 0
  fi

  echo "Docker is installed but not accessible for the deploy user." >&2
  exit 1
}

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}" "${REMOTE_ARCHIVE}"' EXIT

ensure_docker
docker_prefix="$(docker_runner)"

mkdir -p "${DEPLOY_DIR}"
tar -xzf "${REMOTE_ARCHIVE}" -C "${tmp_dir}"

install -m 0644 "${tmp_dir}/docker-compose.yml" "${DEPLOY_DIR}/docker-compose.yml"
install -m 0644 "${tmp_dir}/Caddyfile" "${DEPLOY_DIR}/Caddyfile"
install -m 0600 "${tmp_dir}/.env.runtime" "${DEPLOY_DIR}/.env.runtime"

cd "${DEPLOY_DIR}"
${docker_prefix:+${docker_prefix} }docker compose --project-name "${PROJECT_NAME}" --env-file .env.runtime pull dashboard caddy
${docker_prefix:+${docker_prefix} }docker compose --project-name "${PROJECT_NAME}" --env-file .env.runtime run --rm frontend-assets
${docker_prefix:+${docker_prefix} }docker compose --project-name "${PROJECT_NAME}" --env-file .env.runtime up -d --remove-orphans dashboard caddy
${docker_prefix:+${docker_prefix} }docker compose --project-name "${PROJECT_NAME}" --env-file .env.runtime ps
EOF
