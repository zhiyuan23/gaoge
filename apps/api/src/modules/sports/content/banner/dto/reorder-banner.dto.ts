import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator'

class ReorderBannerItemDto {
  @Type(() => Number)
  @IsInt()
  id: number

  @Type(() => Number)
  @IsInt()
  sort: number
}

export class ReorderBannerDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderBannerItemDto)
  items: ReorderBannerItemDto[]
}
