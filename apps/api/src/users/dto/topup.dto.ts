import { createZodDto } from 'nestjs-zod';
import { TopupSchema } from '@promptmarket/shared';

export class TopupDto extends createZodDto(TopupSchema) {}
