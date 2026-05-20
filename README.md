# PromptMarket

A marketplace for **prompts**, **`CLAUDE.md`**, **`agent.md`**, **Claude Code skills**, **MCP servers**, **slash commands**, **sub-agents**, and **`.cursorrules`** — browse, buy, sell and share, with a per-LLM taxonomy and prompt-engineering-technique catalog.

> Built with a 2026-grade stack: **React 19** + **NestJS 11** + **Prisma 6**, glued together by a shared **Zod**-schema package so the API contract has a single source of truth.

---

## Features

- 🛍 **Marketplace grid** — type-gradient cover, model badges, price corner badge, ⭐ rating, download counter, lift-on-hover
- 🌗 **Dark mode** — light / dark / system, persisted in `localStorage`, OS preference watched live
- 🎯 **8 listing types** — Prompt · CLAUDE.md · agent.md · **Skill** · **MCP Server** · **Slash Command** · **Sub-agent** · **.cursorrules**
- 🤖 **Per-LLM taxonomy** — every listing tagged with one or more of 21 model slugs (Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5, GPT-5 / o3, Gemini 2.5, Llama 4, Grok 3, Mistral Large 3, DeepSeek V3, plus tools: Claude Code, Cursor, Windsurf, Copilot, Cline, Aider). Filter by model **or** vendor (Anthropic / OpenAI / Google / Meta / xAI / Mistral / DeepSeek)
- 🧠 **Prompt-engineering technique** filter — zero-shot · few-shot · **chain-of-thought** · **tree-of-thoughts** · role-prompt · self-consistency · **ReAct** · **RAG** · reflexion · plan-and-solve · meta-prompt
- 🏷 **Metadata** — difficulty (beginner / intermediate / advanced), license (MIT / Apache-2.0 / CC-BY-4.0 / CC0 / Proprietary), semver version
- 🔎 **Search + faceted filters** — type · category (14) · model · vendor · technique · difficulty · free/paid; sticky desktop sidebar + mobile drawer (Radix Dialog); dismissible filter chips
- 🧮 **Sorts** — newest · trending (downloads) · top (avg rating)
- 🔐 **Paywall preview** — first ~300 chars visible to all, full body unlocks on purchase
- 💸 **Mock wallet** — top-up balance, buy listings, author auto-credited via a Prisma `$transaction`
- 📝 **Listing detail** — 16:9 gradient hero, Radix tabs (Overview / Reviews / Related), sticky price + author + metadata sidebar, **Copy** + **Download `.md`** with morphing check-icon feedback
- 🪞 **Live preview** in Create form — Card + Markdown render update as you type
- 🔁 **Related listings** — `/listings/related/:id` recommends by type + category
- ⭐ **Reviews & ratings** — buyer-verified, 1–5 stars + comment
- 📊 **Homepage stats strip** — `totalListings` · `totalDownloads` · `totalCreators` from `/listings/stats` (in-memory 30 s cache)
- 👤 **Author dashboard** — listings with sales + earnings, library of purchased items, wallet
- 🪪 **JWT auth** (**argon2id** hashing — OWASP 2026 default)
- 📑 **Auto-generated OpenAPI** docs at `/api/docs` (Swagger UI, **nestjs-zod**-patched)
- ⚡ **Rate-limited** auth endpoints (`@nestjs/throttler` — 10/min on login + register, 120/min everywhere else)
- 🐳 **Docker compose** — Postgres + API + Web behind nginx, one command
- ⚡ **Skeletons + fade-in animations + `prefers-reduced-motion` aware**

---

## Stack

| Layer | Tech |
| --- | --- |
| **Frontend** | Vite 6 · React **19** · TypeScript · **Tailwind v4** (Oxide engine, CSS-only `@theme` config, class-based dark mode) · **TanStack Query v5** · **React Hook Form + Zod resolver** · Zustand 5 · React Router 6 · **lucide-react v1** · react-hot-toast · **Radix UI** (Dialog / Tabs / DropdownMenu) · clsx · **tailwind-merge v3** · Inter font |
| **Backend** | NestJS **11** · Prisma **6** (SQLite default, Postgres via Docker) · **nestjs-zod** · **argon2id** · JWT · **@nestjs/swagger** · **@nestjs/throttler** · **helmet** · **nestjs-pino** (pino-http 11 / pino-pretty 13) |
| **Shared** | `@promptmarket/shared` — **Zod** schemas + 21-model registry + technique / difficulty / license enums + view helpers; consumed identically by api + web, so DTO drift is impossible |
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
| `GET`  | `/api/listings` | filters: `type`, `category`, `q`, **`model`**, **`vendor`**, **`technique`**, **`difficulty`**, `free`, `sort=newest\|trending\|top`, `page`, `pageSize≤48` |
| `GET`  | `/api/listings/:slug` | optional auth (returns `body` only if free / purchased / owner) |
| `GET`  | `/api/listings/stats` | `{ totalListings, totalDownloads, totalCreators }` — 30 s in-memory cache |
| `GET`  | `/api/listings/related/:id?limit=4` | listings sharing type or category, self excluded |
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
