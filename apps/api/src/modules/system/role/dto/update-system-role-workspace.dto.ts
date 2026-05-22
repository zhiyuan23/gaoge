import { Transform, Type } from 'class-transformer'
import { IsArray, IsInt, IsObject, IsOptional } from 'class-validator'

export class UpdateSystemRoleWorkspaceDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  menuIds: number[]

  @IsObject()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, ids]) => [
        key,
        Array.isArray(ids)
          ? ids.map((item) => Number(item)).filter((item) => Number.isInteger(item))
          : [],
      ]),
    )
  })
  menuPermissionIdsByMenu: Record<number, number[]>

  @IsArray()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ each: true })
  globalPermissionIds?: number[]
}
