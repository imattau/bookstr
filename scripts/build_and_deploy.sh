#!/bin/bash
set -e

# install dependencies
npm install

# run tests
npm test

# build static files
npm run build

# build docker image
docker build -t bookstr:latest .

echo "Docker image 'bookstr:latest' built successfully."

echo "Run 'docker run -p 3000:3000 bookstr:latest' to start the container."
