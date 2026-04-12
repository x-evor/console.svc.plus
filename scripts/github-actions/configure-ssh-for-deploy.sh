#!/usr/bin/env bash
set -euo pipefail

target_host="${TARGET_HOST:?TARGET_HOST is required}"
private_key="${SINGLE_NODE_VPS_SSH_PRIVATE_KEY:?SINGLE_NODE_VPS_SSH_PRIVATE_KEY is required}"

mkdir -p ~/.ssh
chmod 700 ~/.ssh
printf '%s\n' "${private_key}" | tr -d '\r' > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
ssh-keyscan -H "${target_host}" >> ~/.ssh/known_hosts
chmod 644 ~/.ssh/known_hosts
