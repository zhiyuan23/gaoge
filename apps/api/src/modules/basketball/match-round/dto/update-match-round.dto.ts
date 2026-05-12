import { PartialType } from '@nestjs/mapped-types'

import { CreateMatchRoundDto } from './create-match-round.dto'

export class UpdateMatchRoundDto extends PartialType(CreateMatchRoundDto) {}
