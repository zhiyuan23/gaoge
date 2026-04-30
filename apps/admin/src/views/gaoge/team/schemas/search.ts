import type { SearchField } from '@/components/common/EsSearch/types'

export function createTeamSearchFields(): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '请输入球队名称',
    },
  ]
}
