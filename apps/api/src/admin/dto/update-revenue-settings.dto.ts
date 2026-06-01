import { createZodDto } from 'nestjs-zod'
import { RevenueSettingsSchema } from '@promptmarket/shared'

const UpdateRevenueSettingsSchema = RevenueSettingsSchema.pick({
  platformFeeBps: true,
  premiumFeeBps: true,
  premiumThresholdCents: true,
  platformFeeFloorCents: true,
}).partial()

export class UpdateRevenueSettingsDto extends createZodDto(UpdateRevenueSettingsSchema) {}
