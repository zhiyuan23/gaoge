import { PartialType } from '@nestjs/mapped-types'

import { CreateRumorPostDto } from './create-rumor-post.dto'

export class UpdateRumorPostDto extends PartialType(CreateRumorPostDto) {}
