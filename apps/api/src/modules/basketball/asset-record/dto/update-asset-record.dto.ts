import { PartialType } from '@nestjs/mapped-types'

import { CreateAssetRecordDto } from './create-asset-record.dto'

export class UpdateAssetRecordDto extends PartialType(CreateAssetRecordDto) {}
