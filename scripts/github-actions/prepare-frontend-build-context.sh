#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
KNOWLEDGE_DIR="${REPO_ROOT}/knowledge"
KNOWLEDGE_REPO="${KNOWLEDGE_REPO:-https://github.com/Cloud-Neutral-Workshop/knowledge.git}"

rm -rf "${KNOWLEDGE_DIR}"
git clone --depth=1 "${KNOWLEDGE_REPO}" "${KNOWLEDGE_DIR}"
