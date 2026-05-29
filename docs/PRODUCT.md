# PRODUCT.md

## What it is

PromptMarket is a marketplace to browse, buy, sell, and share **prompts,
`CLAUDE.md` / `agent.md` files, Claude Code skills, MCP servers, slash commands,
sub-agents, and `.cursorrules`** — with an LLM-by-model taxonomy and a
prompt-engineering technique catalog.

## Register

`product` — the app UI (browse, listing detail, dashboard, forms) serves the
task. The home, auth panels, and footer lean `brand` (editorial, the design is
the pitch). When in doubt on a given screen, the surface in focus wins.

## Users

Builders shipping real production with frontier models (Claude, GPT-5, Gemini,
and the Claude Code / Cursor / Windsurf tool ecosystem). They are fluent in the
category's best tools and trust interfaces that are fast, dense where it counts,
and free of gratuitous flourish. They want to evaluate an artifact quickly
(type, models, technique, difficulty, license, price, reviews) and pull it into
a codebase.

Primary operating language is **Korean**; English is a first-class secondary
locale (a language switcher lives in the nav).

## Tone

Electric, deliberate, alive. Confident and concrete, never breathless. UX copy
is plain and earns every word; no restated headings, no em dashes. Korean copy
uses `word-break: keep-all` so it reads cleanly; English copy stays concise so
it fits the same layouts.

## Anti-references

Not generic SaaS-cream. Not navy-and-gold fintech. Not neon-on-black crypto.
Not a Linear/Stripe clone. The look is editorial-typographic with an electric
chartreuse signature — see DESIGN.md.

## Strategic principles

- The artifact is the hero: covers, type/model/technique badges, and the paywall
  preview do the selling.
- Trust through specificity: real metadata, verified-buyer reviews, honest
  empty/error states, no fake data.
- Consistency is an affordance on product surfaces; delight is saved for moments
  (the home hero, the footer wordmark, micro-interactions) — not every page.
- Production-ready by default: every surface handles loading, empty, error, long
  text, CJK + emoji, and both locales.
