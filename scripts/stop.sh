#!/usr/bin/env bash
# Stop all JobRadar infra containers.
#   ./scripts/stop.sh           # stop containers, keep data volumes (safe)
#   ./scripts/stop.sh --reset   # stop containers AND wipe data volumes (destructive)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/infra/docker-compose.yml"

if [ -t 1 ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; BOLD=$'\033[1m'; NC=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; BOLD=""; NC=""
fi

RESET=false
for arg in "$@"; do
  case "$arg" in
    --reset|-r) RESET=true ;;
    --help|-h)
      echo "Usage: $(basename "$0") [--reset]"
      echo ""
      echo "  (default)   Stop containers, keep volumes. Restartable with all data intact."
      echo "  --reset     Stop containers AND delete volumes. All Postgres/Mongo/Redis/Rabbit data lost."
      exit 0
      ;;
    *)
      echo "${RED}Unknown argument: $arg${NC}" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "${RED}Docker is not installed or not on PATH.${NC}" >&2
  exit 1
fi

if [ "$RESET" = true ]; then
  echo "${YELLOW}${BOLD}⚠  --reset will DELETE all data in the JobRadar volumes:${NC}"
  echo "    jobradar_postgres_data, jobradar_mongo_data, jobradar_redis_data, jobradar_rabbitmq_data"
  echo ""
  read -r -p "Type 'yes' to confirm: " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "${BLUE}Aborted.${NC}"
    exit 0
  fi
  echo ""
  echo "${BLUE}${BOLD}▸ Stopping containers and removing volumes...${NC}"
  docker compose -f "$COMPOSE_FILE" down -v
  echo ""
  echo "${GREEN}${BOLD}✓ Containers stopped and volumes removed.${NC}"
  echo "  Next ${BOLD}./scripts/start.sh${NC} will reinitialize all data services from scratch."
else
  echo "${BLUE}${BOLD}▸ Stopping JobRadar infra (data preserved)...${NC}"
  docker compose -f "$COMPOSE_FILE" down
  echo ""
  echo "${GREEN}${BOLD}✓ Containers stopped. Volumes preserved.${NC}"
  echo "  Restart anytime with ${BOLD}./scripts/start.sh${NC} — your data is intact."
fi
