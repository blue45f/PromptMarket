import { createZodDto } from 'nestjs-zod';
import { ListingQuerySchema } from '@promptmarket/shared';

export class QueryListingsDto extends createZodDto(ListingQuerySchema) {}
