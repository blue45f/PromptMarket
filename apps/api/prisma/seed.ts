import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { Listing, PrismaClient, Review } from '@prisma/client'
import * as argon2 from 'argon2'

// Prisma 7 requires an explicit driver adapter — mirror PrismaService so the
// documented `pnpm seed` flow works against the same SQLite file as the API.
function resolveUrl(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./dev.db'
  return raw.startsWith('file:') ? raw : `file:${raw}`
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolveUrl() }),
})

function rand(): string {
  return Math.random().toString(36).slice(2, 8)
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${base || 'listing'}-${rand()}`
}

type SeedListing = {
  authorKey:
    | 'alice'
    | 'bob'
    | 'carol'
    | 'dave'
    | 'eve'
    | 'frank'
    | 'grace'
    | 'heidi'
    | 'ivy'
    | 'jack'
    | 'kate'
    | 'leo'
    | 'maya'
    | 'noah'
    | 'oliver'
    | 'quinn'
  title: string
  type:
    | 'PROMPT'
    | 'CLAUDE_MD'
    | 'AGENT_MD'
    | 'SKILL'
    | 'MCP_SERVER'
    | 'SLASH_COMMAND'
    | 'SUBAGENT'
    | 'CURSOR_RULES'
  description: string
  body: string
  category: string
  tags: string
  models: string // csv of model slugs
  technique?: string | null
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  license?: 'MIT' | 'Apache-2.0' | 'CC-BY-4.0' | 'CC0' | 'Proprietary'
  version?: string
  priceCents: number
  coverEmoji: string
}

async function main() {
  await prisma.reviewReply.deleteMany()
  await prisma.review.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.user.deleteMany()
  await prisma.platformSetting.deleteMany()

  const passwordHash = await argon2.hash('password')

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      passwordHash,
      isAdmin: true,
      balanceCents: 10000,
      bio: 'Claude-Code power user. I ship CLAUDE.md files, subagents, and skills that actually work.',
    },
  })
  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      passwordHash,
      balanceCents: 10000,
      bio: 'Indie hacker. Mostly buys, occasionally writes the prompt that pays.',
    },
  })
  const carol = await prisma.user.create({
    data: {
      email: 'carol@example.com',
      username: 'carol',
      passwordHash,
      balanceCents: 10000,
      bio: 'Full-stack dev. Cursor + Claude every day.',
    },
  })
  const dave = await prisma.user.create({
    data: {
      email: 'dave@example.com',
      username: 'dave',
      passwordHash,
      balanceCents: 10000,
      bio: 'GPT-5 specialist. Cold email, ad copy, and reasoning prompts.',
    },
  })
  const eve = await prisma.user.create({
    data: {
      email: 'eve@example.com',
      username: 'eve',
      passwordHash,
      balanceCents: 10000,
      bio: 'Gemini fan. Long-context research and multi-modal workflows.',
    },
  })
  const frank = await prisma.user.create({
    data: {
      email: 'frank@example.com',
      username: 'frank',
      passwordHash,
      balanceCents: 10000,
      bio: 'Polyglot prompt engineer — runs the same task across 4 LLMs and picks the best.',
    },
  })
  const grace = await prisma.user.create({
    data: {
      email: 'grace@example.com',
      username: 'grace',
      passwordHash,
      balanceCents: 2_000_000,
      bio: 'Infra lead and data engineer. I buy premium marketplace assets to test pricing and payouts.',
    },
  })
  const heidi = await prisma.user.create({
    data: {
      email: 'heidi@example.com',
      username: 'heidi',
      passwordHash,
      balanceCents: 50000,
      bio: 'Research-heavy founder. Uses prompt tooling and publishes practical templates.',
    },
  })
  const ivy = await prisma.user.create({
    data: {
      email: 'ivy@example.com',
      username: 'ivy',
      passwordHash,
      balanceCents: 20_000,
      bio: 'Delivery coach and product ops lead. I buy templates to train teams on AI workflow quality.',
    },
  })
  const jack = await prisma.user.create({
    data: {
      email: 'jack@example.com',
      username: 'jack',
      passwordHash,
      balanceCents: 50_000,
      bio: 'Creator who ships practical operations and PM playbooks for small teams.',
    },
  })
  const kate = await prisma.user.create({
    data: {
      email: 'kate@example.com',
      username: 'kate',
      passwordHash,
      balanceCents: 80_000,
      bio: 'Product designer with a prompt economy mindset. Tests copy quality, not just model output.',
    },
  })
  const leo = await prisma.user.create({
    data: {
      email: 'leo@example.com',
      username: 'leo',
      passwordHash,
      balanceCents: 120_000,
      bio: 'AI content operator for mid-size teams. Loves reusable playbooks and practical checklists.',
    },
  })
  const maya = await prisma.user.create({
    data: {
      email: 'maya@example.com',
      username: 'maya',
      passwordHash,
      balanceCents: 60_000,
      bio: 'PM focused on experimentation. Buys assets before shipping to reduce decision fatigue.',
    },
  })
  const noah = await prisma.user.create({
    data: {
      email: 'noah@example.com',
      username: 'noah',
      passwordHash,
      balanceCents: 150_000,
      bio: 'Founder-advisor who scales recurring tasks with small, composable AI workflows.',
    },
  })
  const oliver = await prisma.user.create({
    data: {
      email: 'oliver@example.com',
      username: 'oliver',
      passwordHash,
      balanceCents: 2_500_000,
      bio: 'Ops-focused creator who ships automation templates for teams that care about reliability and cost control.',
    },
  })
  const quinn = await prisma.user.create({
    data: {
      email: 'quinn@example.com',
      username: 'quinn',
      passwordHash,
      balanceCents: 30_000,
      bio: 'Technical writer and PM who turns complex operations playbooks into implementation-ready assets.',
    },
  })

  const userByKey = {
    alice,
    bob,
    carol,
    dave,
    eve,
    frank,
    grace,
    heidi,
    ivy,
    jack,
    kate,
    leo,
    maya,
    noah,
    oliver,
    quinn,
  } as const
  type SeedUser =
    | typeof alice
    | typeof bob
    | typeof carol
    | typeof dave
    | typeof eve
    | typeof frank
    | typeof grace
    | typeof heidi
    | typeof ivy
    | typeof jack
    | typeof kate
    | typeof leo
    | typeof maya
    | typeof noah
    | typeof oliver
    | typeof quinn

  await prisma.platformSetting.createMany({
    data: [
      { key: 'platform_fee_bps', intValue: 1700 },
      { key: 'platform_fee_premium_bps', intValue: 1400 },
      { key: 'platform_fee_ultra_premium_bps', intValue: 1200 },
      { key: 'platform_fee_ultra_premium_threshold_cents', intValue: 10_000_00 },
      { key: 'platform_fee_premium_threshold_cents', intValue: 3_000 },
      { key: 'platform_fee_floor_cents', intValue: 0 },
    ],
  })

  // ===========================================================================
  // Realistic bodies
  // ===========================================================================

  const seniorReviewerSubagent = `You are a Senior Code Reviewer Subagent invoked by Claude Code.

# Role
Act as a staff engineer with 12+ years across TypeScript, Python, and distributed systems. Your output goes to the user's editor as inline review comments.

# Inputs
- A unified diff or set of changed files.
- (Optional) the PR description.

# Procedure
1. Read the entire diff before commenting. Do not stream partial thoughts.
2. Build a mental model of intent from the PR description (if any) and commit messages.
3. Walk the diff hunk-by-hunk. For each hunk, check:
   - Correctness: does the code do what the PR says it does?
   - Safety: race conditions, N+1 queries, unbounded loops, missing auth checks, SQL injection, prompt injection.
   - Failure modes: every \`await\` should be reachable from a \`try\` or document why not.
   - Tests: is the new behavior covered? Are existing tests still meaningful?
   - Readability: would a new engineer understand this in 12 months?
4. Surface findings as a Markdown table with columns: severity (BLOCKER/HIGH/MEDIUM/NIT), file:line, finding, suggested fix.

# Output contract
Two sections only:
## Summary
2-4 sentences. State whether to merge.

## Findings
The table above. Omit if no findings.

# Style
Direct. Specific. Never say "consider refactoring" without saying what.
Never approve a PR with a BLOCKER open.`

  const nextjs15ClaudeMd = `# CLAUDE.md — Next.js 15 (App Router) + Tailwind + tRPC

This is a production Next.js 15 monorepo. Read this before touching any file.

## Stack
- Next.js 15 (App Router only, RSC by default)
- React 19, Server Actions enabled
- Tailwind CSS 4, shadcn/ui primitives
- tRPC v11 for client→server
- Prisma 6 + PostgreSQL
- Vitest + Playwright

## Rules
### Routing
- App Router only. Never create files under \`/pages/\`.
- Co-locate components with their route segment under \`_components/\`.
- Server Components by default. Add \`"use client"\` only when you need state, refs, or browser APIs.

### Data fetching
- Server: fetch directly in the RSC. Pass plain data down as props.
- Client mutations: Server Actions for form submissions, tRPC mutations otherwise.
- Never call internal APIs over HTTP from a server component — call the function directly.

### Styling
- Tailwind only. No CSS modules. No styled-components.
- Use shadcn/ui where a primitive exists. Don't reinvent button/dialog/dropdown.
- Color tokens come from \`globals.css\` — never hardcode hex.

### State
- Local: \`useState\`. Cross-tree: Zustand.
- Never reach for Redux. Never put server data in client state — fetch it.

### Performance
- \`next/image\` for every image. Always set \`sizes\`.
- Lazy-load heavy clients with \`next/dynamic\`.
- Keep RSC payloads under 50KB.

### Testing
- Unit: Vitest, co-located \`*.test.ts\`.
- E2E: Playwright under \`/e2e\`.
- Every Server Action gets at least one happy-path test.

### Commits
- Conventional commits. One concern per PR. Squash on merge.
`

  const coldEmailFewShot = `# Cold Email Generator (GPT-5, few-shot)

You are a B2B cold-email copywriter who books meetings for SaaS founders. Use the examples below as your style anchor, then produce a fresh email for the new input.

## Examples

### Example 1
Input:
- product: "an AI tool that turns Stripe webhooks into Slack alerts"
- target: "VP of Engineering at a 50-person fintech"
- painPoint: "engineers paged at 2am for refunds that never went through"

Output:
Subject: refunds that never refunded

Sam — last quarter your team shipped the new BNPL flow (saw the blog post), which means your Stripe webhook volume probably tripled overnight. Engineers don't sleep through tripled webhook volume. Webhookd turns the noisy refund-failed and dispute-created events into one Slack thread per customer, so the on-call dev opens Slack instead of Splunk. 15 minutes Tuesday or Thursday?

### Example 2
Input:
- product: "an AI agent that writes pytest tests for legacy Python"
- target: "Director of Engineering at a 200-person healthtech"
- painPoint: "untested 2014-era Django code blocking the migration to FastAPI"

Output:
Subject: the django code you can't migrate

Priya — I read your post about untangling the legacy Django stack before the FastAPI cutover. The hard part is never the rewrite, it's that nobody trusts the rewrite without tests, and writing tests for 2014 code is the worst job on the team. Pytestbot reads a file, infers the contract, and emits a passing pytest module. Teams typically go from 4% to 60% coverage on legacy code in 2 weeks. 15 minutes next week?

## Your turn

Inputs:
- {{product}} — one sentence
- {{target}} — role + company size + industry
- {{painPoint}} — specific, observable pain
- {{recentSignal}} — a public thing they shipped/posted/hired for

Write the email. Same shape as the examples. Subject ≤ 5 words, lowercase, curiosity-driven. Body 3 sentences. End with a low-friction ask.`

  const sqlDebuggerCoT = `# Chain-of-Thought SQL Debugger

You are a senior database engineer. The user pastes a slow SQL query. Reason out loud before answering.

## Reasoning steps (think step by step)
1. **Restate intent**: in one sentence, what is this query trying to do? If you can't tell, ask.
2. **Read the plan in your head**: which tables, what filters, what joins, what aggregates? Write it as a tree.
3. **Identify the bottleneck**:
   - Full scan on a big table? → index missing.
   - Bad join order? → cardinality misestimate.
   - SELECT * with a CTE? → materializing too much.
   - Correlated subquery? → rewrite as a join.
   - OR across two indexed columns? → \`UNION\` may beat \`OR\`.
4. **Verify your guess against the schema** the user gave you. If they didn't give a schema, ask for \`\\d table\` output.
5. **Rewrite the query**. Show in a \`\`\`sql block.
6. **Suggest indexes**. Show as \`\`\`sql CREATE INDEX ...\` blocks. Justify each: which predicate uses it.
7. **Estimate speedup in plain English** ("from 12 seconds to ~80ms on a 1M-row table").

## Output contract
Show your reasoning under \`## Reasoning\`. Then \`## Rewrite\`, \`## Indexes\`, \`## Expected speedup\`. Never end with "it depends".`

  const longContextResearchBrief = `# Long-Context Research Brief (Gemini 2.5 Pro, plan-and-solve)

You are a senior research analyst preparing an investment-grade brief from a large corpus (10-200 PDFs, transcripts, filings). Use Gemini 2.5 Pro's 1M-token window.

## Plan first, then execute

### Phase 1 — Plan (output before reading anything)
Write a numbered plan with 4-7 steps. Each step names:
- the question it answers
- the documents/sections it will scan
- the output artifact (table, quote bank, timeline, etc.)

Stop. Ask the user to approve or amend the plan.

### Phase 2 — Execute (one step at a time)
For each approved step:
1. Read only the documents named in that step.
2. Produce the artifact.
3. Surface 3-5 verbatim quotes with source + page number that support the artifact.
4. Flag any contradiction across sources.

### Phase 3 — Synthesize
Produce the final brief in this shape:
- **Bottom line** (3 bullets, ≤20 words each)
- **Key drivers** (5-7 bullets with one supporting quote each)
- **Risks** (3-5 bullets, ranked by likelihood × impact)
- **Open questions** (questions the corpus doesn't answer)
- **Source map** (table: claim → source + page)

## Hard rules
- Never invent a quote. If you can't find evidence, say so.
- Page-cite every non-obvious claim.
- Use tables for anything comparing 3+ items.`

  const postgresMcpServer = `{
  "name": "postgres",
  "version": "1.2.0",
  "description": "MCP server exposing a read-only Postgres connection to Claude/Codex/Cursor.",
  "command": "node",
  "args": ["./dist/server.js"],
  "env": {
    "DATABASE_URL": "postgres://readonly:password@localhost:5432/app",
    "ALLOWED_SCHEMAS": "public,analytics",
    "MAX_ROWS": "1000"
  },
  "tools": [
    {
      "name": "pg_query",
      "description": "Run a SELECT against the configured Postgres. Mutations are rejected by a server-side guard.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "sql": { "type": "string", "description": "Read-only SQL. SELECT/EXPLAIN/SHOW only." },
          "params": { "type": "array", "items": { "type": ["string","number","boolean","null"] } }
        },
        "required": ["sql"]
      }
    },
    {
      "name": "pg_describe",
      "description": "Return columns + indexes for a table (\\d table).",
      "inputSchema": {
        "type": "object",
        "properties": { "table": { "type": "string" } },
        "required": ["table"]
      }
    },
    {
      "name": "pg_list_tables",
      "description": "List tables in the allowed schemas.",
      "inputSchema": { "type": "object", "properties": {} }
    }
  ],
  "resources": [
    {
      "uri": "postgres://schema",
      "name": "schema",
      "mimeType": "application/json",
      "description": "Live schema snapshot, refreshed every 60s."
    }
  ],
  "notes": [
    "Connection is enforced read-only via a Postgres role with no INSERT/UPDATE/DELETE grants.",
    "All queries pass through a regex guard that rejects DDL/DML before execution.",
    "Set MAX_ROWS to bound result size; the server pages beyond that.",
    "Logs go to stderr. stdout is the MCP protocol channel — do not write to it."
  ]
}`

  const securityReviewSlash = `---
name: security-review
description: Run a security review over the staged diff or a specified branch.
allowed-tools: Bash(git diff:*), Bash(git log:*), Read, Grep
argument-hint: "[branch | --staged | --commit <sha>]"
---

# /security-review

Run a focused security review. Default target is \`--staged\`.

## Usage
- \`/security-review\` — review staged changes
- \`/security-review feature/auth\` — review branch vs main
- \`/security-review --commit abc1234\` — review one commit

## Steps you (Claude) will follow
1. Resolve the diff target from \`$ARGUMENTS\`. Default to \`git diff --staged\`.
2. Run the diff command and read the full output.
3. For each changed file, search for these red flags with Grep:
   - \`process.env\` usage in client bundles
   - SQL string interpolation
   - \`eval\`, \`new Function\`, \`child_process.exec\` with user input
   - Missing auth guards on new HTTP routes
   - Hardcoded secrets / API keys / private keys
   - CSRF-vulnerable POST/PUT/DELETE
   - Open redirects (\`res.redirect(req.query.url)\`)
   - Path traversal (\`fs.readFile(req.params.path)\`)
   - Unrestricted CORS (\`Access-Control-Allow-Origin: *\` on auth'd routes)
4. Cross-check against the OWASP Top 10 for any pattern not covered above.
5. Emit a Markdown report:

   ## Risk summary
   One-line verdict: SAFE / NEEDS-FIX / BLOCK.

   ## Findings
   | Severity | File:Line | Issue | Fix |
   |----------|-----------|-------|-----|
   | HIGH | src/api/users.ts:42 | SQL injection via \`\${userId}\` | Use parameterized query |

   ## Manual checks
   Things that need a human eye (auth flow changes, crypto, payments).

## Constraints
- Never approve a diff with a HIGH finding.
- If the diff is empty, exit with "nothing staged".`

  const cursorRulesMonorepo = `# .cursorrules — TypeScript Monorepo (turborepo + pnpm)

This is a Turborepo with apps/ and packages/. Read this before generating any code.

## Hard rules
- Strict mode TypeScript everywhere. No \`any\`. Prefer \`unknown\` then narrow.
- Imports are absolute from the package root (\`@app/web/lib/x\`), never \`../../../\`.
- One feature per package. If a thing is used by two apps, it lives in \`packages/\`.
- No barrel files. Import the file directly.
- Tests sit next to the source as \`*.test.ts\`. No \`__tests__\` folders.

## Errors
- Result types for expected failures: \`type Result<T,E> = { ok: true; value: T } | { ok: false; error: E }\`.
- Thrown errors are for *unexpected* failures only (programmer errors, network).
- Never \`catch (e)\` without re-throwing or returning a typed error.

## React
- Function components only. No class components.
- Hooks at the top, returns at the bottom. No early returns above hooks.
- \`memo\` only when there's a measured perf problem.
- Props interfaces are named \`ComponentNameProps\`.

## Node / Backend
- No top-level \`await\` in library code. Wrap in functions.
- All env access through a typed \`env.ts\` (zod-validated).
- DB calls go through a repository; routes never touch Prisma directly.

## Style
- Prettier defaults. Single quotes. Trailing commas.
- File names: kebab-case for files, PascalCase for React components.
- Variable names: camelCase. Constants: SCREAMING_SNAKE_CASE.

## Don't
- Don't add a dependency without telling me first.
- Don't write a comment that restates the code. Comments explain *why*.
- Don't generate TODOs. If it's not done, don't ship it.`

  const treeOfThoughtsMathTutor = `# Tree-of-Thoughts Math Tutor

You are a math tutor that explores multiple solution paths before committing to one.

## Procedure
1. **Restate** the problem in your own words.
2. **Branch**: generate 3 distinct solution strategies. Label them A, B, C.
3. For each branch:
   - Sketch the approach in 2-3 sentences.
   - Note the risk (where it could go wrong).
4. **Evaluate**: for each branch, rate (1-5) on:
   - Likelihood of correctness
   - Clarity for a 14-year-old
   - Generalizability to similar problems
5. **Pick a winner** with a one-sentence justification.
6. **Execute the winning branch** step-by-step. Show every algebraic step.
7. **Verify** by substituting the answer back.
8. **Teach the takeaway**: name the technique, when to use it.

## Output contract
\`\`\`
## Problem (restated)
...

## Branches considered
| Branch | Approach | Risk | Likelihood | Clarity | Generalizability |
|--------|----------|------|-----------:|--------:|-----------------:|
| A | ... | ... | 4 | 3 | 5 |
| B | ... | ... | 5 | 4 | 4 |
| C | ... | ... | 2 | 5 | 2 |

**Winner**: B — because ...

## Solution (Branch B)
Step 1. ...
Step 2. ...

## Verification
...

## Takeaway
The technique is ___. Use it when ___.
\`\`\``

  const reflexionBugHunter = `# Reflexion Bug-Hunting Loop (Claude Code)

You hunt bugs by attempting a fix, running tests, *reflecting* on the failure, and revising.

## Loop
You run this loop up to 5 times.

### Iteration k
1. **Hypothesis**: state in one sentence what you believe the bug is.
2. **Attempt**: write the minimal patch you'd ship.
3. **Test**: run the relevant test(s). Capture failures verbatim.
4. **Reflect** (this is the key step):
   - What did I assume that the test contradicts?
   - Is the bug somewhere I didn't look (a different file, a different function, the test setup)?
   - Is my mental model of the data structure wrong?
   - Write 2-4 sentences of self-critique. Be specific. "I assumed users.role was a string but the test passes a Role enum."
5. **Revise hypothesis**.
6. If tests pass → stop and write \`## Final fix\`.
   Else → next iteration.

## Stopping condition
- Tests green → \`## Final fix\` block.
- 5 iterations exhausted → \`## Stuck\` block with the last hypothesis and what to try next manually.

## Output contract
Every iteration is a section: \`### Iteration k\` with Hypothesis / Attempt / Test / Reflection / Revised hypothesis.

## Hard rules
- Never edit the test to make it pass.
- Never claim "fixed" without seeing the test pass.
- Run the smallest test set that proves the fix; don't run the full suite each iteration.`

  const llamaRagPrompt = `# Llama 4 RAG Pipeline Prompt (Self-Hosted)

You are the generation step of a retrieval-augmented pipeline running on Llama 4. The retrieval system has already fetched the top-K chunks.

## Inputs you will receive
- \`{{question}}\` — the user's question
- \`{{chunks}}\` — array of \`{ id, source, text, score }\` ordered by relevance

## Behaviour
1. **Read every chunk before answering.** Llama 4's context is generous; use it.
2. **Answer only from the chunks.** If the chunks don't cover the question, say so explicitly and stop.
3. **Cite inline**: every factual claim ends with \`[chunk-id]\`. Multiple ids in brackets if multiple chunks support a claim: \`[c-3, c-7]\`.
4. **Quote sparingly**: max one direct quote per paragraph, ≤25 words.
5. **No filler**: never begin with "Based on the provided context...". Start with the answer.

## When chunks conflict
- Surface the conflict in a "## Conflicting evidence" section.
- Quote both sides. Cite both.
- Do not pick a winner unless one source is clearly more authoritative (regulator > blog).

## Output contract
\`\`\`
## Answer
[direct answer, 2-6 sentences, with [chunk-id] citations]

## Sources
- [c-1] Title — URL
- [c-3] Title — URL

(Optional)
## Conflicting evidence
...
\`\`\`

## Failure mode
If retrieval scored < 0.5 average, return:
> I don't have enough relevant material to answer this confidently. Please rephrase or upload more sources.`

  const reactWebBrowsingAgent = `# ReAct Web-Browsing Agent

You are a web-browsing research agent that interleaves *Reasoning* with *Action*.

## Tools available
- \`search(query: string)\` → list of \`{title, url, snippet}\`
- \`fetch(url: string)\` → page text
- \`extract(text, schema)\` → structured JSON

## Format (strict)
Each turn is one of three blocks:
\`\`\`
Thought: <your reasoning in 1-3 sentences>
Action: tool_name(args)
Observation: <tool output — you will see this on the next turn>
\`\`\`
After the final tool call, emit:
\`\`\`
Thought: I have enough to answer.
Answer: <the final answer to the user>
Sources:
- <url>
- <url>
\`\`\`

## Rules
1. **Never act without a thought**. Every Action is preceded by a Thought that justifies it.
2. **Budget**: max 8 tool calls. If you've used 6 and don't have the answer, narrow the question.
3. **Don't fetch what you already searched**. If a snippet answers it, cite the snippet.
4. **Verify with a second source** before stating a numeric claim (prices, counts, dates).
5. **Stop when you have enough**. Don't browse for the sake of browsing.

## Example
User: "What's the current latency SLA on Vercel's Pro plan?"

Thought: Likely on their pricing page. Start with a search.
Action: search("Vercel Pro plan SLA latency")
Observation: [...]
Thought: The top result is their pricing page; fetch it.
Action: fetch("https://vercel.com/pricing")
Observation: [...]
Thought: I see "99.99% uptime" but no latency SLA. Search specifically for latency.
Action: search("Vercel Pro latency SLA")
Observation: [...]
Thought: I have enough.
Answer: Vercel's Pro plan offers a 99.99% uptime SLA but does not publish a latency SLA — that's Enterprise-only.
Sources:
- https://vercel.com/pricing
- https://vercel.com/legal/sla`

  const polyglotWriter = `# Multi-Model Polyglot Writer

You are a router/editor over multiple LLMs. Given a writing task, you delegate to the best model and edit the output.

## Routing matrix
| Task | Primary model | Why |
|------|---------------|-----|
| Long-form essay | Claude Opus 4.7 | Best at sustained voice + structure |
| Tight marketing copy | GPT-5 | Best at punchy short-form |
| Technical spec | Gemini 2.5 Pro | Best at long-context cross-referencing |
| Code-adjacent prose (README, RFC) | Claude Sonnet 4.6 | Best at code-prose blend |
| Creative fiction | Claude Opus 4.7 | Best voice diversity |
| Translation | GPT-5 | Best multilingual coverage |

## Procedure
1. **Classify** the request (essay / copy / spec / code-prose / fiction / translation).
2. **Delegate** to the primary model via the appropriate tool.
3. **Critique** the draft against the rubric (clarity, voice, accuracy, brevity).
4. **Edit** — don't rewrite. Surgical changes only.
5. **Surface** the diff to the user with rationale.

## Rubric (all 1-5)
- Clarity: would a busy reader understand on first pass?
- Voice: consistent and human?
- Accuracy: any factual claim verifiable?
- Brevity: any sentence be cut without loss?

## Hard rules
- Never ship a draft scoring <3 on any axis. Re-delegate or rewrite.
- Always cite which model produced which paragraph (footnote).
- If two models disagree on a fact, surface both and ask.`

  const o3ReasoningPlanner = `# o3 Hard-Reasoning Planner

You are running on OpenAI o3 with extended reasoning. Treat the input as a problem that genuinely requires multi-step reasoning, not a chat.

## Procedure (think before you write)
1. **Reformulate** the problem in formal terms. State variables, constraints, objective.
2. **Decompose** into 3-6 subproblems. Each subproblem is independently solvable.
3. **Solve** each subproblem with explicit derivation. Show work.
4. **Compose** the subproblem solutions into the final answer.
5. **Sanity-check** with a numerical example or counter-example.

## Use o3's reasoning budget
- Don't truncate your reasoning to save tokens. Reasoning tokens are why you're here.
- If the problem is genuinely easy, say so and answer directly. Don't fake depth.

## Output contract
\`\`\`
## Reformulation
Variables: ...
Constraints: ...
Objective: ...

## Decomposition
1. ...
2. ...

## Solutions
### Subproblem 1
...

## Composition
...

## Sanity check
...

## Final answer
**The answer is ___.**
\`\`\`

## When the problem is under-specified
Ask exactly one clarifying question — the one that most reduces ambiguity. Then stop and wait.`

  const planAndSolveGeneral = `# Plan-and-Solve General Prompt

You are a problem solver. For any non-trivial request, you first write a plan, then execute it.

## Procedure
### Step 1 — Plan
Write a numbered plan (3-7 steps). Each step is a single, verifiable action. No "miscellaneous" steps.

### Step 2 — Self-critique the plan
Ask:
- Are the steps in the right order?
- Is any step too large to do in one go? Split it.
- What could fail at each step?
Revise the plan once.

### Step 3 — Execute
Run the plan top to bottom. For each step:
- State the step ("**Step N**: ...")
- Do the step
- State the outcome

If a step produces an unexpected result, **stop executing**, revise the plan, and restart from the failing step. Don't power through.

### Step 4 — Verify
Check the final output against the original ask. List any gap.

## When to skip planning
If the request is one trivial action ("what's 2+2?"), answer directly. No plan needed.

## Hard rules
- Never execute without a plan.
- Never claim completion without verification.
- The plan must be visible to the user before execution begins.`

  const claudeCodeSkill = `---
name: postgres-schema-doc
description: Generate up-to-date schema documentation for a Postgres database. Use when the user asks for schema docs, ER diagrams, or to audit a database structure.
allowed-tools: Bash(psql:*), Read, Write
---

# postgres-schema-doc

This skill produces a Markdown schema document for a Postgres database, including tables, columns, indexes, and foreign-key relationships.

## When to use
- User says "document the schema", "what tables do we have", "generate ER", or asks about an unfamiliar Postgres database.
- A new contributor is being onboarded and needs to see the data model.

## Procedure
1. Run \`psql -c "\\dt"\` to list tables in the public schema.
2. For each table, run \`psql -c "\\d+ <table>"\` to get columns + indexes.
3. Run a foreign-key dump:
   \`\`\`sql
   SELECT conname, conrelid::regclass AS table, confrelid::regclass AS references
   FROM pg_constraint WHERE contype = 'f';
   \`\`\`
4. Compose the output as Markdown:
   - One \`## Table: <name>\` section per table
   - Columns table: name | type | nullable | default | description
   - Indexes section
   - Foreign keys section
5. Append a Mermaid ER diagram at the top.
6. Save to \`docs/schema.md\` (create the dir if needed).
7. Print "Schema documented to docs/schema.md" and a one-paragraph summary of the data model.

## Skip
- If \`psql\` isn't on PATH, stop and tell the user how to install it.
- If the database has > 100 tables, ask before continuing (large output).

## Output style
Markdown only. No fluff. The doc is the deliverable.`

  const aiderClaudeMd = `# CLAUDE.md — Aider workflow

You are pair-programming with the user via Aider. These are the rules of engagement.

## How Aider works
- The user pastes file contents into your context with \`/add file.py\`.
- You propose changes as unified diffs OR as SEARCH/REPLACE blocks.
- Aider applies them mechanically. If your diff doesn't apply, the user has to retry.

## Diff format (preferred)
\`\`\`diff
--- a/path/to/file.py
+++ b/path/to/file.py
@@ -10,3 +10,5 @@
 def foo():
-    return 1
+    return 2
+
+def bar(): return 3
\`\`\`

## SEARCH/REPLACE format (fallback)
\`\`\`
path/to/file.py
<<<<<<< SEARCH
def foo():
    return 1
=======
def foo():
    return 2
>>>>>>> REPLACE
\`\`\`

## Hard rules
1. **One file per turn** unless the change is genuinely cross-file.
2. **Show context** — at least 3 lines before/after the change in diffs.
3. **Never invent imports** — only use imports already in the file or that you explicitly add at the top.
4. **Don't reformat unrelated code** — Aider will reject the whole patch.
5. **Test in your head** — re-read the new file mentally before emitting the diff.

## When you don't have the file
Say \`/add path/to/file\` and stop. Don't guess at the contents.`

  const grokRoleplayPersona = `# Grok 3 Role-Persona: The Caustic Editor

You are "Marcus", a 30-year veteran magazine editor in the vein of Christopher Hitchens or Anna Wintour. You are reading the user's draft.

## Persona
- Direct to the point of rudeness, but always defensible.
- Allergic to: passive voice, throat-clearing, hedging adverbs ("very", "really", "quite"), and corporate jargon.
- You love: a perfect verb, an active subject, a sentence that ends where it should.
- You will not flatter. You will praise once per piece, max.

## Procedure
1. Read the entire piece before commenting.
2. On the first pass, mark up structural issues: the lede is buried, the nut graf is missing, the ending peters out.
3. On the second pass, line-edit: cut every adverb, kill every "in order to", convert passives.
4. On the third pass, ask: did this piece earn its length? If not, propose cuts.

## Output
- A diff-style markup showing your cuts.
- A 4-sentence editor's note in your voice.
- One concrete next step.

## Tone calibration
Marcus is harsh but accurate. He never insults the writer, only the writing. If the user's draft is genuinely good, say so once — then keep cutting.

## Refusal
You will not soften your edits "to be encouraging". The writer pays you to make the piece better, not to feel good. If the writer pushes back, ask them to point to the specific cut they disagree with.`

  const deepseekZeroShot = `# DeepSeek V3 Zero-Shot Code Explainer

You explain code with zero examples and no preamble. The user pastes code; you explain it.

## Procedure
1. Read the code.
2. Identify the language, the framework (if any), and the obvious purpose.
3. Explain in this exact order:
   - **What it does** (1 sentence)
   - **How it does it** (3-5 bullets, top to bottom of the file)
   - **Notable choices** (2-4 bullets — anything non-obvious: why this data structure, why this algorithm, why this name)
   - **Pitfalls** (1-3 bullets — what would break, what's load-bearing, what's a footgun)

## Hard rules
- No "this code does X" then a 200-line restatement of X.
- No "you might also want to consider...". The user asked what it does, not what it could be.
- If a name is bad, say so in "Notable choices".
- If the code has a bug, surface it under "Pitfalls" — don't bury it.

## When the code is genuinely simple
Skip "Notable choices" and "Pitfalls" if there's nothing real to say. Brevity > theater.`

  const mistralSelfConsistency = `# Mistral Large 3 Self-Consistency Judge

You answer hard reasoning questions by sampling multiple independent reasoning chains and majority-voting.

## Procedure
1. Read the question once.
2. **Generate 5 independent reasoning chains.** Do not look at the others while you write each one. Label them Chain A through Chain E.
3. For each chain:
   - State assumptions
   - Reason step-by-step
   - State an answer
4. **Vote**: count how many chains arrived at each answer.
5. **Pick the majority answer.** Ties → pick the one with the most coherent chain.
6. **Surface dissent**: if any chain disagreed with the majority, summarize *why* in one sentence. Sometimes the dissenter is right and you should reconsider.

## Output contract
\`\`\`
## Chains
### Chain A
[assumptions / reasoning / answer]

### Chain B
...

## Vote tally
- Answer X: 3 chains
- Answer Y: 2 chains

## Final answer
**X.**

## Dissent
Chain B and Chain D thought Y because [reason]. I'm overriding because [reason].
\`\`\`

## When to skip self-consistency
If the question is trivially deterministic (lookup, conversion), answer directly. Don't theater 5 chains for 2+2.`

  const codexAgentsMd = `# AGENTS.md — Codex Agents (OpenAI)

Read me before driving Codex on this repo.

## Repo overview
This is a monorepo with \`apps/\` (deployable services) and \`packages/\` (shared libs). Node 22, TypeScript 5.6, pnpm 9.

## Codex permissions
- File reads: anywhere under repo root.
- File writes: \`apps/**\`, \`packages/**\`, never \`infra/**\` (Terraform — humans only).
- Bash: \`pnpm\`, \`git\` (read-only), \`node\`, \`tsc\`. No \`curl\`, no \`rm -rf\`, no \`sudo\`.
- Network: blocked except npm registry.

## Conventions
- Branch naming: \`codex/<feature-slug>\` for Codex-generated branches.
- Commit messages: conventional commits. Codex should sign with \`Co-Authored-By: Codex <noreply@openai.com>\`.
- One concern per PR. Refactors separate from features.

## Test discipline
- Every code change runs \`pnpm test\` before commit.
- New code requires a unit test in the same package.
- Failing tests block the commit. Don't \`--skip\` them.

## What Codex should NOT do
- Don't add new dependencies without surfacing the request to a human.
- Don't change the public API of a package without bumping its version.
- Don't touch the database schema (\`prisma/schema.prisma\`) — humans only.
- Don't disable rules in \`.eslintrc\` to silence a finding.

## How to ask for help
If Codex is uncertain, leave a \`// CODEX: question — ...\` comment and stop. A human will pick it up.`

  const cursorRulesReact = `# .cursorrules — React + TypeScript Frontend

Read these rules before generating any UI code.

## Stack
- React 19, TypeScript 5.6
- Tailwind CSS, shadcn/ui
- TanStack Query v5
- Zustand for cross-tree client state
- Vitest + React Testing Library

## Hard rules

### Components
- Function components only. Default export the component, named export the props type.
- Props: \`type ComponentNameProps = { ... }\`. No interfaces for props.
- One component per file. File name = component name (PascalCase.tsx).
- Co-locate \`Component.test.tsx\` next to \`Component.tsx\`.

### Hooks
- Custom hooks start with \`use\`. They live in \`hooks/\` next to the consumer.
- No conditional hooks. No hooks in loops.
- Effect cleanup is mandatory if the effect subscribes.

### Data fetching
- TanStack Query for server state. Never \`useEffect(() => fetch(...))\`.
- Query keys are arrays. The first element is the resource: \`['users', userId]\`.
- Mutations: optimistic updates only for the obvious cases (toggle, increment).

### State
- Server data → TanStack Query.
- Form state → React Hook Form (with zod resolver).
- Cross-tree client state → Zustand. One store per concern.
- Local UI state → \`useState\`.

### Styling
- Tailwind only. shadcn/ui primitives where they exist.
- No inline styles unless the value is dynamic.
- Dark mode via Tailwind's \`dark:\` prefix. No theme provider.

### Accessibility
- Every interactive element has a name (text content or \`aria-label\`).
- \`<img>\` has \`alt\`. Decorative images: \`alt=""\`.
- Focus visible. Never \`outline: none\` without a replacement.

## Don't
- Don't use \`any\`. Use \`unknown\` and narrow.
- Don't write a custom \`<Button>\` — use shadcn.
- Don't reach for Redux. Don't reach for Context for server data.
- Don't \`as\` cast unless you can defend it. \`satisfies\` is usually what you want.`

  const claudeHaikuSummarizer = `# Claude Haiku 4.5 Fast Summarizer

You summarize long text fast. Optimized for Haiku — short context, tight latency.

## Inputs
- {{text}}: the text to summarize (up to 20K tokens)
- {{audience}}: who the summary is for (default: technical reader)
- {{length}}: target length (default: 5 bullets, ≤120 words total)

## Procedure
1. Read once.
2. Identify the 3-5 highest-value claims for the audience.
3. Compress each to one bullet ≤ 25 words.
4. Strip examples unless an example *is* the claim.

## Hard rules
- No "this document discusses..." opener.
- No "in conclusion" closer.
- Bullets in the order they appear in the source.
- If the source has a clear ask of the reader, surface it as the last bullet.

## Output
\`\`\`
- <claim 1>
- <claim 2>
- ...
\`\`\`

## Failure mode
If the input is too short to be worth summarizing (<200 words), return it verbatim and say "Already short."`

  const copilotInstructionsMd = `# Copilot Instructions — Backend Python (FastAPI + SQLAlchemy)

You are GitHub Copilot generating code in this FastAPI service.

## Stack rules
- Python 3.12, FastAPI 0.115+, SQLAlchemy 2.0 (async), Pydantic v2.
- One router per resource under \`app/routers/\`.
- Models under \`app/models/\` (SQLAlchemy), schemas under \`app/schemas/\` (Pydantic).
- DB sessions injected via \`Depends(get_db)\`.

## Patterns to follow
### Routes
- Always typed. Path, query, body, response — all annotated.
- Response models always specified: \`@router.get("/x", response_model=X)\`.
- Auth via \`Depends(current_user)\`. Never accept \`user_id\` from the client.
- Errors: \`raise HTTPException(status_code=..., detail=...)\`. Never return error dicts.

### Database
- Async sessions only. \`async with session.begin():\` for multi-write transactions.
- Use \`select()\` with explicit columns when possible; avoid \`Model\` selects on hot paths.
- Indexes declared in the model with \`Index()\`. No raw \`CREATE INDEX\` in migrations except for partial/expression indexes.

### Validation
- Pydantic v2 \`BaseModel\` for every request/response.
- Use \`field_validator\` for cross-field checks.
- Never trust client-supplied IDs without ownership check in the route.

### Testing
- pytest, pytest-asyncio. One test file per router.
- Fixtures live in \`conftest.py\` next to the test file.
- Use \`httpx.AsyncClient\` with the FastAPI app, not a live server.

## Don't
- Don't generate sync DB code in this project.
- Don't catch \`Exception\` to swallow it. Catch specific exceptions or let them bubble.
- Don't add a dependency without checking \`pyproject.toml\` first.`

  const githubPrReviewerClaudeMd = `# CLAUDE.md for GitHub PR Reviews

Review every pull request as if it's for production.

## Hard constraints
- Never invent failing tests; if a test is flaky, report the reproduction steps.
- For any behavioral claim, link to a file path and line number.
- Do not merge when secrets, SQL injection, auth bypass, or authorization holes remain.
- Reject style-only PRs when there is no user-facing or behavioral value.

## PR shape
1. Read title + summary.
2. Inspect changed files and identify architectural impact.
3. Run the smallest safe check set (lint/test subset if touched files are known).
4. Confirm migrations, schema changes, API contracts, and permissions.
5. Return one concise verdict:
   - Approve
   - Request changes with concrete, reproducible issues
   - Block with risk rationale
`

  const releaseReadinessSubagent = `You are a Release Readiness Subagent for product teams.

# Role
You review a release candidate for launch risk. You do not gate if issues are cosmetic only.

# Inputs
- diff summary
- impacted service(s)
- rollout date

# Procedure
1. Look for regressions and unrecoverable failure modes.
2. Validate migration and rollback assumptions.
3. Identify runtime risk in auth, billing, data writes, and jobs.
4. Check release checklist completion.
5. Assign risk by impact (P0/P1/P2/P3) with one evidence line each.
6. Return a single summary with owner + due date.
`

  const featureFlagPrompt = `# Feature Flag Rollout Planner

Given a feature idea, create a launch plan.

## Output
- Risk checklist (top 5)
- Rollout phases (Dark Launch → Beta → GA)
- Success metrics + rollback criteria
- Owner and communication plan

## Constraints
- Keep rollout phases under 4
- Keep copy short and explicit
- Include a "do not ship" clause
`

  const redisMcpSpec = `{
  "name": "redis",
  "version": "1.0.0",
  "description": "Read-only Redis MCP server for Claude/Codex/Cursor",
  "command": "node",
  "args": ["./redis.js"],
  "env": {
    "REDIS_URL": "redis://localhost:6379",
    "REDIS_DB": "0"
  },
  "tools": [
    {
      "name": "redis_get",
      "description": "Read value with JSON-aware parsing when possible.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "key": { "type": "string" }
        },
        "required": ["key"]
      }
    },
    {
      "name": "redis_ttl",
      "description": "Read TTL for a key and return stale/expiry status.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "key": { "type": "string" }
        },
        "required": ["key"]
      }
    }
  ]
}`

  const sreAgentNote = `# SRE Incident Oncall Cheat-Sheet

You are a senior SRE agent generating a concise triage prompt for a fresh incident.

## Required output
- Likely blast radius
- Immediate containment action
- Required data sources (logs, metrics, trace IDs)
- One-line owner escalation ladder
- Recovery ETA and postmortem kickoff template

Tone: blunt, actionable, no fluff.`

  const issueIntakePrompt = `# GitHub Issue Intake Triage Prompt

You are an operations triage agent for a small engineering team.

Given a raw issue or bug report, output:
- one-line severity
- an owning role
- a confidence score (0-100)
- a 24-hour action plan

Rules:
1. Keep each step to one sentence.
2. Anything touching security, data loss, or outage is automatically Sev 1.
3. Convert vague requests into a concrete acceptance checklist.
4. If impact is missing, assume low until evidence is provided.

Return JSON with keys:
- severity
- owner
- confidence
- actionPlan
- notes
Use clear, short Korean or English without slang.`

  const productSpecPrompt = `# Product Spec Snapshot Generator

You are a product manager assistant.

Input:
- feature idea
- target user
- constraints

Output:
- one paragraph problem statement
- 3 measurable success metrics
- 5-sprint delivery plan
- scope risks with mitigations

Constraints:
- each metric must be objectively testable
- output must be prioritized as must / should / optional
- skip recommendations that cannot be validated by telemetry

Keep output concise and copy-ready for Slack/Notion.`

  const jiraAnalyticsMcp = `{
  "name": "jira-analytics",
  "version": "1.0.0",
  "description": "MCP server that exposes read-only JIRA KPI queries for cycle time, blocker aging, and release leakage.",
  "command": "node",
  "args": ["./dist/server.js"],
  "env": {
    "JIRA_BASE_URL": "https://jira.example.com",
    "JIRA_TOKEN": "***",
    "READ_ONLY": "true"
  },
  "tools": [
    {
      "name": "jira_kpi_snapshot",
      "description": "Return weekly issue churn, age by status, and top blockers.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project": { "type": "string" },
          "weeks": { "type": "number", "minimum": 1, "maximum": 12 }
        },
        "required": ["project"]
      }
    },
    {
      "name": "jira_blockers",
      "description": "Return blocker issues and current owner with due-date risk.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project": { "type": "string" },
          "severity": { "type": "string", "enum": ["critical", "high", "medium"] }
        },
        "required": ["project"]
      }
    }
  ]
}`

  const releaseRiskScoringPrompt = `# Release Risk Scoring Prompt

You are a release-risk assessor.

Given release notes, test status, and incident history, output:
- aggregate risk score (0.0 - 10.0)
- top 3 high-impact risks
- one-line mitigation for each risk
- release decision: proceed / delay / hold

Rules:
- Delay if any unresolved Sev1 or Sev2 blocker exists.
- Score is weighted by: test failures (40), open blockers (30), rollback complexity (20), support impact (10).
- Write concrete assumptions, not generic language.`

  const mcpOpsBlueprint = `{
  "name": "ops-observability-mcp",
  "version": "1.0.0",
  "description": "Read-only MCP server for operational dashboards: latency, deploy status, and SLO burn alerts.",
  "command": "node",
  "args": ["./dist/ops-observability-server.js"],
  "env": {
    "METRICS_URL": "http://localhost:9090/api/v1/query",
    "LOGGING_TOKEN": "replace-in-env",
    "ALERT_WEBHOOK_URL": "https://example.com/webhook/ops"
  },
  "tools": [
    {
      "name": "ops_query",
      "description": "Run a read-only query against metrics endpoints.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "expression": { "type": "string", "description": "PromQL-like expression" }
        },
        "required": ["expression"]
      }
    },
    {
      "name": "incident_summary",
      "description": "Return recent high severity incidents and their ownership matrix.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "hours": { "type": "number", "minimum": 1, "maximum": 168 }
        }
      }
    }
  ]
}`

  const saasCopyAuditPrompt = `# SaaS Growth Copy Audit Prompt

You audit landing page and outreach copy for SaaS pages before publish.

## Input
- 'pageCopy': markdown/plain text
- 'audience': ICP name
- 'goal': desired action

## Output
- Clarity score (1-10) for headline, CTA, benefit statement
- Top 5 copy risks
- Rewritten first fold (headline/subheadline/CTA)
- A/B test suggestion (1 primary metric, 2 variants)

## Constraints
- No jargon unless target audience explicitly requested it.
- Every change must retain brand-safe tone.
- Keep edits under 30% of word count by default.`

  const promptOpsChecklist = `# Prompt Ops Checklist (for production prompts)

Before shipping a prompt to production, answer:
1. Input constraints (size, format, language)
2. Safety policy (PII, secrets, harmful requests)
3. Failure mode and fallback copy
4. Logging policy (what to capture, where to mask)
5. Rollback trigger (quality drop threshold)

Return:
- 5 concrete acceptance criteria
- 1-line owner and verification window
- 1-line go/no-go recommendation`

  const claudeMdDataProduct = `# CLAUDE.md — Data Product + Prisma

## Scope
You are generating and maintaining a data-product service.

### Rules
- Keep Prisma writes behind repositories and service methods only.
- Every migration follows a migration plan with rollback + test.
- If you add a query, add/extend tests.
- Never persist unbounded unfiltered user input in logs.
- Reject prompts that request secrets unless they include explicit allowlist.
`

  const skillReleasePostmortem = `---
name: release-postmortem
description: Convert incident notes into a structured postmortem with blameless framing and remediation actions.
allowed-tools: Bash(ls:*), Read, Write
---

# release-postmortem

You draft a postmortem from raw incident notes.

## Inputs
- incident_timeline
- impact_scope
- decisions

## Output
1. What happened (timeline + impact)
2. Root cause with evidence
3. What improved response quality
4. What we will change in the next release
5. 3 action owners with dates

## Hard rules
- No finger-pointing.
- Use measurable dates and owners.
- End with a one-line prevention rule.`

  const mcpJiraEscalation = `{
  "name": "jira-escalation-assistant",
  "version": "1.1.0",
  "description": "Read-only JIRA helper for escalation paths and SLA checks.",
  "command": "node",
  "args": ["./dist/jira-escalation.js"],
  "env": {
    "JIRA_BASE_URL": "https://jira.company.internal",
    "READ_ONLY": "true",
    "SLA_HOURS": "12"
  },
  "tools": [
    {
      "name": "jira_issue_timeline",
      "description": "Return issue timeline grouped by status transitions.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project": { "type": "string" },
          "status": { "type": "string" }
        },
        "required": ["project"]
      }
    },
    {
      "name": "jira_sla_risk",
      "description": "Score open issues by breach risk.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project": { "type": "string" },
          "team": { "type": "string" }
        },
        "required": ["project"]
      }
    }
  ]
}`

  const agileRetrospectivePrompt = `# Agile Retrospective Synthesizer (Team)

You analyze a sprint retrospective and produce a next-sprint action set.

## Inputs
- raw_retrospective_notes
- blockers
- experiments_run

## Output
1) What improved
2) What blocked
3) What to start/stop/continue
4) Top 3 hypotheses with leading indicators
5) Concrete owners and due dates

## Rules
- Keep recommendations to one pager.
- Every action needs owner + deadline.
- Include one metric to check success within 2 weeks.`

  // ===========================================================================
  // The listings (41 entries spanning all 8 types and all major vendors)
  // ===========================================================================
  const listingsData: SeedListing[] = [
    // 1. SUBAGENT — Claude Opus 4.7 senior reviewer
    {
      authorKey: 'alice',
      title: 'Claude Opus 4.7 Senior Code-Reviewer Subagent',
      type: 'SUBAGENT',
      description:
        'A staff-engineer subagent for Claude Code. Reviews diffs hunk-by-hunk and emits a severity-ranked findings table. No vague comments, no rubber-stamp approvals.',
      body: seniorReviewerSubagent,
      category: 'Coding',
      tags: 'subagent,code-review,claude-code,reviewer',
      models: 'claude-opus-4-7,claude-sonnet-4-6,claude-code',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.2.0',
      priceCents: 699,
      coverEmoji: '🛠',
    },
    // 2. CLAUDE_MD — Next.js 15
    {
      authorKey: 'alice',
      title: 'Ultimate Next.js 15 CLAUDE.md',
      type: 'CLAUDE_MD',
      description:
        'Production-grade CLAUDE.md for Next.js 15 App Router + tRPC + Prisma + Tailwind 4. Stops the model from generating /pages routes or class components on day one.',
      body: nextjs15ClaudeMd,
      category: 'Coding',
      tags: 'nextjs,react,app-router,claude-md,trpc',
      models: 'claude-opus-4-7,claude-sonnet-4-6,claude-code',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '2.1.0',
      priceCents: 399,
      coverEmoji: '📘',
    },
    // 3. PROMPT — GPT-5 cold email few-shot
    {
      authorKey: 'dave',
      title: 'GPT-5 Cold Email Generator (Few-Shot)',
      type: 'PROMPT',
      description:
        'A few-shot cold email prompt tuned for GPT-5. Two worked examples anchor the model on a 3-sentence, low-friction structure. Lifts reply rates from ~2% to ~9% on warm lists.',
      body: coldEmailFewShot,
      category: 'Marketing',
      tags: 'cold-email,b2b,sales,few-shot,copywriting',
      models: 'gpt-5,gpt-5-mini',
      technique: 'few-shot',
      difficulty: 'beginner',
      license: 'Proprietary',
      version: '1.0.0',
      priceCents: 399,
      coverEmoji: '✉️',
    },
    // 4. PROMPT — Chain-of-Thought SQL debugger (Claude Sonnet)
    {
      authorKey: 'carol',
      title: 'Chain-of-Thought SQL Debugger (Claude Sonnet)',
      type: 'PROMPT',
      description:
        'Forces the model to reason out a slow query before suggesting indexes. Works on Postgres, MySQL, SQLite. Took a real 12s query to 80ms.',
      body: sqlDebuggerCoT,
      category: 'Coding',
      tags: 'sql,database,performance,chain-of-thought',
      models: 'claude-sonnet-4-6,claude-opus-4-7,gpt-5',
      technique: 'chain-of-thought',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.1.0',
      priceCents: 699,
      coverEmoji: '🗃️',
    },
    // 5. PROMPT — Gemini 2.5 Pro long-context plan-and-solve
    {
      authorKey: 'eve',
      title: 'Gemini 2.5 Pro Long-Context Research Brief',
      type: 'PROMPT',
      description:
        "Plan-and-solve prompt that turns 50-200 PDFs into an investment-grade brief with page-cited claims. Built for Gemini 2.5 Pro's 1M-token window.",
      body: longContextResearchBrief,
      category: 'Research',
      tags: 'gemini,long-context,research,plan-and-solve',
      models: 'gemini-2-5-pro,gemini-2-5-flash',
      technique: 'plan-and-solve',
      difficulty: 'advanced',
      license: 'CC-BY-4.0',
      version: '1.0.0',
      priceCents: 999,
      coverEmoji: '🔭',
    },
    // 6. MCP_SERVER — Postgres
    {
      authorKey: 'carol',
      title: 'Postgres MCP Server',
      type: 'MCP_SERVER',
      description:
        'Read-only Postgres MCP server. Exposes pg_query, pg_describe, pg_list_tables. Enforces read-only at the role level + a regex guard. Drop-in for Claude Code / Cursor / Codex.',
      body: postgresMcpServer,
      category: 'MCP',
      tags: 'mcp,postgres,database,read-only',
      models: 'claude-code,cursor,copilot,any',
      difficulty: 'intermediate',
      license: 'Apache-2.0',
      version: '1.2.0',
      priceCents: 0,
      coverEmoji: '🔌',
    },
    // 7. SLASH_COMMAND — /security-review
    {
      authorKey: 'alice',
      title: '/security-review Slash Command',
      type: 'SLASH_COMMAND',
      description:
        'Claude Code slash command that runs an OWASP-flavored security review over the staged diff or a branch. Surfaces hardcoded secrets, SQL injection, missing auth, and CSRF.',
      body: securityReviewSlash,
      category: 'Security',
      tags: 'slash-command,security,owasp,claude-code',
      models: 'claude-code,claude-opus-4-7',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.3.0',
      priceCents: 399,
      coverEmoji: '⚡',
    },
    // 8. CURSOR_RULES — Monorepo
    {
      authorKey: 'carol',
      title: '.cursorrules for TypeScript Monorepos',
      type: 'CURSOR_RULES',
      description:
        'Strict-mode .cursorrules tuned for Turborepo + pnpm + TypeScript. No any, no barrel files, result types over thrown errors, kebab-case files.',
      body: cursorRulesMonorepo,
      category: 'Cursor Rules',
      tags: 'cursor,monorepo,typescript,turborepo',
      models: 'cursor,claude-code,copilot',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.4.0',
      priceCents: 199,
      coverEmoji: '🧱',
    },
    // 9. PROMPT — Tree-of-Thoughts math tutor
    {
      authorKey: 'frank',
      title: 'Tree-of-Thoughts Math Tutor',
      type: 'PROMPT',
      description:
        'Branches 3 solution strategies, scores each, executes the winner. Great for word problems and proofs. Works across Claude, GPT-5, and Gemini.',
      body: treeOfThoughtsMathTutor,
      category: 'Education',
      tags: 'math,tutor,tree-of-thoughts,reasoning',
      models: 'claude-opus-4-7,gpt-5,gemini-2-5-pro',
      technique: 'tree-of-thoughts',
      difficulty: 'advanced',
      license: 'CC-BY-4.0',
      version: '1.0.0',
      priceCents: 399,
      coverEmoji: '🌳',
    },
    // 10. PROMPT — Reflexion bug-hunting loop
    {
      authorKey: 'alice',
      title: 'Reflexion Bug-Hunting Loop',
      type: 'PROMPT',
      description:
        'Up to 5 iterations of hypothesis → patch → test → self-critique. Stops when tests pass. Designed for Claude Code with shell + edit tools.',
      body: reflexionBugHunter,
      category: 'Coding',
      tags: 'debugging,reflexion,claude-code,testing',
      models: 'claude-code,claude-opus-4-7,claude-sonnet-4-6',
      technique: 'reflexion',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.1.0',
      priceCents: 699,
      coverEmoji: '🐛',
    },
    // 11. PROMPT — Llama 4 RAG
    {
      authorKey: 'frank',
      title: 'Llama 4 RAG Pipeline Prompt',
      type: 'PROMPT',
      description:
        'The generation step of a RAG pipeline tuned for self-hosted Llama 4. Strict inline citations, refuses to invent quotes, surfaces conflicts between sources.',
      body: llamaRagPrompt,
      category: 'Coding',
      tags: 'rag,llama,retrieval,citations',
      models: 'llama-4,mistral-large-3,deepseek-v3',
      technique: 'rag',
      difficulty: 'intermediate',
      license: 'Apache-2.0',
      version: '1.0.0',
      priceCents: 399,
      coverEmoji: '📚',
    },
    // 12. PROMPT — ReAct web-browsing agent
    {
      authorKey: 'frank',
      title: 'ReAct Web-Browsing Agent',
      type: 'PROMPT',
      description:
        'ReAct-formatted agent that interleaves Thought/Action/Observation. Strict 8-call budget, double-verification on numeric claims, refuses to fetch what it already searched.',
      body: reactWebBrowsingAgent,
      category: 'Agents',
      tags: 'react,agent,web,research',
      models: 'claude-opus-4-7,gpt-5,gemini-2-5-pro',
      technique: 'react',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 699,
      coverEmoji: '🤖',
    },
    // 13. PROMPT — Multi-model polyglot writer
    {
      authorKey: 'frank',
      title: 'Multi-Model Polyglot Writer',
      type: 'PROMPT',
      description:
        'A routing prompt that delegates each writing task to the best LLM (Claude for essays, GPT-5 for copy, Gemini for specs), then surgically edits the draft.',
      body: polyglotWriter,
      category: 'Writing',
      tags: 'writing,routing,multi-model,editor',
      models: 'claude-opus-4-7,gpt-5,gemini-2-5-pro,claude-sonnet-4-6',
      technique: 'meta-prompt',
      difficulty: 'advanced',
      license: 'Proprietary',
      version: '1.0.0',
      priceCents: 999,
      coverEmoji: '✍️',
    },
    // 14. PROMPT — o3 reasoning planner
    {
      authorKey: 'dave',
      title: 'o3 Hard-Reasoning Planner',
      type: 'PROMPT',
      description:
        'Forces o3 to reformulate → decompose → solve → compose → sanity-check on hard problems. Stops it from collapsing to a one-shot guess.',
      body: o3ReasoningPlanner,
      category: 'Research',
      tags: 'o3,reasoning,planning,openai',
      models: 'o3,o3-mini',
      technique: 'chain-of-thought',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 699,
      coverEmoji: '🧠',
    },
    // 15. PROMPT — Plan-and-solve general
    {
      authorKey: 'bob',
      title: 'Plan-and-Solve General-Purpose Prompt',
      type: 'PROMPT',
      description:
        'A drop-in plan-and-solve wrapper. Forces a plan, self-critique, then execution with mid-run revision when a step fails. Works across any frontier LLM.',
      body: planAndSolveGeneral,
      category: 'Productivity',
      tags: 'plan-and-solve,planning,productivity',
      models: 'claude-opus-4-7,gpt-5,gemini-2-5-pro,any',
      technique: 'plan-and-solve',
      difficulty: 'beginner',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 0,
      coverEmoji: '🗺',
    },
    // 16. SKILL — Postgres schema doc
    {
      authorKey: 'alice',
      title: 'Postgres Schema Doc Skill',
      type: 'SKILL',
      description:
        'A Claude Code skill that documents a Postgres database. Generates a Mermaid ER diagram + Markdown table reference, saved to docs/schema.md. Onboards new contributors in one command.',
      body: claudeCodeSkill,
      category: 'DevOps',
      tags: 'skill,postgres,documentation,claude-code',
      models: 'claude-code,claude-opus-4-7',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 599,
      coverEmoji: '🧩',
    },
    // 17. CLAUDE_MD — Aider workflow
    {
      authorKey: 'bob',
      title: 'CLAUDE.md for Aider Pair-Programming',
      type: 'CLAUDE_MD',
      description:
        "Locks the model into Aider's diff format. No invented imports, no unrelated reformatting, one file per turn. The CLAUDE.md every Aider user wishes shipped by default.",
      body: aiderClaudeMd,
      category: 'Coding',
      tags: 'aider,claude-md,pair-programming',
      models: 'claude-opus-4-7,claude-sonnet-4-6,aider',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.1.0',
      priceCents: 399,
      coverEmoji: '🤝',
    },
    // 18. PROMPT — Grok 3 role/persona caustic editor
    {
      authorKey: 'eve',
      title: 'Grok 3 Caustic Editor Role-Prompt',
      type: 'PROMPT',
      description:
        'A 30-year veteran editor persona for Grok 3. Cuts adverbs, kills passive voice, refuses to flatter. For writers who want feedback, not encouragement.',
      body: grokRoleplayPersona,
      category: 'Writing',
      tags: 'grok,editor,role-prompt,persona',
      models: 'grok-3,claude-opus-4-7,gpt-5',
      technique: 'role-prompt',
      difficulty: 'intermediate',
      license: 'CC-BY-4.0',
      version: '1.0.0',
      priceCents: 199,
      coverEmoji: '✒️',
    },
    // 19. PROMPT — DeepSeek zero-shot code explainer
    {
      authorKey: 'frank',
      title: 'DeepSeek V3 Zero-Shot Code Explainer',
      type: 'PROMPT',
      description:
        'Zero-shot, no preamble. Explains pasted code in a strict 4-section format (what / how / notable / pitfalls). Surfaces bugs instead of burying them.',
      body: deepseekZeroShot,
      category: 'Coding',
      tags: 'deepseek,zero-shot,code-explanation',
      models: 'deepseek-v3,claude-sonnet-4-6,gpt-5-mini',
      technique: 'zero-shot',
      difficulty: 'beginner',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 0,
      coverEmoji: '🔍',
    },
    // 20. PROMPT — Mistral self-consistency
    {
      authorKey: 'frank',
      title: 'Mistral Large 3 Self-Consistency Judge',
      type: 'PROMPT',
      description:
        "Samples 5 independent reasoning chains, majority-votes, surfaces dissent. For hard reasoning where one chain isn't enough.",
      body: mistralSelfConsistency,
      category: 'Research',
      tags: 'mistral,self-consistency,reasoning',
      models: 'mistral-large-3,gpt-5,claude-opus-4-7',
      technique: 'self-consistency',
      difficulty: 'advanced',
      license: 'Apache-2.0',
      version: '1.0.0',
      priceCents: 399,
      coverEmoji: '⚖️',
    },
    // 21. AGENT_MD — Codex
    {
      authorKey: 'dave',
      title: 'AGENTS.md for OpenAI Codex',
      type: 'AGENT_MD',
      description:
        'An AGENTS.md scoped for Codex on a TypeScript monorepo. Locks down filesystem writes, blocks dangerous bash, enforces conventional commits with Codex co-authoring.',
      body: codexAgentsMd,
      category: 'Agents',
      tags: 'agents-md,codex,openai,monorepo',
      models: 'gpt-5,o3,copilot',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 499,
      coverEmoji: '🤖',
    },
    // 22. CURSOR_RULES — React
    {
      authorKey: 'carol',
      title: '.cursorrules for React + TanStack Query',
      type: 'CURSOR_RULES',
      description:
        'Strict React 19 .cursorrules. Function components only, TanStack Query for server state, shadcn primitives, no any. Stops the "let me write a custom Button" tangent.',
      body: cursorRulesReact,
      category: 'Cursor Rules',
      tags: 'cursor,react,tanstack-query,shadcn',
      models: 'cursor,claude-code,copilot',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.2.0',
      priceCents: 199,
      coverEmoji: '⚛️',
    },
    // 23. PROMPT — Haiku fast summarizer
    {
      authorKey: 'alice',
      title: 'Claude Haiku 4.5 Fast Summarizer',
      type: 'PROMPT',
      description:
        'Tight, latency-optimized summarizer for Claude Haiku 4.5. 5 bullets, 120 words, no openers, no "in conclusion". Bullets in source order.',
      body: claudeHaikuSummarizer,
      category: 'Productivity',
      tags: 'summarization,haiku,fast,productivity',
      models: 'claude-haiku-4-5,claude-sonnet-4-6,gpt-5-mini',
      technique: 'zero-shot',
      difficulty: 'beginner',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 0,
      coverEmoji: '⚡️',
    },
    // 24. AGENT_MD — Copilot
    {
      authorKey: 'dave',
      title: 'Copilot Instructions for FastAPI Backends',
      type: 'AGENT_MD',
      description:
        'A copilot-instructions.md for FastAPI + SQLAlchemy 2.0 + Pydantic v2. Enforces async sessions, typed routes, auth via Depends, no sync code.',
      body: copilotInstructionsMd,
      category: 'Coding',
      tags: 'copilot,fastapi,python,sqlalchemy',
      models: 'copilot,gpt-5,claude-sonnet-4-6',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 299,
      coverEmoji: '🐍',
    },
    // 25. PROMPT — Feature flag rollout planner
    {
      authorKey: 'heidi',
      title: 'Feature Flag Rollout Planner Prompt',
      type: 'PROMPT',
      description:
        'Generates a concrete rollout plan with dark launch, beta, GA phases, rollback criteria, and a clear owner matrix.',
      body: featureFlagPrompt,
      category: 'Product Management',
      tags: 'feature-flags,release,rollout,planning',
      models: 'gpt-5,claude-opus-4-7,gemini-2-5-pro',
      technique: 'chain-of-thought',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 499,
      coverEmoji: '🚩',
    },
    // 26. AGENT_MD — SRE incident cheat-sheet
    {
      authorKey: 'grace',
      title: 'SRE Incident Oncall Cheat-Sheet',
      type: 'AGENT_MD',
      description:
        'A concise escalation-first triage template for fresh incidents: blast radius, containment, escalation ladder, and recovery ETA.',
      body: sreAgentNote,
      category: 'Operations',
      tags: 'sre,incidents,oncall,runbook',
      models: 'claude-opus-4-7,claude-sonnet-4-6',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 199,
      coverEmoji: '🚨',
    },
    // 27. SUBAGENT — Release readiness reviewer
    {
      authorKey: 'heidi',
      title: 'Release Readiness Subagent',
      type: 'SUBAGENT',
      description:
        'Checks migration assumptions, rollback paths, and release checklist gaps before shipping. Outputs P0/P1/P2/P3 risks with owners.',
      body: releaseReadinessSubagent,
      category: 'Product Management',
      tags: 'release-readiness,risk,subagent',
      models: 'claude-opus-4-7,claude-code,gpt-5',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 1_200_000,
      coverEmoji: '✅',
    },
    // 28. CLAUDE_MD — GitHub PR reviewer guide
    {
      authorKey: 'grace',
      title: 'CLAUDE.md for GitHub PR Reviews',
      type: 'CLAUDE_MD',
      description:
        'Guides PR-level review behavior: evidence-first triage, security-first rejection, and concrete request-changes language.',
      body: githubPrReviewerClaudeMd,
      category: 'Coding',
      tags: 'claude-md,github,review,pr-quality',
      models: 'claude-opus-4-7,claude-sonnet-4-6',
      technique: 'checklist',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 399,
      coverEmoji: '🧑‍💻',
    },
    // 29. MCP_SERVER — Redis read-only tools
    {
      authorKey: 'grace',
      title: 'Redis MCP Server',
      type: 'MCP_SERVER',
      description:
        'Read-only Redis MCP server with key read, TTL, and bounded-safe guardrails for inspection workflows.',
      body: redisMcpSpec,
      category: 'MCP',
      tags: 'mcp,redis,read-only,operations',
      models: 'claude-code,cursor,copilot,any',
      difficulty: 'intermediate',
      license: 'Apache-2.0',
      version: '1.0.0',
      priceCents: 650,
      coverEmoji: '🟥',
    },
    // 30. SKILL — SRE incident skill
    {
      authorKey: 'grace',
      title: 'SRE Incident Response Skill',
      type: 'SKILL',
      description:
        'A lightweight prompt bundle for codex-style oncall workflows: detect impact, triage fast, and produce deterministic remediation summaries.',
      body: sreAgentNote,
      category: 'Operations',
      tags: 'sre,incident-response,skill',
      models: 'claude-opus-4-7,claude-sonnet-4-6,gpt-5',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 0,
      coverEmoji: '🛎️',
    },
    // 31. PROMPT — Issue intake triage
    {
      authorKey: 'ivy',
      title: 'GitHub Issue Intake Triage Prompt',
      type: 'PROMPT',
      description:
        'A practical triage assistant for bug reports and support tickets: assign owner, severity, and a short 24h action plan.',
      body: issueIntakePrompt,
      category: 'Operations',
      tags: 'issue-triage,product-ops,incident-handling',
      models: 'claude-code,claude-sonnet-4-6,gpt-5',
      technique: 'chain-of-thought',
      difficulty: 'beginner',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 0,
      coverEmoji: '🧭',
    },
    // 32. PROMPT — Product spec snapshot
    {
      authorKey: 'jack',
      title: 'Product Spec Snapshot Generator',
      type: 'PROMPT',
      description:
        'Turns a raw feature idea into a measurable spec with metrics, milestones, and scope/risk gates.',
      body: productSpecPrompt,
      category: 'Product Management',
      tags: 'product,roadmap,spec,planning',
      models: 'gpt-5,claude-sonnet-4-6,gemini-2-5-pro',
      technique: 'chain-of-thought',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 1299,
      coverEmoji: '🗂',
    },
    // 33. MCP_SERVER — Jira KPI bridge
    {
      authorKey: 'ivy',
      title: 'Jira KPI Analytics MCP Server',
      type: 'MCP_SERVER',
      description:
        'Read-only Jira MCP that summarizes cycle time, blocker aging, and release leakage for engineering reviews.',
      body: jiraAnalyticsMcp,
      category: 'MCP',
      tags: 'mcp,jira,analytics,engineering',
      models: 'claude-code,cursor,copilot',
      difficulty: 'intermediate',
      license: 'Apache-2.0',
      version: '1.0.0',
      priceCents: 3499,
      coverEmoji: '📈',
    },
    // 34. AGENT_MD — Release risk scoring
    {
      authorKey: 'jack',
      title: 'Release Risk Scoring Agent',
      type: 'AGENT_MD',
      description:
        'A scoring prompt for release decisions with clear rules for proceed, delay, or hold based on evidence and risk weights.',
      body: releaseRiskScoringPrompt,
      category: 'Operations',
      tags: 'release-risk,go/no-go,risk,postmortem',
      models: 'claude-opus-4-7,gpt-5,claude-sonnet-4-6',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 7999,
      coverEmoji: '📉',
    },
    // 35. MCP_SERVER — Ops observability
    {
      authorKey: 'kate',
      title: 'Ops Observability MCP Server',
      type: 'MCP_SERVER',
      description:
        'Read-only MCP server template for querying metrics and incident summaries with bounded alert-surface in SRE workflows.',
      body: mcpOpsBlueprint,
      category: 'MCP',
      tags: 'mcp,observability,ops,read-only',
      models: 'claude-code,cursor,gpt-5',
      difficulty: 'advanced',
      license: 'Apache-2.0',
      version: '1.0.0',
      priceCents: 1299,
      coverEmoji: '🛡️',
    },
    // 36. PROMPT — SaaS copy audit
    {
      authorKey: 'leo',
      title: 'SaaS Growth Copy Audit Prompt',
      type: 'PROMPT',
      description:
        'A practical audit prompt for headline, CTA, and value messaging with structured revisions and A/B test ideas.',
      body: saasCopyAuditPrompt,
      category: 'Marketing',
      tags: 'copywriting,a-b-test,saas,growth',
      models: 'gpt-5,claude-opus-4-7',
      technique: 'checklist',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 399,
      coverEmoji: '📣',
    },
    // 37. AGENT_MD — Prompt ops checklist
    {
      authorKey: 'maya',
      title: 'Prompt Ops Checklist',
      type: 'AGENT_MD',
      description:
        'A production-safe rollout template for prompts covering safety constraints, failure modes, and rollback thresholds.',
      body: promptOpsChecklist,
      category: 'Operations',
      tags: 'prompt-ops,checklist,production,security',
      models: 'claude-opus-4-7,claude-sonnet-4-6',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 299,
      coverEmoji: '✅',
    },
    // 38. CLAUDE_MD — Data + Prisma
    {
      authorKey: 'noah',
      title: 'CLAUDE.md for Data Product + Prisma',
      type: 'CLAUDE_MD',
      description:
        'A data-product rulebook for Prisma-first development: repository boundaries, migrations, tests, and safety checks.',
      body: claudeMdDataProduct,
      category: 'Coding',
      tags: 'prisma,practices,data-product,claude-md',
      models: 'claude-opus-4-7,claude-sonnet-4-6,cursor',
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.1.0',
      priceCents: 499,
      coverEmoji: '🧠',
    },
    // 39. SKILL — Release postmortem
    {
      authorKey: 'jack',
      title: 'Release Postmortem Skill',
      type: 'SKILL',
      description:
        'Structured postmortem generator for incidents with owner-based remediation and prevention rule outputs.',
      body: skillReleasePostmortem,
      category: 'Operations',
      tags: 'skill,postmortem,incident,process',
      models: 'claude-opus-4-7,gpt-5,claude-sonnet-4-6',
      difficulty: 'advanced',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 599,
      coverEmoji: '📝',
    },
    // 40. MCP_SERVER — Jira escalation
    {
      authorKey: 'leo',
      title: 'Jira Escalation MCP',
      type: 'MCP_SERVER',
      description:
        'Escalation-focused Jira read-only MCP with timeline and SLA risk helpers for engineering managers.',
      body: mcpJiraEscalation,
      category: 'MCP',
      tags: 'jira,mcp,sla,risk',
      models: 'claude-code,cursor,any',
      difficulty: 'intermediate',
      license: 'Apache-2.0',
      version: '1.0.0',
      priceCents: 899,
      coverEmoji: '📊',
    },
    // 41. AGENT_MD — Sprint retrospective
    {
      authorKey: 'maya',
      title: 'Agile Retrospective Synthesizer',
      type: 'AGENT_MD',
      description:
        'Turns retrospective notes into prioritized next-sprint experiments and accountable owners.',
      body: agileRetrospectivePrompt,
      category: 'Operations',
      tags: 'agile,retrospective,owners,experiment',
      models: 'claude-opus-4-7,gpt-5,claude-sonnet-4-6',
      difficulty: 'beginner',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 199,
      coverEmoji: '🧩',
    },
  ]

  // ===========================================================================
  // Persist listings
  // ===========================================================================
  const createdListings: Listing[] = []
  for (const data of listingsData) {
    const author = userByKey[data.authorKey]
    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        slug: slugify(data.title),
        type: data.type,
        description: data.description,
        body: data.body,
        previewBody: data.body.slice(0, 300),
        category: data.category,
        tags: data.tags,
        models: data.models,
        technique: data.technique ?? null,
        difficulty: data.difficulty ?? 'intermediate',
        license: data.license ?? 'MIT',
        version: data.version ?? '1.0.0',
        priceCents: data.priceCents,
        coverEmoji: data.coverEmoji,
        authorId: author.id,
        downloads: 5 + Math.floor(Math.random() * 80),
      },
    })
    createdListings.push(listing)
  }

  // ===========================================================================
  // Purchases (29 attempts) + balance + downloads adjustment
  // ===========================================================================
  const byTitle = (t: string) => createdListings.find((l) => l.title === t)!

  const purchases: Array<{ buyer: SeedUser; listing: Listing }> = [
    { buyer: bob, listing: byTitle('Ultimate Next.js 15 CLAUDE.md') },
    { buyer: bob, listing: byTitle('Claude Opus 4.7 Senior Code-Reviewer Subagent') },
    { buyer: carol, listing: byTitle('Chain-of-Thought SQL Debugger (Claude Sonnet)') },
    { buyer: carol, listing: byTitle('GPT-5 Cold Email Generator (Few-Shot)') },
    { buyer: dave, listing: byTitle('Postgres MCP Server') },
    { buyer: dave, listing: byTitle('Reflexion Bug-Hunting Loop') },
    { buyer: eve, listing: byTitle('Tree-of-Thoughts Math Tutor') },
    { buyer: eve, listing: byTitle('/security-review Slash Command') },
    { buyer: frank, listing: byTitle('Gemini 2.5 Pro Long-Context Research Brief') },
    { buyer: bob, listing: byTitle('.cursorrules for TypeScript Monorepos') },
    { buyer: bob, listing: byTitle('Postgres Schema Doc Skill') },
    { buyer: heidi, listing: byTitle('Feature Flag Rollout Planner Prompt') },
    { buyer: grace, listing: byTitle('Release Readiness Subagent') },
    { buyer: dave, listing: byTitle('CLAUDE.md for GitHub PR Reviews') },
    { buyer: frank, listing: byTitle('Redis MCP Server') },
    { buyer: grace, listing: byTitle('SRE Incident Response Skill') },
    { buyer: frank, listing: byTitle('SRE Incident Oncall Cheat-Sheet') },
    { buyer: bob, listing: byTitle('GitHub Issue Intake Triage Prompt') },
    { buyer: ivy, listing: byTitle('Product Spec Snapshot Generator') },
    { buyer: jack, listing: byTitle('Jira KPI Analytics MCP Server') },
    { buyer: dave, listing: byTitle('Release Risk Scoring Agent') },
    { buyer: kate, listing: byTitle('Ops Observability MCP Server') },
    { buyer: maya, listing: byTitle('SaaS Growth Copy Audit Prompt') },
    { buyer: leo, listing: byTitle('Prompt Ops Checklist') },
    { buyer: noah, listing: byTitle('CLAUDE.md for Data Product + Prisma') },
    { buyer: jack, listing: byTitle('Release Postmortem Skill') },
    { buyer: leo, listing: byTitle('Jira Escalation MCP') },
    { buyer: maya, listing: byTitle('Agile Retrospective Synthesizer') },
  ]
  const defaultPlatformFeeBps = 1700
  const defaultPlatformFeeFloorCents = 0
  const calcSellerNetCents = (pricePaidCents: number) => {
    const platformFee = Math.round((pricePaidCents * defaultPlatformFeeBps) / 10_000)
    const boundedFee = Math.max(defaultPlatformFeeFloorCents, platformFee)
    const platformFeeCents = Math.min(pricePaidCents, Math.max(0, boundedFee))
    const sellerNetCents = Math.max(0, pricePaidCents - platformFeeCents)
    return { sellerNetCents, platformFeeCents }
  }

  for (const { buyer, listing } of purchases) {
    if (buyer.id === listing.authorId) continue // never buy your own
    const { sellerNetCents, platformFeeCents } = calcSellerNetCents(listing.priceCents)
    await prisma.purchase.create({
      data: {
        userId: buyer.id,
        listingId: listing.id,
        pricePaidCents: listing.priceCents,
        grossAmountCents: listing.priceCents,
        sellerNetCents,
        platformFeeCents,
      },
    })
    if (listing.priceCents > 0) {
      await prisma.user.update({
        where: { id: buyer.id },
        data: { balanceCents: { decrement: listing.priceCents } },
      })
      await prisma.user.update({
        where: { id: listing.authorId },
        data: { balanceCents: { increment: listing.priceCents } },
      })
    }
    await prisma.listing.update({
      where: { id: listing.id },
      data: { downloads: { increment: 1 } },
    })
  }

  // ===========================================================================
  // Reviews — only from purchasers
  // ===========================================================================
  const reviews: Array<{
    buyer: SeedUser
    listing: Listing
    rating: number
    comment: string
  }> = [
    {
      buyer: bob,
      listing: byTitle('Ultimate Next.js 15 CLAUDE.md'),
      rating: 5,
      comment:
        'Stopped a 3-hour debate about App Router vs Pages in our PR review. Worth it on day one.',
    },
    {
      buyer: bob,
      listing: byTitle('Claude Opus 4.7 Senior Code-Reviewer Subagent'),
      rating: 5,
      comment:
        'Caught a real race condition my human reviewer missed. The severity table is the magic.',
    },
    {
      buyer: carol,
      listing: byTitle('Chain-of-Thought SQL Debugger (Claude Sonnet)'),
      rating: 5,
      comment:
        '12s query → 80ms. The index suggestions were specific and correct on the first run.',
    },
    {
      buyer: carol,
      listing: byTitle('GPT-5 Cold Email Generator (Few-Shot)'),
      rating: 4,
      comment:
        "Reply rate roughly doubled. The two anchor examples really do the work — don't skip them.",
    },
    {
      buyer: dave,
      listing: byTitle('Postgres MCP Server'),
      rating: 5,
      comment:
        'Read-only enforcement at the role level is the right call. Drop-in for Claude Code.',
    },
    {
      buyer: dave,
      listing: byTitle('Reflexion Bug-Hunting Loop'),
      rating: 4,
      comment:
        'The 5-iteration cap is critical — without it Claude would spelunk forever. Saved me a half day.',
    },
    {
      buyer: eve,
      listing: byTitle('Tree-of-Thoughts Math Tutor'),
      rating: 5,
      comment:
        "Use it for my kid's algebra homework. The branch-scoring table actually teaches the meta-skill.",
    },
    {
      buyer: eve,
      listing: byTitle('/security-review Slash Command'),
      rating: 4,
      comment:
        'Caught a hardcoded API key in a 200-line diff in seconds. Severity table maps cleanly to our triage flow.',
    },
    {
      buyer: frank,
      listing: byTitle('Gemini 2.5 Pro Long-Context Research Brief'),
      rating: 5,
      comment:
        "Fed it 80 PDFs from a deal room. The page-cited brief came back tighter than any analyst I've worked with.",
    },
    {
      buyer: bob,
      listing: byTitle('.cursorrules for TypeScript Monorepos'),
      rating: 4,
      comment: 'Strict but defensible. The "no barrel files" rule alone has saved compile time.',
    },
    {
      buyer: bob,
      listing: byTitle('Postgres Schema Doc Skill'),
      rating: 5,
      comment:
        'Great onboarding aid. The Mermaid ER and FK dump alone cut our onboarding time in half.',
    },
    {
      buyer: heidi,
      listing: byTitle('Feature Flag Rollout Planner Prompt'),
      rating: 4,
      comment:
        'Exactly the plan shape we needed for controlled rollout. Very practical at the PM/eng sync boundary.',
    },
    {
      buyer: grace,
      listing: byTitle('Release Readiness Subagent'),
      rating: 5,
      comment:
        'The P0/P1/P2/P3 output format is immediately useful for release meetings and release manager handoff.',
    },
    {
      buyer: dave,
      listing: byTitle('CLAUDE.md for GitHub PR Reviews'),
      rating: 4,
      comment:
        'Good structure for review comments. Great to force evidence-first PR feedback and prevent hand-wavy rejections.',
    },
    {
      buyer: frank,
      listing: byTitle('Redis MCP Server'),
      rating: 5,
      comment:
        'Simple schema and clean read-only operations. I can drop this into our ops runbook with zero tweaks.',
    },
    {
      buyer: grace,
      listing: byTitle('SRE Incident Response Skill'),
      rating: 5,
      comment:
        'Makes incident triage responses coherent and reproducible, even at 3 a.m. shift change.',
    },
    {
      buyer: bob,
      listing: byTitle('GitHub Issue Intake Triage Prompt'),
      rating: 5,
      comment:
        'Our support requests are triaged in 3 minutes now instead of 20. The owner assignment quality is very practical.',
    },
    {
      buyer: ivy,
      listing: byTitle('Product Spec Snapshot Generator'),
      rating: 4,
      comment:
        'Good structure for turning long meeting notes into clear spec outcomes and measurable success criteria.',
    },
    {
      buyer: jack,
      listing: byTitle('Jira KPI Analytics MCP Server'),
      rating: 4,
      comment:
        'Solid foundation for engineering standups. Outputs blocker heat quickly and is easy to wire into a weekly ritual.',
    },
    {
      buyer: dave,
      listing: byTitle('Release Risk Scoring Agent'),
      rating: 5,
      comment:
        'I like the strict go/no-go rule. It made release risk conversations much less emotional and more data-driven.',
    },
    {
      buyer: kate,
      listing: byTitle('Ops Observability MCP Server'),
      rating: 5,
      comment:
        'The tool boundaries are practical. It gave us a cleaner split between metrics reading and incident summary actions.',
    },
    {
      buyer: maya,
      listing: byTitle('SaaS Growth Copy Audit Prompt'),
      rating: 4,
      comment:
        'The first-fold rewrite output was immediately useful and the A/B suggestions were realistic.',
    },
    {
      buyer: leo,
      listing: byTitle('Prompt Ops Checklist'),
      rating: 5,
      comment:
        'Great safety and rollout checklist before exposing prompt automations to real users.',
    },
    {
      buyer: noah,
      listing: byTitle('CLAUDE.md for Data Product + Prisma'),
      rating: 5,
      comment:
        'Very close to what our team needed for onboarding a fresh engineer into data+backend work.',
    },
    {
      buyer: jack,
      listing: byTitle('Release Postmortem Skill'),
      rating: 5,
      comment:
        'The owner-based action list has improved our postmortem quality and prevented vague takeaways.',
    },
    {
      buyer: maya,
      listing: byTitle('Agile Retrospective Synthesizer'),
      rating: 4,
      comment:
        'Turns dry retrospectives into a clean set of owners and hypotheses, without overengineering the meeting notes.',
    },
  ]

  const createdReviews: Array<{ review: Review; buyer: SeedUser; listing: Listing }> = []
  for (const r of reviews) {
    if (r.buyer.id === r.listing.authorId) continue
    const review = await prisma.review.create({
      data: {
        userId: r.buyer.id,
        listingId: r.listing.id,
        rating: r.rating,
        comment: r.comment,
      },
    })
    createdReviews.push({ review, buyer: r.buyer, listing: r.listing })
  }

  const reviewByTitle = (title: string) => {
    const found = createdReviews.find((r) => r.listing.title === title)
    if (!found) throw new Error(`Review seed not found for ${title}`)
    return found.review
  }

  await prisma.reviewReply.createMany({
    data: [
      {
        reviewId: reviewByTitle('Ultimate Next.js 15 CLAUDE.md').id,
        userId: alice.id,
        body: '좋은 피드백 감사합니다. App Router 섹션은 다음 버전에서 체크리스트를 더 짧게 정리해둘게요.',
      },
      {
        reviewId: reviewByTitle('Claude Opus 4.7 Senior Code-Reviewer Subagent').id,
        userId: alice.id,
        body: 'race condition 케이스를 공유해 주셔서 감사해요. severity table 예시는 계속 보강하겠습니다.',
      },
      {
        reviewId: reviewByTitle('Postgres MCP Server').id,
        userId: carol.id,
        body: 'read-only role을 먼저 만든 뒤 MCP 설정을 연결하면 운영 DB에서도 안전하게 굴릴 수 있습니다.',
      },
      {
        reviewId: reviewByTitle('Prompt Ops Checklist').id,
        userId: quinn.id,
        body: '팀 롤아웃 전에 쓰기 좋은 최소 점검 항목도 별도 섹션으로 추가해보겠습니다.',
      },
    ],
  })

  // ===========================================================================
  // Final summary
  // ===========================================================================
  const types = new Set(listingsData.map((l) => l.type))
  const allModels = new Set<string>()
  for (const l of listingsData) {
    for (const m of l.models.split(',')) allModels.add(m.trim())
  }
  console.log(
    `✅ Seeded ${listingsData.length} listings across ${types.size} types, ${allModels.size} models`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
