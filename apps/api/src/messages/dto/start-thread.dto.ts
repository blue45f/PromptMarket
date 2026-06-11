import { createZodDto } from 'nestjs-zod'
import { StartMessageThreadSchema } from '@promptmarket/shared'

export class StartThreadDto extends createZodDto(StartMessageThreadSchema) {}
