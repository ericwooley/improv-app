docker compose up -d
tag=$(git rev-parse --short HEAD)
docker build . -t improv-app:${tag}
docker run -p 4080:4080\
  --network=improv-hq_default \
  --volume $(pwd)/docker-data:/app/data \
  --rm \
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
  -e FRONTEND_URL=http://127.0.0.1:4080 \
  -e BASE_URL=http://127.0.0.1:4080 \
  improv-app:${tag}
