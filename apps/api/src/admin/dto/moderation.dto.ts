import {
  CreateForbiddenWordSchema,
  MemberSuspensionSchema,
  ModerationVisibilitySchema,
  UpdateForbiddenWordSchema,
} from '@promptmarket/shared'
import { createZodDto } from 'nestjs-zod'

export class ModerationVisibilityDto extends createZodDto(ModerationVisibilitySchema) {}

export class MemberSuspensionDto extends createZodDto(MemberSuspensionSchema) {}

export class CreateForbiddenWordDto extends createZodDto(CreateForbiddenWordSchema) {}

export class UpdateForbiddenWordDto extends createZodDto(UpdateForbiddenWordSchema) {}
