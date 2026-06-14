import { CreateDiscussionCommentSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class CreateCommentDto extends createZodDto(CreateDiscussionCommentSchema) {}
