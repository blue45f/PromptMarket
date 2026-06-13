import { CreateReviewReplySchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class CreateReviewReplyDto extends createZodDto(CreateReviewReplySchema) {}
