#!/bin/bash
set -e

# Start docker compose
docker compose up -d

# Build the image
tag=$(git rev-parse --short HEAD)
docker build . -t improv-app:${tag}

# Run the container in the background and capture the container ID
container_id=$(docker run -d -p 4081:4080\
  --network=improv-hq_default \
  --volume $(pwd)/docker-data:/app/data \
  -e ENV=production \
  -e DATABASE_PATH=/app/data/improv.db \
  -e SESSION_SECRET=test \
  -e SMTP_HOST=mailpit \
  -e SMTP_PORT=1025 \
  -e SMTP_USERNAME= \
  -e SMTP_PASSWORD= \
  -e SMTP_FROM=test@improvhq.com \
  -e SMTP_FROM_NAME=Test \
  -e SMTP_AUTH_METHOD=none \
  -e PORT=4080 \
  -e FRONTEND_URL=http://localhost:4081 \
  -e BASE_URL=http://localhost:4081 \
  improv-app:${tag})

echo "Container started with ID: $container_id"

# Function to check if the service is up
wait_for_service() {
  local retries=30
  local wait_time=2
  local endpoint="http://localhost:4081"

  echo "Waiting for service to be available at $endpoint..."

  for i in $(seq 1 $retries); do
    if curl -s -f "$endpoint" > /dev/null 2>&1; then
      echo "Service is up and running!"
      return 0
    else
      echo "Attempt $i/$retries: Service not available yet, waiting..."
      sleep $wait_time
    fi
  done

  echo "Service did not become available in time"
  return 1
}

# Wait for the service to be up
wait_for_service

# Run the E2E tests
cd e2e
echo "Running E2E tests..."
pnpm run test:docker --retries 3 --workers 1
test_exit_code=$?
cd ..

# Clean up - stop and remove the container
echo "Stopping and removing container..."
docker stop $container_id
docker rm $container_id

# Exit with the same code as the tests
exit $test_exit_code
