import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { CurrentUser, AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SuspensionGuard } from '../auth/suspension.guard'

import { CreateReviewReplyDto } from './dto/create-review-reply.dto'
import { CreateReviewDto } from './dto/create-review.dto'
import { ReviewsService } from './reviews.service'

@ApiTags('reviews')
@Controller('listings')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get(':id/reviews')
  @ApiOperation({ summary: 'List reviews for a listing' })
  list(@Param('id') id: string) {
    return this.reviews.listForListing(id)
  }

  @UseGuards(JwtAuthGuard, SuspensionGuard)
  @ApiBearerAuth()
  @Post(':id/reviews')
  @ApiOperation({ summary: 'Create a review for a purchased listing' })
  create(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, id, dto)
  }

  @UseGuards(JwtAuthGuard, SuspensionGuard)
  @ApiBearerAuth()
  @Post(':id/reviews/:reviewId/replies')
  @ApiOperation({ summary: 'Reply to a review thread' })
  createReply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: CreateReviewReplyDto
  ) {
    return this.reviews.createReply(user.id, id, reviewId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id/reviews/:reviewId/replies/:replyId')
  @ApiOperation({ summary: 'Soft-delete an own reply (placeholder remains)' })
  deleteReply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Param('replyId') replyId: string
  ) {
    return this.reviews.deleteReply(user, id, reviewId, replyId)
  }
}
