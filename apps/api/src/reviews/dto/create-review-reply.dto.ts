import { createZodDto } from 'nestjs-zod'
import { CreateReviewReplySchema } from '@promptmarket/shared'

export class CreateReviewReplyDto extends createZodDto(CreateReviewReplySchema) {}
