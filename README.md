# PromptMarket

A marketplace for AI **prompts**, **`CLAUDE.md`**, and **`agent.md`** files — browse, buy, sell and share.

> Built with a 2026-grade stack: **React 19** + **NestJS 11** + **Prisma 6**, glued together by a shared **Zod**-schema package so the API contract has a single source of truth.

---

## Features

- 🛍 **Marketplace grid** with cover emoji, type badge, price, ⭐ rating, download counter
- 🔎 **Search + faceted filters** — type (Prompt / CLAUDE.md / agent.md), category, model, free/paid
- 🧮 **Sorts**: newest / trending (downloads) / top (avg rating)
- 🔐 **Paywall preview** — first ~300 chars visible to all, full body unlocks on purchase
- 💸 **Mock wallet** — top-up balance, buy listings, author auto-credited
- 📝 **Listing detail** — markdown live render, **Copy** + **Download `.md`** buttons
- ⭐ **Reviews & ratings**, restricted to verified buyers
- 👤 **Author dashboard** — listings table with sales / earnings stats
- 📚 **Buyer library** — re-access purchased items
- 🪪 **JWT auth** (argon2 hashing)
- 📑 **Auto-generated OpenAPI** docs at `/api/docs` (Swagger UI)
- ⚡ **Rate-limited** auth endpoints (`@nestjs/throttler`)
- 🐳 **Docker compose** — Postgres + API + Web behind nginx, one command

---

## Stack

| Layer | Tech |
| --- | --- |
| **Frontend** | Vite 6 · React 19 · TypeScript · **Tailwind v4** (Oxide engine, CSS-only config) · **TanStack Query v5** · **React Hook Form + Zod resolver** · Zustand 5 · React Router 6 · lucide-react · react-hot-toast · Radix UI primitives |
| **Backend** | NestJS 11 · Prisma 6 (SQLite default, Postgres via Docker) · **nestjs-zod** · **argon2** · JWT · **@nestjs/swagger** · **@nestjs/throttler** · **helmet** · **nestjs-pino** structured logs |
| **Shared** | `@promptmarket/shared` — **Zod schemas** consumed by both apps; the only place DTO shapes are defined |
| **Tooling** | npm workspaces · **Turborepo** · Docker / docker-compose · multi-stage Dockerfiles |

---

## Quick start (local, SQLite)

```bash
# 1. Install deps  (postinstall builds @promptmarket/shared)
npm install

# 2. Set up the SQLite DB and seed sample data
npm run db:push
npm run seed

# 3. Run web + api in parallel via Turbo
npm run dev
#  web → http://localhost:5173
#  api → http://localhost:3000/api
#  docs → http://localhost:3000/api/docs
```

### Demo accounts (after seed)

| Email                | Password   | Role          |
| -------------------- | ---------- | ------------- |
| `alice@example.com`  | `password` | Seller        |
| `bob@example.com`    | `password` | Buyer         |
| `carol@example.com`  | `password` | Both          |

Each demo user starts with **$100** in their mock wallet.

---

## Run with Docker (Postgres)

```bash
docker compose up -d --build
#  web → http://localhost:5173   (nginx, proxies /api to api container)
#  api → http://localhost:3000
#  postgres → localhost:5432  (user/pw: promptmarket)
```

To seed against Postgres, after `docker compose up`:

```bash
DATABASE_URL=postgresql://promptmarket:promptmarket@localhost:5432/promptmarket \
  npm --workspace @promptmarket/api run db:push
DATABASE_URL=postgresql://promptmarket:promptmarket@localhost:5432/promptmarket \
  npm run seed
```

---

## Repo layout

```
apps/
  web/         # Vite + React 19 frontend
  api/         # NestJS 11 backend
    prisma/    # schema + seed
packages/
  shared/      # Zod schemas (single source of truth for the API contract)
docker-compose.yml
turbo.json
```

---

## Scripts (root)

| Command              | What |
| -------------------- | --- |
| `npm run dev`        | Turbo runs `dev` in api + web in parallel |
| `npm run build`      | Turbo builds shared → api → web (topological) |
| `npm run typecheck`  | `tsc --noEmit` across the monorepo |
| `npm run db:push`    | Apply Prisma schema to the configured DB |
| `npm run seed`       | Seed sample users / listings / reviews |
| `npm run shared:build` | Rebuild the shared zod schemas package |
| `npm run docker:up`  | Build + start all containers |
| `npm run docker:down` | Stop containers |

---

## Architecture highlights

- **Single-source API contract.** Every Zod schema (e.g. `CreateListingSchema`, `ListingCard`) lives once in `packages/shared`. The backend wraps each with `createZodDto(...)` for NestJS pipes + Swagger; the frontend hands it to RHF's `zodResolver`. Drift between client and server is impossible by construction.
- **Validation pipeline.** Requests hit `ZodValidationPipe` (`nestjs-zod`) — bad payloads return structured 4xx with a list of field paths, no manual `class-validator` decorators needed.
- **Auth.** Custom `JwtAuthGuard` reads `Authorization: Bearer …`, verifies with `@nestjs/jwt`, attaches `req.user`. Passwords hashed with **argon2id** (2026 recommended OWASP default).
- **Purchase flow.** `POST /listings/:id/purchase` runs as a single Prisma `$transaction` — buyer balance deducted, author credited, `Purchase` row created, `downloads` incremented; refuses if buyer is the author, already owns, or short on funds.
- **Throttling.** Default 60 req/min globally; auth endpoints capped at 10 req/min via `@Throttle({ auth: … })`.
- **Logging.** `nestjs-pino` with `pino-pretty` in dev; structured JSON in production.
- **Turborepo.** `build` is topologically ordered (`^build`) so the shared package always builds first; `dev` runs api + web in parallel.

---

## API surface (selected)

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/register` | rate-limited |
| `POST` | `/api/auth/login` | rate-limited |
| `GET`  | `/api/auth/me` | Bearer |
| `GET`  | `/api/listings` | filters: `type`, `category`, `q`, `model`, `free`, `sort=newest\|trending\|top`, `page`, `pageSize` |
| `GET`  | `/api/listings/:slug` | optional auth (returns `body` only if free / purchased / owner) |
| `POST` | `/api/listings` | Bearer |
| `POST` | `/api/listings/:id/purchase` | Bearer; atomic balance move |
| `POST` | `/api/listings/:id/reviews` | Bearer; buyer-only |
| `GET`  | `/api/me`, `/api/me/purchases`, `/api/me/listings` | Bearer |
| `POST` | `/api/me/topup` | Bearer |
| `GET`  | `/api/users/:username` | public profile |

Full schema is browsable in **Swagger UI** at `http://localhost:3000/api/docs`.

---

## License

MIT.
