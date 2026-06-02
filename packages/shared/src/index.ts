import { z } from 'zod'

// ===========================================================================
// Listing taxonomy
// ===========================================================================

/** Top-level kind of asset being sold/shared. Granular to mirror real Claude /
 *  agentic workflows: prompts, project rules, agents, plugin skills, MCP
 *  servers, slash commands, and named sub-agents. */
export const ListingType = z.enum([
  'PROMPT', // a reusable LLM prompt
  'CLAUDE_MD', // a CLAUDE.md project-rules file
  'AGENT_MD', // an AGENTS.md / agent.md file (Codex / Copilot etc.)
  'SKILL', // a Claude Code skill (.skill bundle)
  'MCP_SERVER', // an MCP server definition
  'SLASH_COMMAND', // a /slash command markdown
  'SUBAGENT', // a named sub-agent (Claude Code subagent prompt)
  'CURSOR_RULES', // a .cursorrules file
])
export type ListingType = z.infer<typeof ListingType>

export const LISTING_TYPE_META: Record<
  ListingType,
  { label: string; emoji: string; gradient: string; pill: string }
> = {
  PROMPT: {
    label: 'Prompt',
    emoji: '✨',
    gradient: 'from-blue-400 to-indigo-600',
    pill: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  CLAUDE_MD: {
    label: 'CLAUDE.md',
    emoji: '📘',
    gradient: 'from-purple-400 to-fuchsia-600',
    pill: 'bg-purple-50 text-purple-700 ring-purple-200',
  },
  AGENT_MD: {
    label: 'agent.md',
    emoji: '🤖',
    gradient: 'from-emerald-400 to-teal-600',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  SKILL: {
    label: 'Skill',
    emoji: '🧩',
    gradient: 'from-orange-400 to-amber-600',
    pill: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  MCP_SERVER: {
    label: 'MCP Server',
    emoji: '🔌',
    gradient: 'from-cyan-400 to-sky-600',
    pill: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  },
  SLASH_COMMAND: {
    label: 'Slash Command',
    emoji: '⚡',
    gradient: 'from-yellow-400 to-orange-500',
    pill: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  },
  SUBAGENT: {
    label: 'Sub-agent',
    emoji: '🛠',
    gradient: 'from-pink-400 to-rose-600',
    pill: 'bg-pink-50 text-pink-700 ring-pink-200',
  },
  CURSOR_RULES: {
    label: '.cursorrules',
    emoji: '🧱',
    gradient: 'from-slate-500 to-zinc-700',
    pill: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
}

// ===========================================================================
// Models — the LLMs / dev-AI tools each listing is optimized for
// ===========================================================================

/** Slug | Pretty | Vendor | Family. Order matters for UI. Update when new
 *  flagship models ship. */
export const MODELS = [
  // Anthropic
  { slug: 'claude-opus-4-7', label: 'Claude Opus 4.7', vendor: 'Anthropic', family: 'Claude' },
  { slug: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', vendor: 'Anthropic', family: 'Claude' },
  { slug: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', vendor: 'Anthropic', family: 'Claude' },
  // OpenAI
  { slug: 'gpt-5', label: 'GPT-5', vendor: 'OpenAI', family: 'GPT' },
  { slug: 'gpt-5-mini', label: 'GPT-5 mini', vendor: 'OpenAI', family: 'GPT' },
  { slug: 'o3', label: 'o3', vendor: 'OpenAI', family: 'o-series' },
  { slug: 'o3-mini', label: 'o3-mini', vendor: 'OpenAI', family: 'o-series' },
  // Google
  { slug: 'gemini-2-5-pro', label: 'Gemini 2.5 Pro', vendor: 'Google', family: 'Gemini' },
  { slug: 'gemini-2-5-flash', label: 'Gemini 2.5 Flash', vendor: 'Google', family: 'Gemini' },
  // Meta / xAI / Mistral / DeepSeek
  { slug: 'llama-4', label: 'Llama 4', vendor: 'Meta', family: 'Llama' },
  { slug: 'grok-3', label: 'Grok 3', vendor: 'xAI', family: 'Grok' },
  { slug: 'mistral-large-3', label: 'Mistral Large 3', vendor: 'Mistral', family: 'Mistral' },
  { slug: 'deepseek-v3', label: 'DeepSeek V3', vendor: 'DeepSeek', family: 'DeepSeek' },
  // Tools / agents
  { slug: 'claude-code', label: 'Claude Code', vendor: 'Anthropic', family: 'Tool' },
  { slug: 'cursor', label: 'Cursor', vendor: 'Anysphere', family: 'Tool' },
  { slug: 'windsurf', label: 'Windsurf', vendor: 'Codeium', family: 'Tool' },
  { slug: 'copilot', label: 'GitHub Copilot', vendor: 'GitHub', family: 'Tool' },
  { slug: 'cline', label: 'Cline', vendor: 'Cline', family: 'Tool' },
  { slug: 'aider', label: 'Aider', vendor: 'Aider', family: 'Tool' },
  { slug: 'any', label: 'Any LLM', vendor: '—', family: 'Generic' },
] as const

export const MODEL_SLUGS = MODELS.map((m) => m.slug) as unknown as [string, ...string[]]
export const ModelSlug = z.enum(MODEL_SLUGS)
export type ModelSlug = z.infer<typeof ModelSlug>

export const MODEL_BY_SLUG: Record<string, { label: string; vendor: string; family: string }> =
  Object.fromEntries(
    MODELS.map((m) => [m.slug, { label: m.label, vendor: m.vendor, family: m.family }])
  )

export const VENDORS = Array.from(new Set(MODELS.map((m) => m.vendor)))
export const FAMILIES = Array.from(new Set(MODELS.map((m) => m.family)))

// ===========================================================================
// Prompt engineering technique (PROMPT type only)
// ===========================================================================

export const PromptTechnique = z.enum([
  'zero-shot',
  'few-shot',
  'chain-of-thought',
  'tree-of-thoughts',
  'role-prompt',
  'self-consistency',
  'react', // Reasoning + Acting
  'rag', // Retrieval-Augmented
  'meta-prompt',
  'reflexion',
  'plan-and-solve',
  'other',
])
export type PromptTechnique = z.infer<typeof PromptTechnique>

export const TECHNIQUE_META: Record<PromptTechnique, { label: string; hint: string }> = {
  'zero-shot': { label: 'Zero-shot', hint: 'No examples — direct instruction only.' },
  'few-shot': { label: 'Few-shot', hint: '2–10 worked examples before the task.' },
  'chain-of-thought': {
    label: 'Chain-of-Thought',
    hint: 'Forces the model to reason step-by-step.',
  },
  'tree-of-thoughts': {
    label: 'Tree-of-Thoughts',
    hint: 'Branches multiple reasoning paths and picks the best.',
  },
  'role-prompt': {
    label: 'Role / Persona',
    hint: 'Adopts a specific expert persona before answering.',
  },
  'self-consistency': {
    label: 'Self-consistency',
    hint: 'Samples multiple CoT runs and majority-votes the answer.',
  },
  react: { label: 'ReAct', hint: 'Interleaves reasoning steps with tool actions.' },
  rag: { label: 'RAG', hint: 'Retrieves grounding context before generation.' },
  'meta-prompt': { label: 'Meta-prompt', hint: 'A prompt that writes or refines other prompts.' },
  reflexion: { label: 'Reflexion', hint: 'Self-critique loop that rewrites earlier output.' },
  'plan-and-solve': { label: 'Plan-and-Solve', hint: 'Outlines a plan, then executes each step.' },
  other: { label: 'Other', hint: 'Custom or hybrid technique.' },
}

// ===========================================================================
// Difficulty / License
// ===========================================================================

export const Difficulty = z.enum(['beginner', 'intermediate', 'advanced'])
export type Difficulty = z.infer<typeof Difficulty>

export const License = z.enum(['MIT', 'Apache-2.0', 'CC-BY-4.0', 'CC0', 'Proprietary'])
export type License = z.infer<typeof License>

// ===========================================================================
// Category
// ===========================================================================

export const CATEGORIES = [
  'Coding',
  'Writing',
  'Marketing',
  'Productivity',
  'Agents',
  'Cursor Rules',
  'MCP',
  'Data',
  'Design',
  'Research',
  'Education',
  'DevOps',
  'Security',
  'Other',
] as const
export const Category = z.enum(CATEGORIES)
export type Category = z.infer<typeof Category>

// ===========================================================================
// Sort
// ===========================================================================

export const SortKey = z.enum(['newest', 'trending', 'top'])
export type SortKey = z.infer<typeof SortKey>

export const ListingSignal = z.enum(['reviewed', 'used', 'multi-model', 'fresh'])
export type ListingSignal = z.infer<typeof ListingSignal>

const ListingSignalField = z.preprocess((value) => {
  if (value == null || value === '') return []
  const raw = Array.isArray(value) ? value : [value]
  return raw
    .flatMap((item) => (typeof item === 'string' ? item.split(',') : item))
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter(Boolean)
}, z.array(ListingSignal).default([]))

// ===========================================================================
// Auth
// ===========================================================================

export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/i, 'letters, digits, underscore only'),
  password: z.string().min(6).max(72),
})
export type RegisterInput = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const UserDto = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  bio: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  isAdmin: z.boolean().optional(),
  balanceCents: z.number().int().nonnegative(),
  createdAt: z.string(),
})
export type UserDto = z.infer<typeof UserDto>

export const AuthResponse = z.object({
  token: z.string(),
  user: UserDto,
})
export type AuthResponse = z.infer<typeof AuthResponse>

// ===========================================================================
// Listings — create / update / query / read
// ===========================================================================

/** Either a string (csv) coming over the wire OR an array — normalize on
 *  the server to a string for storage. */
const ModelsField = z
  .union([
    z.string().transform((s) =>
      s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    ),
    z.array(z.string()),
  ])
  .pipe(z.array(ModelSlug).min(1, 'at least one model'))
  .transform((arr) => Array.from(new Set(arr)))

export const CreateListingSchema = z.object({
  title: z.string().min(3).max(120),
  type: ListingType,
  description: z.string().min(10).max(500),
  body: z.string().min(10).max(50_000),
  category: Category,
  tags: z.string().max(200).default(''),
  models: ModelsField,
  technique: PromptTechnique.optional().nullable(),
  difficulty: Difficulty.default('intermediate'),
  license: License.default('MIT'),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'semver')
    .default('1.0.0'),
  priceCents: z.number().int().min(0).max(999_900),
  coverEmoji: z.string().min(1).max(8).default('✨'),
})
export type CreateListingInput = z.infer<typeof CreateListingSchema>

export const UpdateListingSchema = CreateListingSchema.partial()
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>

export const ListingQuerySchema = z.object({
  type: ListingType.optional(),
  category: Category.optional(),
  q: z.string().optional(),
  model: ModelSlug.optional(),
  vendor: z.string().optional(),
  technique: PromptTechnique.optional(),
  difficulty: Difficulty.optional(),
  signal: ListingSignalField.default([]),
  sort: SortKey.default('newest'),
  free: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
})
export type ListingQueryInput = z.infer<typeof ListingQuerySchema>

export const AuthorSummary = z.object({
  id: z.string(),
  username: z.string(),
})

export const ListingCard = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  type: ListingType,
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  models: z.array(z.string()),
  technique: PromptTechnique.nullable().optional(),
  difficulty: Difficulty,
  license: License,
  version: z.string(),
  priceCents: z.number().int(),
  coverEmoji: z.string(),
  downloads: z.number().int(),
  author: AuthorSummary,
  avgRating: z.number(),
  reviewCount: z.number().int(),
  createdAt: z.string(),
})
export type ListingCard = z.infer<typeof ListingCard>

export const ListingFull = ListingCard.extend({
  previewBody: z.string(),
  body: z.string().nullable(),
  updatedAt: z.string(),
})
export type ListingFull = z.infer<typeof ListingFull>

export const ListingListResponse = z.object({
  items: z.array(ListingCard),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
})
export type ListingListResponse = z.infer<typeof ListingListResponse>

// ===========================================================================
// Reviews
// ===========================================================================

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>

export const CreateReviewReplySchema = z.object({
  body: z.string().trim().min(1).max(1000),
})
export type CreateReviewReplyInput = z.infer<typeof CreateReviewReplySchema>

export const ReviewReplyDto = z.object({
  id: z.string(),
  body: z.string(),
  user: AuthorSummary,
  createdAt: z.string(),
})
export type ReviewReplyDto = z.infer<typeof ReviewReplyDto>

export const ReviewDto = z.object({
  id: z.string(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  user: AuthorSummary,
  createdAt: z.string(),
  replies: z.array(ReviewReplyDto).default([]),
})
export type ReviewDto = z.infer<typeof ReviewDto>

// ===========================================================================
// Purchases / Wallet
// ===========================================================================

export const PurchaseResponse = z.object({
  purchase: z.object({
    id: z.string(),
    pricePaidCents: z.number().int(),
    grossAmountCents: z.number().int(),
    sellerNetCents: z.number().int(),
    platformFeeCents: z.number().int(),
    createdAt: z.string(),
  }),
  body: z.string(),
})
export type PurchaseResponse = z.infer<typeof PurchaseResponse>

export const RevenueSettingsSchema = z.object({
  platformFeeBps: z.number().int().min(0).max(10_000),
  platformFeePercent: z.number().min(0).max(100),
  premiumFeeBps: z.number().int().min(0).max(10_000),
  premiumFeePercent: z.number().min(0).max(100),
  ultraPremiumFeeBps: z.number().int().min(0).max(10_000),
  ultraPremiumFeePercent: z.number().min(0).max(100),
  ultraPremiumThresholdCents: z.number().int().nonnegative(),
  premiumThresholdCents: z.number().int().nonnegative(),
  platformFeeFloorCents: z.number().int().nonnegative(),
})
export type RevenueSettings = z.infer<typeof RevenueSettingsSchema>

export const RevenueSettingHistoryItemSchema = z.object({
  key: z.string(),
  value: z.number().int().nonnegative(),
  updatedAt: z.string().nullable(),
})
export type RevenueSettingHistoryItem = z.infer<typeof RevenueSettingHistoryItemSchema>

export const RevenueSettingsHistorySchema = z.array(RevenueSettingHistoryItemSchema)
export type RevenueSettingsHistory = z.infer<typeof RevenueSettingsHistorySchema>

export const RevenueTierBreakdownSchema = z.object({
  freeOrders: z.number().int().nonnegative(),
  baseOrders: z.number().int().nonnegative(),
  premiumOrders: z.number().int().nonnegative(),
  ultraPremiumOrders: z.number().int().nonnegative(),
  freeGrossCents: z.number().int().nonnegative(),
  baseGrossCents: z.number().int().nonnegative(),
  premiumGrossCents: z.number().int().nonnegative(),
  ultraPremiumGrossCents: z.number().int().nonnegative(),
  freePlatformFeeCents: z.number().int().nonnegative(),
  basePlatformFeeCents: z.number().int().nonnegative(),
  premiumPlatformFeeCents: z.number().int().nonnegative(),
  ultraPremiumPlatformFeeCents: z.number().int().nonnegative(),
  freeSellerNetCents: z.number().int().nonnegative(),
  baseSellerNetCents: z.number().int().nonnegative(),
  premiumSellerNetCents: z.number().int().nonnegative(),
  ultraPremiumSellerNetCents: z.number().int().nonnegative(),
})
export type RevenueTierBreakdown = z.infer<typeof RevenueTierBreakdownSchema>

export const TopCreatorRevenueSchema = z.object({
  creatorId: z.string(),
  username: z.string(),
  listingCount: z.number().int().nonnegative(),
  salesCount: z.number().int().nonnegative(),
  grossRevenueCents: z.number().int().nonnegative(),
  sellerNetCents: z.number().int().nonnegative(),
  platformFeeCents: z.number().int().nonnegative(),
})
export type TopCreatorRevenue = z.infer<typeof TopCreatorRevenueSchema>

export const AdminRevenueSummarySchema = z.object({
  totalPurchases: z.number().int().nonnegative(),
  paidPurchases: z.number().int().nonnegative(),
  freePurchases: z.number().int().nonnegative(),
  totalGrossCents: z.number().int().nonnegative(),
  totalSellerNetCents: z.number().int().nonnegative(),
  totalPlatformFeeCents: z.number().int().nonnegative(),
  tierBreakdown: RevenueTierBreakdownSchema,
  topCreators: z.array(TopCreatorRevenueSchema),
})
export type AdminRevenueSummary = z.infer<typeof AdminRevenueSummarySchema>

export const TopupSchema = z.object({
  amountCents: z.number().int().min(100).max(100_000),
})
export type TopupInput = z.infer<typeof TopupSchema>

// ===========================================================================
// View helpers (also re-exported by the web app)
// ===========================================================================

export const typeLabel = (t: ListingType) => LISTING_TYPE_META[t].label
export const typeColor = (t: ListingType) => LISTING_TYPE_META[t].pill
export const typeGradient = (t: ListingType) => LISTING_TYPE_META[t].gradient
export const typeEmoji = (t: ListingType) => LISTING_TYPE_META[t].emoji

export const formatPrice = (cents: number) =>
  cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`

const _usdFmt = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatDollars = (cents: number) => {
  const dollars = (Number.isFinite(cents) ? cents : 0) / 100
  try {
    return `$${_usdFmt.format(dollars)}`
  } catch {
    return `$${dollars.toFixed(2)}`
  }
}

export const modelLabel = (slug: string) => MODEL_BY_SLUG[slug]?.label ?? slug
export const modelVendor = (slug: string) => MODEL_BY_SLUG[slug]?.vendor ?? ''
export const modelFamily = (slug: string) => MODEL_BY_SLUG[slug]?.family ?? ''
