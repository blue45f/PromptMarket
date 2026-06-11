import { createZodDto } from 'nestjs-zod'
import { SendMessageSchema } from '@promptmarket/shared'

export class SendMessageDto extends createZodDto(SendMessageSchema) {}
