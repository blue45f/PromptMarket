import { StartMessageThreadSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class StartThreadDto extends createZodDto(StartMessageThreadSchema) {}
