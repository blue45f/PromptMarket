import { createZodDto } from 'nestjs-zod';
import { CreateListingSchema } from '@promptmarket/shared';

export class CreateListingDto extends createZodDto(CreateListingSchema) {}
