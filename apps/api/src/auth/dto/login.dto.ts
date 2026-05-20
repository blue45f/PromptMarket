import { createZodDto } from 'nestjs-zod';
import { LoginSchema } from '@promptmarket/shared';

export class LoginDto extends createZodDto(LoginSchema) {}
