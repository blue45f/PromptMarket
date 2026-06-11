import { createZodDto } from 'nestjs-zod'
import { DiscussionThreadQuerySchema } from '@promptmarket/shared'

export class QueryThreadsDto extends createZodDto(DiscussionThreadQuerySchema) {}
