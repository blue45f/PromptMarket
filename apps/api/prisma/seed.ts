import { Listing, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function rand(): string {
  return Math.random().toString(36).slice(2, 8);
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'listing'}-${rand()}`;
}

async function main() {
  await prisma.review.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash('password');

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      passwordHash,
      balanceCents: 10000,
      bio: 'Prompt engineer and Claude power user. I sell rules that ship.',
    },
  });
  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      passwordHash,
      balanceCents: 10000,
      bio: 'Indie hacker. Loves clever prompts.',
    },
  });
  const carol = await prisma.user.create({
    data: {
      email: 'carol@example.com',
      username: 'carol',
      passwordHash,
      balanceCents: 10000,
      bio: 'Full-stack dev shipping AI-augmented apps.',
    },
  });

  const nestClaudeMd = `# CLAUDE.md — Production NestJS API

You are working in a production NestJS 10 monorepo. Follow these rules.

## Code style
- Use modules, controllers, services. One feature per module.
- Validate every request body with class-validator DTOs.
- Never reach into another module's repository — go through its service.
- Prefer Prisma transactions for multi-write operations.

## Auth
- All authenticated routes use JwtAuthGuard.
- Never trust client-supplied userId — always read from req.user.

## Errors
- Throw NestJS HttpException subclasses (BadRequestException, etc).
- Do not return error objects from controllers.

## Testing
- Each service gets a unit test with the Prisma client mocked.
- Each controller gets an e2e test using supertest.

## Git
- Conventional commits. One concern per PR.
`;

  const nextRulesMd = `# CLAUDE.md — Next.js 14 + Tailwind

We use the App Router only. Server components by default; mark client with "use client".

## Components
- Co-locate components with their route segment.
- Tailwind only — no CSS modules, no styled-components.
- Use shadcn/ui primitives where possible.

## Data
- Fetch on the server when you can; pass data down as props.
- Use Server Actions for mutations triggered by forms.

## State
- Local state with useState. Cross-tree state with Zustand.
- Never reach for Redux.

## Performance
- next/image for every image. Always set sizes.
- Lazy-load heavy client components with next/dynamic.
`;

  const reviewerAgentMd = `# Senior Code Reviewer Agent

You review pull requests like a staff engineer.

## How you review
1. Read the diff end to end before commenting.
2. Look for: race conditions, N+1 queries, missing auth checks, missing input validation, leaked secrets, and bad error handling.
3. Praise good design briefly. Then list issues by severity: BLOCKER / HIGH / MEDIUM / NIT.
4. For each issue, quote the exact file:line and propose a concrete fix.

## Tone
- Direct, kind, specific. No vague "consider refactoring".
- Never approve a PR that has a BLOCKER issue open.

## Output format
Return Markdown with two sections: ## Summary and ## Issues.
`;

  const testWriterAgentMd = `# Test-Writer Subagent

You write missing tests for a target file.

## Process
1. Read the target file and any existing test file beside it.
2. List every exported function and every conditional branch.
3. Write Jest tests that cover happy path + at least one failure path per function.
4. Mock external deps (DB, HTTP, fs). Never hit a real network.
5. Use describe/it. Test names read as full sentences.

## Output
Write the test file next to the source, named *.spec.ts. Print a coverage table at the end.
`;

  const coldEmailPrompt = `You are a cold-email copywriter who books meetings for B2B SaaS founders.

Inputs:
- {{product}} — one sentence description of the product
- {{target}} — the role and company size of the recipient
- {{painPoint}} — what hurts them today

Write a 3-sentence cold email:
1. Open with a specific, non-generic observation about their world (not "I noticed your company is growing").
2. State the pain and how {{product}} removes it. No buzzwords.
3. Close with a low-friction ask: 15 minutes next Tuesday or Thursday.

Subject line: 5 words max, lowercase, curiosity-driven, no emojis.
`;

  const sqlOptimizerPrompt = `You are a senior database engineer. The user pastes a slow SQL query.

Do this in order:
1. Restate what the query is trying to do, in one sentence.
2. Identify the likely bottleneck (full scan, bad join order, missing index, SELECT *, correlated subquery, etc).
3. Rewrite the query. Show the new version in a \`\`\`sql block.
4. Suggest indexes to add. Show them in a \`\`\`sql block.
5. Estimate the speedup in plain English (e.g. "should drop from seconds to milliseconds on a 1M row table").

Be specific. Do not say "it depends".
`;

  const uxCopyPrompt = `You rewrite UX microcopy for SaaS apps.

The user gives you a piece of UI copy. You return 3 alternatives, ranked.

Rules:
- Use plain words. Cut adjectives.
- Lead with the user's verb, not the product's noun. ("Add teammate", not "Teammate creation").
- Buttons: 1-3 words, sentence case, never end in punctuation.
- Empty states: tell them what to do next, not what is missing.
- Errors: say what happened, then what to do.

Return a Markdown table: rank, copy, why.
`;

  const debuggerPrompt = `You are a debugging partner.

When the user pastes an error and code:
1. Ask at most one clarifying question if truly needed; otherwise proceed.
2. Form a hypothesis and explain it in 2 sentences.
3. Tell them the smallest change to test the hypothesis.
4. Only after they confirm, propose the fix.

Never paste a 50-line patch as the first response.
`;

  const mcpRulesMd = `# CLAUDE.md — MCP Server (TypeScript)

You are building a Model Context Protocol server.

## Structure
- One tool per file under src/tools/.
- Schemas are zod. Export them; the server registers them automatically.
- Tools must be pure async functions of (input) => output. No side-effects on import.

## Errors
- Throw McpError with a code and a human message.
- Never swallow errors — let them bubble.

## Logging
- Log to stderr only. stdout is the protocol channel.
`;

  const cursorRulesMd = `# .cursorrules — Strict TypeScript

- Strict mode is non-negotiable. No \`any\`.
- Prefer \`unknown\` then narrow.
- Result types over thrown errors for expected failures.
- No barrel files (no index.ts re-exports).
- Imports: absolute paths from src/.
- Tests sit next to the source as *.spec.ts.
`;

  const listingsData = [
    {
      author: alice,
      title: 'Production NestJS CLAUDE.md',
      type: 'CLAUDE_MD',
      description:
        'Battle-tested CLAUDE.md for a NestJS 10 + Prisma backend. Keeps the model on guardrails: modules, DTOs, guards, transactions.',
      body: nestClaudeMd,
      category: 'Coding',
      tags: 'nestjs,backend,typescript,prisma,claude-md',
      model: 'claude-opus-4',
      priceCents: 499,
      coverEmoji: '🦅',
    },
    {
      author: alice,
      title: 'Next.js 14 + Tailwind Project Rules',
      type: 'CLAUDE_MD',
      description:
        'Drop-in CLAUDE.md for App Router projects. Server-components-first, shadcn/ui, no Redux.',
      body: nextRulesMd,
      category: 'Cursor Rules',
      tags: 'nextjs,tailwind,frontend,claude-md',
      model: 'any',
      priceCents: 299,
      coverEmoji: '⚡️',
    },
    {
      author: alice,
      title: 'Senior Code-Reviewer Agent',
      type: 'AGENT_MD',
      description:
        'A reviewer subagent that catches what your team misses: races, N+1s, missing auth, leaked secrets.',
      body: reviewerAgentMd,
      category: 'Agents',
      tags: 'agent,code-review,subagent',
      model: 'claude-opus-4',
      priceCents: 799,
      coverEmoji: '🧐',
    },
    {
      author: carol,
      title: 'Test-Writer Subagent',
      type: 'AGENT_MD',
      description:
        'Point it at a file with no tests. Get a full Jest spec back, covering happy paths and edge cases.',
      body: testWriterAgentMd,
      category: 'Agents',
      tags: 'agent,testing,jest,subagent',
      model: 'claude-sonnet-4',
      priceCents: 599,
      coverEmoji: '🧪',
    },
    {
      author: bob,
      title: 'Cold Email Opener That Books Meetings',
      type: 'PROMPT',
      description:
        'Templated 3-sentence cold email. Pumps reply rates from 1% to 8% on warm lists.',
      body: coldEmailPrompt,
      category: 'Marketing',
      tags: 'cold-email,b2b,sales,copywriting',
      model: 'any',
      priceCents: 399,
      coverEmoji: '✉️',
    },
    {
      author: carol,
      title: 'SQL Query Optimizer',
      type: 'PROMPT',
      description:
        'Paste a slow query, get a faster query + the indexes you forgot to add. Works on Postgres, MySQL, SQLite.',
      body: sqlOptimizerPrompt,
      category: 'Coding',
      tags: 'sql,database,performance,postgres',
      model: 'claude-opus-4',
      priceCents: 699,
      coverEmoji: '🗃️',
    },
    {
      author: bob,
      title: 'UX Copy Rewriter',
      type: 'PROMPT',
      description:
        'Rewrites button labels, empty states, and error messages so users actually understand them.',
      body: uxCopyPrompt,
      category: 'Writing',
      tags: 'ux,copywriting,microcopy,product',
      model: 'any',
      priceCents: 0,
      coverEmoji: '✍️',
    },
    {
      author: alice,
      title: 'Pair-Programmer Debugger Prompt',
      type: 'PROMPT',
      description:
        'Stops the model from dumping a 200-line patch on the first turn. Forces hypothesis-driven debugging.',
      body: debuggerPrompt,
      category: 'Productivity',
      tags: 'debugging,coding,prompt',
      model: 'claude-sonnet-4',
      priceCents: 0,
      coverEmoji: '🐛',
    },
    {
      author: carol,
      title: 'MCP Server TypeScript Rules',
      type: 'CLAUDE_MD',
      description:
        'CLAUDE.md tuned for building Model Context Protocol servers in TS. Tools, schemas, error handling.',
      body: mcpRulesMd,
      category: 'MCP',
      tags: 'mcp,typescript,server,claude-md',
      model: 'claude-opus-4',
      priceCents: 499,
      coverEmoji: '🔌',
    },
    {
      author: bob,
      title: 'Strict TypeScript .cursorrules',
      type: 'CLAUDE_MD',
      description:
        'No any. No barrel files. Result types over thrown errors. The .cursorrules file your seniors wish you had.',
      body: cursorRulesMd,
      category: 'Cursor Rules',
      tags: 'typescript,cursor,rules,strict',
      model: 'any',
      priceCents: 199,
      coverEmoji: '🧱',
    },
  ];

  const createdListings: Listing[] = [];
  for (const data of listingsData) {
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
        model: data.model,
        priceCents: data.priceCents,
        coverEmoji: data.coverEmoji,
        authorId: data.author.id,
        downloads: Math.floor(Math.random() * 40),
      },
    });
    createdListings.push(listing);
  }

  // Purchases: bob buys 2 of alice's, carol buys 1 of alice's and 1 of bob's
  const nestRules = createdListings.find(
    (l) => l.title === 'Production NestJS CLAUDE.md',
  )!;
  const reviewer = createdListings.find(
    (l) => l.title === 'Senior Code-Reviewer Agent',
  )!;
  const sqlOpt = createdListings.find(
    (l) => l.title === 'SQL Query Optimizer',
  )!;
  const coldEmail = createdListings.find(
    (l) => l.title === 'Cold Email Opener That Books Meetings',
  )!;

  await prisma.purchase.create({
    data: {
      userId: bob.id,
      listingId: nestRules.id,
      pricePaidCents: nestRules.priceCents,
    },
  });
  await prisma.user.update({
    where: { id: bob.id },
    data: { balanceCents: { decrement: nestRules.priceCents } },
  });
  await prisma.user.update({
    where: { id: alice.id },
    data: { balanceCents: { increment: nestRules.priceCents } },
  });
  await prisma.listing.update({
    where: { id: nestRules.id },
    data: { downloads: { increment: 1 } },
  });

  await prisma.purchase.create({
    data: {
      userId: bob.id,
      listingId: reviewer.id,
      pricePaidCents: reviewer.priceCents,
    },
  });
  await prisma.user.update({
    where: { id: bob.id },
    data: { balanceCents: { decrement: reviewer.priceCents } },
  });
  await prisma.user.update({
    where: { id: alice.id },
    data: { balanceCents: { increment: reviewer.priceCents } },
  });
  await prisma.listing.update({
    where: { id: reviewer.id },
    data: { downloads: { increment: 1 } },
  });

  await prisma.purchase.create({
    data: {
      userId: carol.id,
      listingId: nestRules.id,
      pricePaidCents: nestRules.priceCents,
    },
  });
  await prisma.user.update({
    where: { id: carol.id },
    data: { balanceCents: { decrement: nestRules.priceCents } },
  });
  await prisma.user.update({
    where: { id: alice.id },
    data: { balanceCents: { increment: nestRules.priceCents } },
  });
  await prisma.listing.update({
    where: { id: nestRules.id },
    data: { downloads: { increment: 1 } },
  });

  await prisma.purchase.create({
    data: {
      userId: carol.id,
      listingId: coldEmail.id,
      pricePaidCents: coldEmail.priceCents,
    },
  });
  await prisma.user.update({
    where: { id: carol.id },
    data: { balanceCents: { decrement: coldEmail.priceCents } },
  });
  await prisma.user.update({
    where: { id: bob.id },
    data: { balanceCents: { increment: coldEmail.priceCents } },
  });
  await prisma.listing.update({
    where: { id: coldEmail.id },
    data: { downloads: { increment: 1 } },
  });

  await prisma.purchase.create({
    data: {
      userId: bob.id,
      listingId: sqlOpt.id,
      pricePaidCents: sqlOpt.priceCents,
    },
  });
  await prisma.user.update({
    where: { id: bob.id },
    data: { balanceCents: { decrement: sqlOpt.priceCents } },
  });
  await prisma.user.update({
    where: { id: carol.id },
    data: { balanceCents: { increment: sqlOpt.priceCents } },
  });
  await prisma.listing.update({
    where: { id: sqlOpt.id },
    data: { downloads: { increment: 1 } },
  });

  // Reviews (only from buyers)
  await prisma.review.create({
    data: {
      userId: bob.id,
      listingId: nestRules.id,
      rating: 5,
      comment:
        'Saved me from another rambling Claude session. Locked the model down on the first try.',
    },
  });
  await prisma.review.create({
    data: {
      userId: carol.id,
      listingId: nestRules.id,
      rating: 4,
      comment: 'Solid. Wish it had a section on background jobs.',
    },
  });
  await prisma.review.create({
    data: {
      userId: bob.id,
      listingId: reviewer.id,
      rating: 5,
      comment: 'Caught a real race condition my human reviewer missed. Worth it.',
    },
  });
  await prisma.review.create({
    data: {
      userId: carol.id,
      listingId: coldEmail.id,
      rating: 4,
      comment: 'Replies went up. The subject-line rule is the magic.',
    },
  });
  await prisma.review.create({
    data: {
      userId: bob.id,
      listingId: sqlOpt.id,
      rating: 5,
      comment: 'Took a 12-second query to 80ms. The index suggestions were spot on.',
    },
  });

  console.log('✅ Seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
