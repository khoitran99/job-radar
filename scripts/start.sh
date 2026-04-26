#!/usr/bin/env bash
# Start all JobRadar infra containers and wait until they report healthy.
# Usage: ./scripts/start.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/infra/docker-compose.yml"

# --- colors (no-op if not a TTY) ---
if [ -t 1 ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; BOLD=$'\033[1m'; NC=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; BOLD=""; NC=""
fi

# --- preflight ---
if ! command -v docker >/dev/null 2>&1; then
  echo "${RED}Docker is not installed or not on PATH.${NC}" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "${RED}Docker daemon is not running. Start Docker Desktop and try again.${NC}" >&2
  exit 1
fi

if [ ! -f "$ROOT/.env" ]; then
  echo "${YELLOW}.env not found — copying from .env.example${NC}"
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

# --- bring up ---
echo "${BLUE}${BOLD}▸ Starting JobRadar infra...${NC}"
docker compose -f "$COMPOSE_FILE" up -d

# --- wait for healthchecks ---
echo ""
echo "${BLUE}${BOLD}▸ Waiting for services to be healthy (timeout 60s)...${NC}"
SERVICES=(postgres redis rabbitmq mongo)
DEADLINE=$((SECONDS + 60))

for svc in "${SERVICES[@]}"; do
  printf "  %-12s " "$svc"
  while true; do
    status=$(docker inspect -f '{{.State.Health.Status}}' "jobradar-$svc" 2>/dev/null || echo "missing")
    if [ "$status" = "healthy" ]; then
      echo "${GREEN}healthy${NC}"
      break
    fi
    if [ $SECONDS -ge $DEADLINE ]; then
      echo "${RED}timeout (last status: $status)${NC}"
      echo ""
      echo "${RED}One or more services failed to become healthy.${NC}" >&2
      echo "Inspect logs with: ${BOLD}pnpm infra:logs${NC}" >&2
      exit 1
    fi
    sleep 1
  done
done

# --- summary ---
echo ""
echo "${GREEN}${BOLD}✓ All infra services are up.${NC}"
echo ""
echo "${BOLD}Service URLs:${NC}"
echo "  Postgres           localhost:5433  (jobradar / jobradar)"
echo "  Redis              localhost:6379"
echo "  RabbitMQ AMQP      localhost:5672"
echo "  RabbitMQ UI        http://localhost:15672  (jobradar / jobradar)"
echo "  MongoDB            localhost:27017 (jobradar / jobradar)"
echo ""
echo "${BOLD}Next:${NC} run ${BLUE}pnpm dev${NC} to start the apps."
