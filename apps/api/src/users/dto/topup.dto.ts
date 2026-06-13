import { TopupSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class TopupDto extends createZodDto(TopupSchema) {}
