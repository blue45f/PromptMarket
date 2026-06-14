import { GoogleAuthSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class GoogleAuthDto extends createZodDto(GoogleAuthSchema) {}
