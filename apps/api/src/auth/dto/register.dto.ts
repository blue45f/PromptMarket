import { createZodDto } from 'nestjs-zod';
import { RegisterSchema } from '@promptmarket/shared';

export class RegisterDto extends createZodDto(RegisterSchema) {}
