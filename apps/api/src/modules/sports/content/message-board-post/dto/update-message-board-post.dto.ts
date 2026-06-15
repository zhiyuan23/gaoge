import { PartialType } from '@nestjs/mapped-types'

import { CreateMessageBoardPostDto } from './create-message-board-post.dto'

export class UpdateMessageBoardPostDto extends PartialType(CreateMessageBoardPostDto) {}
