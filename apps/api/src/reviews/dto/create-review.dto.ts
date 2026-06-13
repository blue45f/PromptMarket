import { CreateReviewSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class CreateReviewDto extends createZodDto(CreateReviewSchema) {}
