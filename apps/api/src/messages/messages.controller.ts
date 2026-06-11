import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { MessagesService } from './messages.service'
import { StartThreadDto } from './dto/start-thread.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SuspensionGuard } from '../auth/suspension.guard'
import { CurrentUser, AuthUser } from '../auth/current-user.decorator'

@ApiTags('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('threads')
  @ApiOperation({ summary: 'My message inbox (buyer + seller threads)' })
  list(@CurrentUser() user: AuthUser) {
    return this.messages.listThreads(user.id)
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Total unread incoming messages' })
  unread(@CurrentUser() user: AuthUser) {
    return this.messages.unreadCount(user.id)
  }

  @UseGuards(SuspensionGuard)
  @Post('threads')
  @ApiOperation({ summary: 'Ask the seller about a listing (creates/reuses the thread)' })
  start(@CurrentUser() user: AuthUser, @Body() dto: StartThreadDto) {
    return this.messages.startThread(user.id, dto)
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Thread detail — marks incoming messages read' })
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messages.getThread(user.id, id)
  }

  @UseGuards(SuspensionGuard)
  @Post('threads/:id')
  @ApiOperation({ summary: 'Send a message in a thread' })
  send(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.messages.sendMessage(user.id, id, dto)
  }
}
