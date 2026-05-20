import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@ApiTags('reviews')
@Controller('listings')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get(':id/reviews')
  @ApiOperation({ summary: 'List reviews for a listing' })
  list(@Param('id') id: string) {
    return this.reviews.listForListing(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/reviews')
  @ApiOperation({ summary: 'Create a review for a purchased listing' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(user.id, id, dto);
  }
}
