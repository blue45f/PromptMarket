# PromptMarket

A marketplace for AI prompts, `CLAUDE.md`, and `agent.md` files. Built with **Vite + React** (frontend) and **NestJS + Prisma + SQLite** (backend).

## Features

- Browse, search, and filter listings by type (prompt / CLAUDE.md / agent.md), category, tag, model
- Free downloads and paid purchases (mock wallet — no real payment gateway)
- Author dashboard: publish listings, see sales, earnings
- Buyer library: purchased items, copy-to-clipboard, download as `.md`
- Markdown live preview on listing detail
- Ratings + reviews
- JWT auth (register / login)
- Seeded sample data for instant browsing

## Stack

| Layer        | Tech                                   |
| ------------ | -------------------------------------- |
| Frontend     | Vite, React 18, TypeScript, TailwindCSS, React Router, Zustand, Axios |
| Backend      | NestJS 10, Prisma 5, SQLite, JWT, bcrypt, class-validator |
| Tooling      | npm workspaces, npm-run-all           |

## Quick start

```bash
# 1. Install deps (root installs both workspaces)
npm install

# 2. Set up DB + seed data
npm run db:push
npm run seed

# 3. Run both servers
npm run dev
# web: http://localhost:5173
# api: http://localhost:3000/api
```

Demo accounts (after seed):

| Email                | Password   | Role         |
| -------------------- | ---------- | ------------ |
| alice@example.com    | password   | Seller       |
| bob@example.com      | password   | Buyer        |

## Repo layout

```
apps/
  web/   # Vite + React frontend
  api/   # NestJS backend with Prisma
```
