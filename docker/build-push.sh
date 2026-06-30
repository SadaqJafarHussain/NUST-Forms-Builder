#!/bin/bash
# ============================================================
# NUST Forms Builder — Build & Push Docker Image
# Run this on your Mac (developer machine), NOT on the VPS.
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
DOCKER_USERNAME="${DOCKER_USERNAME:-}"
IMAGE_NAME="nust-forms-builder"
TAG="${TAG:-latest}"

if [ -z "$DOCKER_USERNAME" ]; then
  echo "Enter your Docker Hub username:"
  read -r DOCKER_USERNAME
fi

FULL_IMAGE="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"

# ── Load production env ──────────────────────────────────────
if [ ! -f "$(dirname "$0")/.env.prod" ]; then
  echo "ERROR: docker/.env.prod not found."
  echo "Copy docker/.env.prod.example to docker/.env.prod and fill in your values."
  exit 1
fi

# shellcheck disable=SC1091
set -a; source "$(dirname "$0")/.env.prod"; set +a

# ── Validate required secrets ────────────────────────────────
: "${ENCRYPTION_KEY:?ENCRYPTION_KEY is not set in .env.prod}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is not set in .env.prod}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is not set in .env.prod}"

# Build-time DATABASE_URL uses the same postgres container name and password
BUILD_DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/formbricks?schema=public"
BUILD_REDIS_URL="redis://redis:6379"

echo "======================================================"
echo "  Building NUST Forms Builder"
echo "  Image: $FULL_IMAGE"
echo "======================================================"

# Navigate to repo root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# ── Write secrets to temp files (Docker BuildKit requirement) ─
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

printf '%s' "$BUILD_DATABASE_URL" > "$TMP_DIR/database_url"
printf '%s' "$ENCRYPTION_KEY"     > "$TMP_DIR/encryption_key"
printf '%s' "$BUILD_REDIS_URL"    > "$TMP_DIR/redis_url"

# ── Ensure a buildx builder exists (supports cross-platform builds) ──
if ! docker buildx inspect nust-builder >/dev/null 2>&1; then
  echo "Creating buildx builder for cross-platform support..."
  docker buildx create --name nust-builder --use
else
  docker buildx use nust-builder
fi
docker buildx inspect --bootstrap >/dev/null

# ── Build for linux/amd64 (Ubuntu VPS) and push directly ─────
docker buildx build \
  --platform linux/amd64 \
  --secret "id=database_url,src=$TMP_DIR/database_url" \
  --secret "id=encryption_key,src=$TMP_DIR/encryption_key" \
  --secret "id=redis_url,src=$TMP_DIR/redis_url" \
  -f apps/web/Dockerfile \
  -t "$FULL_IMAGE" \
  --push \
  .

echo ""
echo "======================================================"
echo "  Done! Image pushed: $FULL_IMAGE"
echo ""
echo "  Next step — on your Hostinger VPS, run:"
echo "    DOCKER_IMAGE=$FULL_IMAGE docker compose -f docker-compose.prod.yml up -d"
echo "======================================================"
