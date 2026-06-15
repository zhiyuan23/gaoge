import { Module } from '@nestjs/common'

import { AssetRecordController } from './asset-record.controller'
import { AssetRecordService } from './asset-record.service'

@Module({
  controllers: [AssetRecordController],
  providers: [AssetRecordService],
})
export class AssetRecordModule {}
