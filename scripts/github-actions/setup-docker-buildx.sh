#!/usr/bin/env bash
set -euo pipefail

docker buildx create --name console-builder --use >/dev/null 2>&1 || docker buildx use console-builder
docker buildx inspect --bootstrap
