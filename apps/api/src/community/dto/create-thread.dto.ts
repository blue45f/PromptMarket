import { createZodDto } from 'nestjs-zod'
import { CreateDiscussionThreadSchema } from '@promptmarket/shared'

export class CreateThreadDto extends createZodDto(CreateDiscussionThreadSchema) {}
