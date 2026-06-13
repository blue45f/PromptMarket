import { LoginSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class LoginDto extends createZodDto(LoginSchema) {}
