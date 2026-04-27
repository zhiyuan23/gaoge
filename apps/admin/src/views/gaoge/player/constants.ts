import type { Player } from '@/api/players'
import type { SearchField, SearchFormData, SearchOption } from '@/components/common/EsSearch/types'
import type { TableColumn } from '@/constants/basic-data/types'

import { getPlayerStatusLabel } from './formatters'

export interface PlayerSearch extends SearchFormData {
  keyword: string
  subTeam: string
  position: string
  status: string
}

export interface PlayerFormModel {
  id?: number
  openid: string
  nickname: string
  realName: string
  avatarUrl: string
  subTeam: string
  birthDate: string
  isAdmin: boolean
  position: string
  jerseySize: string
  status: string
  remark: string
}

export interface PlayerSearchFieldContext {
  subTeamOptions: () => SearchOption[]
  positionOptions: () => SearchOption[]
  statusOptions: () => SearchOption[]
}

export const PLAYER_DEFAULT_SEARCH: PlayerSearch = {
  keyword: '',
  subTeam: '',
  position: '',
  status: '',
}

export const PLAYER_STATUS_OPTIONS: SearchOption[] = [
  { label: '正常', value: 'active' },
  { label: '停用', value: 'inactive' },
]

// 表格列集中维护，页面只负责插槽渲染和数据请求。
export const PLAYER_TABLE_COLUMNS: TableColumn[] = [
  { label: '头像', prop: 'avatarUrl', width: 88, slot: 'avatar', align: 'center' },
  { label: '昵称', prop: 'nickname', width: 140 },
  { label: '真实姓名', prop: 'realName', width: 120 },
  { label: 'OpenID', prop: 'openid', width: 220 },
  { label: '分队', prop: 'subTeam', width: 120 },
  { label: '位置', prop: 'position', width: 120 },
  { label: '球衣尺码', prop: 'jerseySize', width: 110, align: 'center' },
  { label: '状态', prop: 'status', width: 110, slot: 'status', align: 'center' },
  { label: '管理员', prop: 'isAdmin', width: 100, slot: 'isAdmin', align: 'center' },
  { label: '生日', prop: 'birthDate', width: 120, slot: 'birthDate', align: 'center' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  { label: '备注', prop: 'remark', width: 180 },
  { label: '操作', prop: 'actions', width: 160, fixed: 'right', slot: 'actions', align: 'center' },
]

// 新增和重置编辑表单共用同一个空模型，避免各处默认值不一致。
export function createEmptyPlayerForm(): PlayerFormModel {
  return {
    openid: '',
    nickname: '',
    realName: '',
    avatarUrl: '',
    subTeam: '',
    birthDate: '',
    isAdmin: false,
    position: '',
    jerseySize: '',
    status: 'active',
    remark: '',
  }
}

// 编辑时把接口数据转换成表单需要的字符串日期和空值格式。
export function createPlayerFormFromRow(row: Player): PlayerFormModel {
  return {
    id: row.id,
    openid: row.openid,
    nickname: row.nickname,
    realName: row.realName ?? '',
    avatarUrl: row.avatarUrl ?? '',
    subTeam: row.subTeam ?? '',
    birthDate: row.birthDate ? row.birthDate.slice(0, 10) : '',
    isAdmin: row.isAdmin,
    position: row.position ?? '',
    jerseySize: row.jerseySize ?? '',
    status: row.status ?? 'active',
    remark: row.remark ?? '',
  }
}

// 筛选字段使用工厂函数接收动态选项，后续其他列表页可复用同样模式。
export function createPlayerSearchFields(ctx: PlayerSearchFieldContext): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '昵称 / 姓名 / OpenID / 位置',
      span: 8,
    },
    {
      key: 'subTeam',
      label: '分队',
      type: 'select',
      placeholder: '全部',
      options: ctx.subTeamOptions,
      props: {
        filterable: true,
      },
    },
    {
      key: 'position',
      label: '位置',
      type: 'select',
      placeholder: '全部',
      options: ctx.positionOptions,
      props: {
        filterable: true,
      },
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: () =>
        ctx.statusOptions().map((item) => ({
          ...item,
          label: getPlayerStatusLabel(String(item.value)),
        })),
      props: {
        filterable: true,
      },
    },
  ]
}
