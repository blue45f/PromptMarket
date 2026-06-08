import { createZodDto } from 'nestjs-zod'
import { GoogleAuthSchema } from '@promptmarket/shared'

export class GoogleAuthDto extends createZodDto(GoogleAuthSchema) {}
