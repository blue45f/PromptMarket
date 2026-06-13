import { UpdateListingSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class UpdateListingDto extends createZodDto(UpdateListingSchema) {}
