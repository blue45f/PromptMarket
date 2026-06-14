import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { CurrentUser, AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalAuthGuard } from '../auth/optional-auth.guard'
import { SuspensionGuard } from '../auth/suspension.guard'

import { CommunityService } from './community.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { CreateThreadDto } from './dto/create-thread.dto'
import { QueryThreadsDto } from './dto/query-threads.dto'

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('threads')
  @ApiOperation({ summary: 'List discussion threads, filterable by prompt category' })
  list(@Query() query: QueryThreadsDto) {
    return this.community.listThreads(query)
  }

  @UseGuards(OptionalAuthGuard)
  @Get('threads/:id')
  @ApiOperation({ summary: 'Get one thread with its comment tree' })
  get(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.community.getThread(id, user)
  }

  @UseGuards(JwtAuthGuard, SuspensionGuard)
  @ApiBearerAuth()
  @Post('threads')
  @ApiOperation({ summary: 'Start a discussion thread' })
  createThread(@CurrentUser() user: AuthUser, @Body() dto: CreateThreadDto) {
    return this.community.createThread(user.id, dto)
  }

  @UseGuards(JwtAuthGuard, SuspensionGuard)
  @ApiBearerAuth()
  @Post('threads/:id/comments')
  @ApiOperation({ summary: 'Comment on a thread (parentId → one-level reply)' })
  createComment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto
  ) {
    return this.community.createComment(user.id, id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('comments/:id')
  @ApiOperation({ summary: 'Soft-delete an own comment (placeholder remains)' })
  deleteComment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.community.deleteComment(user, id)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('threads/:id')
  @ApiOperation({ summary: 'Delete an own thread' })
  deleteThread(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.community.deleteThread(user, id)
  }
}
