import { ListingQuerySchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class QueryListingsDto extends createZodDto(ListingQuerySchema) {}
