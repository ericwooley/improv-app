docker compose up -d
tag=$(git rev-parse --short HEAD)
docker build . -t improv-app:${tag}
docker run -p 4080:4080\
 -e ENV=production \
 -e DATABASE_PATH=/app/data/improv.db \
 -e SESSION_SECRET=test \
 -e SMTP_HOST=mailpit \
 -e SMTP_PORT=1025 \
 -e SMTP_USERNAME= \
 -e SMTP_PASSWORD= \
 -e SMTP_FROM=test@test.com \
 -e SMTP_FROM_NAME=Test \
 -e SMTP_AUTH_METHOD=none \
 -e PORT=4080 \
 improv-app:${tag}
