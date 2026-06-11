import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateMessageBoardPostDto } from './dto/create-message-board-post.dto'
import { MessageBoardPostListDto } from './dto/message-board-post-list.dto'
import { UpdateMessageBoardPostDto } from './dto/update-message-board-post.dto'
import { MessageBoardPostService } from './message-board-post.service'

@Controller('content/message-board-posts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessageBoardPostController {
  constructor(private readonly messageBoardPostService: MessageBoardPostService) {}

  @Get()
  @RequirePermissions('content.messageBoardPost.view')
  findAll(@Query() query: MessageBoardPostListDto) {
    return this.messageBoardPostService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions('content.messageBoardPost.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messageBoardPostService.findOne(id)
  }

  @Post()
  @RequirePermissions('content.messageBoardPost.create')
  create(@Body() dto: CreateMessageBoardPostDto) {
    return this.messageBoardPostService.create(dto)
  }

  @Patch(':id')
  @RequirePermissions('content.messageBoardPost.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMessageBoardPostDto) {
    return this.messageBoardPostService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('content.messageBoardPost.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.messageBoardPostService.remove(id)
  }

  @Post(':id/publish')
  @RequirePermissions('content.messageBoardPost.publish')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.messageBoardPostService.publish(id)
  }
}
