import { RegisterSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class RegisterDto extends createZodDto(RegisterSchema) {}
