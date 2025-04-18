FROM golang:1.24.2-alpine AS go-builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git gcc musl-dev sqlite-dev

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code

COPY main.go .
COPY internal/ ./internal/



# Build the Go application
RUN go build -o improv-app

# Node/Bun builder stage for frontend
FROM oven/bun:1.2.4 AS js-builder

WORKDIR /app

# Copy frontend source
COPY frontend/package.json ./frontend/
COPY frontend/bun.lock ./frontend/
WORKDIR /app/frontend
RUN bun install
WORKDIR /app
COPY frontend/ ./frontend/

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN bun run build

# Final stage
FROM alpine:3.19

WORKDIR /app

RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
  echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories

# Install dependencies
RUN apk add --no-cache sqlite-dev ca-certificates doppler

# Copy binary from Go builder stage
COPY --from=go-builder /app/improv-app /app/improv-app

# Create public directory
RUN mkdir -p /app/public

# Copy built frontend assets from js-builder stage
COPY --from=js-builder /app/frontend/dist/ /app/public/

# Set environment variables
ENV DATABASE_PATH=/app/data/improv.db
ENV PORT=4080

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose the application port
EXPOSE 4080

ENV ENV=production

# Run the application
CMD ["/app/improv-app"]
