import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

// Use the Zod-specific resolver rather than the Standard Schema one: it preserves
// the Zod issue code on `error.type` (e.g. 'too_small', 'too_big', 'invalid_format'),
// which the forms rely on to render rule-specific, accessible validation messages.
// The Standard Schema resolver sets `type: ''`, collapsing every error to the
// generic branch and breaking that mapping.
export function zodFormResolver<TInput extends FieldValues, TOutput extends FieldValues>(
  schema: z.ZodType<TOutput, TInput>
): Resolver<TInput, unknown, TOutput> {
  return zodResolver(schema as unknown as Parameters<typeof zodResolver>[0]) as Resolver<
    TInput,
    unknown,
    TOutput
  >
}
