import { CreateListingSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class CreateListingDto extends createZodDto(CreateListingSchema) {}
