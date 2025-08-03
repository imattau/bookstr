#!/bin/bash
set -e

# container engine detection (override with CONTAINER_CLI)
ENGINE=${CONTAINER_CLI:-}

if [ -z "$ENGINE" ]; then
  if command -v podman >/dev/null 2>&1; then
    ENGINE=podman
  elif command -v docker >/dev/null 2>&1; then
    ENGINE=docker
  else
    echo "Neither podman nor docker is installed. Please install one to continue." >&2
    exit 1
  fi
fi

exec "$ENGINE" compose up "$@"
