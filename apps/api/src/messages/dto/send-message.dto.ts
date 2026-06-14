import { SendMessageSchema } from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class SendMessageDto extends createZodDto(SendMessageSchema) {}
