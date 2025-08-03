#!/bin/bash
set -e

# container engine (override with CONTAINER_CLI=docker)
CONTAINER_CLI=${CONTAINER_CLI:-podman}

# install dependencies
npm ci

# copy env file if missing
if [ ! -f .env ]; then
  cp .env.example .env
fi

# run tests
npm test

# build static files
npm run build

# build container image including API server
$CONTAINER_CLI build -t bookstr:latest .

echo "Container image 'bookstr:latest' built successfully."

echo "Run '$CONTAINER_CLI run -p 3000:3000 bookstr:latest' to start the container. Set PORT to change the internal server port."
