import { createZodDto } from 'nestjs-zod';
import { CreateReviewSchema } from '@promptmarket/shared';

export class CreateReviewDto extends createZodDto(CreateReviewSchema) {}
