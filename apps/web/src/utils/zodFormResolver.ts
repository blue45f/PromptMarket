import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

export function zodFormResolver<TInput extends FieldValues, TOutput extends FieldValues>(
  schema: z.ZodType<TOutput, TInput>
): Resolver<TInput, unknown, TOutput> {
  return standardSchemaResolver(schema)
}
