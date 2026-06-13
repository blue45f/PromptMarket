import { DiscussionThreadQuerySchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class QueryThreadsDto extends createZodDto(DiscussionThreadQuerySchema) {}
