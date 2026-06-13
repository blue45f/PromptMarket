import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'

import { AdminGuard } from '../auth/admin.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

import { AdminService } from './admin.service'
import { UpdateRevenueSettingsDto } from './dto/update-revenue-settings.dto'

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @Get('revenue/settings')
  @ApiOperation({ summary: 'Get platform revenue settings' })
  @ApiResponse({ status: 200, description: 'Current revenue settings.' })
  getRevenueSettings() {
    return this.admin.getRevenueSettings()
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @Get('revenue/settings/history')
  @ApiOperation({ summary: 'Get platform revenue settings history metadata' })
  @ApiResponse({ status: 200, description: 'Revenue setting history metadata.' })
  getRevenueSettingsHistory() {
    return this.admin.getRevenueSettingsHistory()
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @Patch('revenue/settings')
  @ApiOperation({ summary: 'Update platform revenue settings' })
  @ApiResponse({ status: 200, description: 'Updated revenue settings.' })
  updateRevenueSettings(@Body() body: UpdateRevenueSettingsDto) {
    return this.admin.updateRevenueSettings(body)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @Get('revenue/summary')
  @ApiOperation({ summary: 'Get platform revenue summary + top creators by payout' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of top creators to include',
    type: Number,
  })
  getRevenueSummary(@Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : 10
    return this.admin.getRevenueSummary(Number.isFinite(parsed) ? parsed : 10)
  }
}
