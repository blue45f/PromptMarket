import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ModerationService } from './moderation.service'
import { AdminGuard } from '../auth/admin.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, AuthUser } from '../auth/current-user.decorator'
import { MemberSuspensionDto, ModerationVisibilityDto } from './dto/moderation.dto'

@ApiTags('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
@Controller('admin')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get('threads')
  @ApiOperation({ summary: 'Discussion threads for moderation (hidden included by default)' })
  @ApiQuery({ name: 'includeHidden', required: false, type: Boolean })
  listThreads(@Query('includeHidden') includeHidden?: string) {
    return this.moderation.listThreads(includeHidden !== 'false')
  }

  @Patch('threads/:id/visibility')
  @ApiOperation({ summary: 'Hide / unhide a discussion thread' })
  setThreadVisibility(@Param('id') id: string, @Body() dto: ModerationVisibilityDto) {
    return this.moderation.setThreadVisibility(id, dto.hidden)
  }

  @Delete('threads/:id')
  @ApiOperation({ summary: 'Permanently delete a discussion thread' })
  deleteThread(@Param('id') id: string) {
    return this.moderation.deleteThread(id)
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Reviews for moderation (hidden included by default)' })
  @ApiQuery({ name: 'includeHidden', required: false, type: Boolean })
  listReviews(@Query('includeHidden') includeHidden?: string) {
    return this.moderation.listReviews(includeHidden !== 'false')
  }

  @Patch('reviews/:id/visibility')
  @ApiOperation({ summary: 'Hide / unhide a review' })
  setReviewVisibility(@Param('id') id: string, @Body() dto: ModerationVisibilityDto) {
    return this.moderation.setReviewVisibility(id, dto.hidden)
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Permanently delete a review with its replies/attachments' })
  deleteReview(@Param('id') id: string) {
    return this.moderation.deleteReview(id)
  }

  @Get('attachments')
  @ApiOperation({ summary: 'Attachments for one thread (incl. comments) or review' })
  @ApiQuery({ name: 'threadId', required: false, type: String })
  @ApiQuery({ name: 'reviewId', required: false, type: String })
  listAttachments(@Query('threadId') threadId?: string, @Query('reviewId') reviewId?: string) {
    return this.moderation.listAttachments({ threadId, reviewId })
  }

  @Delete('attachments/:id')
  @ApiOperation({ summary: 'Remove a single attachment from any post' })
  deleteAttachment(@Param('id') id: string) {
    return this.moderation.deleteAttachment(id)
  }

  @Get('members')
  @ApiOperation({ summary: 'Member directory with activity counts' })
  @ApiQuery({ name: 'q', required: false, type: String })
  listMembers(@Query('q') q?: string) {
    return this.moderation.listMembers(q)
  }

  @Patch('members/:id/suspension')
  @ApiOperation({ summary: 'Suspend / reinstate a member' })
  setSuspension(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: MemberSuspensionDto
  ) {
    return this.moderation.setMemberSuspension(user.id, id, dto.suspended)
  }
}
