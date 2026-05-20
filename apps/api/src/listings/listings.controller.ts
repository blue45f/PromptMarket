import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'List/search listings with filters' })
  list(@Query() query: QueryListingsDto) {
    return this.listings.list(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Marketplace stats (total listings, downloads, creators). Cached 30s.',
  })
  stats() {
    return this.listings.stats();
  }

  @Get('related/:id')
  @ApiOperation({
    summary: 'Related listings sharing type or category, excluding self.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  related(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? parseInt(limit, 10) : 4;
    const n = Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
    return this.listings.related(id, n);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':slug')
  @ApiOperation({ summary: 'Get a listing by slug (body shown if owner/buyer/free)' })
  getBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.listings.getBySlug(slug, user?.id ?? null);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new listing' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListingDto) {
    return this.listings.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update an owned listing' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listings.update(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an owned listing' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listings.remove(user.id, id);
  }
}
