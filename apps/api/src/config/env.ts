import { z } from 'zod'

/**
 * Zod schema describing the environment variables this API reads.
 *
 * Validation is intentionally NON-FATAL: {@link validateEnv} only warns and
 * never throws/exits. Existing `process.env` reads keep their own fallbacks,
 * so a misconfigured env surfaces as a startup warning rather than a crash —
 * we must never break a live boot just for stricter validation.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  SITE_ORIGIN: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Secret values that are fine for local dev but must never reach production.
 * Matched case-insensitively against the raw env value.
 */
const INSECURE_DEFAULTS = new Set(
  [
    'dev-only-change-me-please',
    'dev-secret-change-me',
    'mypassword',
    'change-me-in-production',
  ].map((v) => v.toLowerCase())
)

const SECRET_KEYS = ['JWT_SECRET'] as const

/**
 * Validate `process.env` against {@link envSchema} and warn about problems.
 * Never throws and never exits — safe to call during bootstrap.
 */
export function validateEnv(
  env: NodeJS.ProcessEnv = process.env,
  log: Pick<Console, 'warn' | 'error'> = console
): void {
  const result = envSchema.safeParse(env)

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    log.warn(`[env] Environment validation found issues (continuing anyway):\n${issues}`)
  }

  if (env.NODE_ENV === 'production') {
    for (const key of SECRET_KEYS) {
      const value = env[key]?.trim().toLowerCase()
      if (value && INSECURE_DEFAULTS.has(value)) {
        log.error(
          `\n${'='.repeat(72)}\n` +
            `[env] SECURITY WARNING: ${key} is set to a known insecure default in\n` +
            `production. Set a strong, unique secret before exposing this service.\n` +
            `${'='.repeat(72)}\n`
        )
      }
    }
  }
}
