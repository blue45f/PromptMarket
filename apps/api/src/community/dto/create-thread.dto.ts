import { CreateDiscussionThreadSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class CreateThreadDto extends createZodDto(CreateDiscussionThreadSchema) {}
