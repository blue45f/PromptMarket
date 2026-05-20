import { z } from 'zod';

// ---------- Enums ----------
export const ListingType = z.enum(['PROMPT', 'CLAUDE_MD', 'AGENT_MD']);
export type ListingType = z.infer<typeof ListingType>;

export const SortKey = z.enum(['newest', 'trending', 'top']);
export type SortKey = z.infer<typeof SortKey>;

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
  'Other',
] as const;
export const Category = z.enum(CATEGORIES);
export type Category = z.infer<typeof Category>;

// ---------- Auth ----------
export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/i, 'letters, digits, underscore only'),
  password: z.string().min(6).max(72),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const UserDto = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  bio: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  balanceCents: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type UserDto = z.infer<typeof UserDto>;

export const AuthResponse = z.object({
  token: z.string(),
  user: UserDto,
});
export type AuthResponse = z.infer<typeof AuthResponse>;

// ---------- Listings ----------
export const CreateListingSchema = z.object({
  title: z.string().min(3).max(120),
  type: ListingType,
  description: z.string().min(10).max(500),
  body: z.string().min(10).max(20000),
  category: Category,
  tags: z.string().max(200).default(''),
  model: z.string().max(50).optional().nullable(),
  priceCents: z.number().int().min(0).max(999900),
  coverEmoji: z.string().min(1).max(8).default('✨'),
});
export type CreateListingInput = z.infer<typeof CreateListingSchema>;

export const UpdateListingSchema = CreateListingSchema.partial();
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;

export const ListingQuerySchema = z.object({
  type: ListingType.optional(),
  category: Category.optional(),
  q: z.string().optional(),
  model: z.string().optional(),
  sort: SortKey.default('newest'),
  free: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});
export type ListingQueryInput = z.infer<typeof ListingQuerySchema>;

export const AuthorSummary = z.object({
  id: z.string(),
  username: z.string(),
});

export const ListingCard = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  type: ListingType,
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  model: z.string().nullable(),
  priceCents: z.number().int(),
  coverEmoji: z.string(),
  downloads: z.number().int(),
  author: AuthorSummary,
  avgRating: z.number(),
  reviewCount: z.number().int(),
  createdAt: z.string(),
});
export type ListingCard = z.infer<typeof ListingCard>;

export const ListingFull = ListingCard.extend({
  previewBody: z.string(),
  body: z.string().nullable(),
  updatedAt: z.string(),
});
export type ListingFull = z.infer<typeof ListingFull>;

export const ListingListResponse = z.object({
  items: z.array(ListingCard),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
});
export type ListingListResponse = z.infer<typeof ListingListResponse>;

// ---------- Reviews ----------
export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export const ReviewDto = z.object({
  id: z.string(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  user: AuthorSummary,
  createdAt: z.string(),
});
export type ReviewDto = z.infer<typeof ReviewDto>;

// ---------- Purchases / Wallet ----------
export const PurchaseResponse = z.object({
  purchase: z.object({
    id: z.string(),
    pricePaidCents: z.number().int(),
    createdAt: z.string(),
  }),
  body: z.string(),
});
export type PurchaseResponse = z.infer<typeof PurchaseResponse>;

export const TopupSchema = z.object({
  amountCents: z.number().int().min(100).max(100_000),
});
export type TopupInput = z.infer<typeof TopupSchema>;

// ---------- Helpers ----------
export const typeLabel = (t: ListingType) =>
  ({ PROMPT: 'Prompt', CLAUDE_MD: 'CLAUDE.md', AGENT_MD: 'agent.md' }[t]);

export const typeColor = (t: ListingType) =>
  ({
    PROMPT: 'bg-blue-100 text-blue-700',
    CLAUDE_MD: 'bg-purple-100 text-purple-700',
    AGENT_MD: 'bg-emerald-100 text-emerald-700',
  }[t]);

export const formatPrice = (cents: number) =>
  cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;
