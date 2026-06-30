#!/bin/bash
set -a
source docker/.env
set +a

DOCKER_BUILDKIT=1 docker build \
  --secret id=database_url,env=DATABASE_URL \
  --secret id=encryption_key,env=ENCRYPTION_KEY \
  --secret id=redis_url,env=REDIS_URL \
  -f apps/web/Dockerfile \
  -t sadiq95/nust-forms-builder:latest \
  .
