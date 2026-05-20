import { createZodDto } from 'nestjs-zod';
import { UpdateListingSchema } from '@promptmarket/shared';

export class UpdateListingDto extends createZodDto(UpdateListingSchema) {}
