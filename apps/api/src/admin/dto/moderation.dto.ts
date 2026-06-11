import { createZodDto } from 'nestjs-zod'
import { MemberSuspensionSchema, ModerationVisibilitySchema } from '@promptmarket/shared'

export class ModerationVisibilityDto extends createZodDto(ModerationVisibilitySchema) {}

export class MemberSuspensionDto extends createZodDto(MemberSuspensionSchema) {}
