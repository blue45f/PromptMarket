import { createZodDto } from 'nestjs-zod'
import { RevenueSettingsSchema } from '@promptmarket/shared'

const UpdateRevenueSettingsSchema = RevenueSettingsSchema.pick({
  platformFeeBps: true,
  premiumFeeBps: true,
  ultraPremiumFeeBps: true,
  premiumThresholdCents: true,
  ultraPremiumThresholdCents: true,
  platformFeeFloorCents: true,
}).partial()

export class UpdateRevenueSettingsDto extends createZodDto(UpdateRevenueSettingsSchema) {}
