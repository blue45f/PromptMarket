import { createZodDto } from 'nestjs-zod'
import { CreateDiscussionCommentSchema } from '@promptmarket/shared'

export class CreateCommentDto extends createZodDto(CreateDiscussionCommentSchema) {}
