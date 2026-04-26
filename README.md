# JobRadar

A personal multi-source job aggregator. Scrapes ATS boards (Greenhouse, Lever, Ashby, Workable),
dedupes across sources, scores fit against your resume via LLM, and pushes alerts on top matches.

This repo is also a learning vehicle for system-design topics: queues, workers, caching, dedup,
observability, scaling. Every architectural choice is meant to be defensible in an interview.

## Stack

- **Backend**: NestJS + TypeScript (NestJS 10, Node 20)
- **Frontend**: React + Vite SPA
- **Postgres** (Prisma) — normalized data: users, sources, postings, scores
- **Redis** (ioredis) — cache, dedup set, rate limiters
- **RabbitMQ** (amqplib) — task queue with topic routing
- **MongoDB** — raw scraped payloads, LLM responses, scrape-run logs
- **pnpm workspaces** monorepo

## Repo layout

```
apps/
  api/         # NestJS HTTP server (auth, CRUD, feed)
  worker/      # NestJS standalone — RabbitMQ consumers
  scheduler/   # NestJS standalone — cron emitters
  web/         # React + Vite SPA
packages/
  config/         # Env loading (Zod)
  db/             # Prisma schema + client
  shared-types/   # Zod schemas shared across FE/BE
infra/
  docker-compose.yml   # Postgres, Redis, RabbitMQ, MongoDB
```

## Phase status

This scaffold is **Phase 0**: every process boots, every infra service runs, health probes go green.
No real features yet. Subsequent phases (Phase 1 = auth + preferences, Phase 2 = first scraper,
Phase 3 = queue + workers, etc.) are described in the project plan.

## Prerequisites

- Node.js 20.10+ (`nvm use` if you have nvm)
- pnpm 9+ (`npm install -g pnpm`)
- Docker + Docker Compose

## Bring it up

```sh
# 1. install deps
pnpm install

# 2. copy env (then edit if needed)
cp .env.example .env

# 3. boot infra
pnpm infra:up

# 4. generate the Prisma client (uses the stub schema)
pnpm db:generate

# 5. (one time) create the initial migration for the stub model
pnpm db:migrate -- --name phase0_init

# 6. start every app in parallel
pnpm dev
```

## Verify

| What | URL |
|---|---|
| API liveness | http://localhost:3000/health/live |
| API readiness | http://localhost:3000/health/ready |
| Worker liveness | http://localhost:3001/health/live |
| Worker readiness | http://localhost:3001/health/ready |
| Scheduler liveness | http://localhost:3002/health/live |
| Scheduler readiness | http://localhost:3002/health/ready |
| Web SPA | http://localhost:5173 |
| RabbitMQ management UI | http://localhost:15672 (jobradar / jobradar) |

A successful Phase 0 looks like:
- All `/health/ready` endpoints return `{"status":"ok"}` with each downstream marked `"ok"`.
- The web SPA renders and shows green API liveness + readiness.

## Health-probe convention

We follow the standard k8s split:

- **`/health/live`** — is the process alive? Never depends on downstreams. Used for restart decisions.
- **`/health/ready`** — are all downstreams reachable? Returns `503` if anything is `down`. Used for traffic routing.

## Tear down

```sh
pnpm infra:down       # stop containers, keep volumes
pnpm infra:reset      # stop containers AND wipe volumes
```
