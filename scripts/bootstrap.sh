#!/bin/bash
set -e

# install exact dependencies
npm ci

# copy env file if missing
if [ ! -f .env ]; then
  cp .env.example .env
fi

# run unit tests
npm test

# build production bundle
npm run build
