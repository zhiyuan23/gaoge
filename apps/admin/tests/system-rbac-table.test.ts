import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isActionLoading,
  isActionVisible,
  normalizeActionColumnWidth,
  normalizeTableColumnWidth,
  partitionActions,
} from '../src/components/common/EsTable/action.ts'

test('fixedWidth keeps an explicitly fixed table column width', () => {
  assert.deepEqual(normalizeTableColumnWidth({ label: '状态', prop: 'status', fixedWidth: 100 }), {
    label: '状态',
    prop: 'status',
    width: 100,
  })
})

test('regular width remains responsive through minWidth semantics', () => {
  assert.deepEqual(normalizeTableColumnWidth({ label: '名称', prop: 'name', width: 180 }), {
    label: '名称',
    prop: 'name',
    minWidth: 180,
  })
  assert.equal(normalizeActionColumnWidth({ label: '操作', prop: 'actions' }).minWidth, 120)
})

test('action overflow reserves the last inline slot for a dropdown', () => {
  const actions = [
    { key: 'edit', label: '编辑' },
    { key: 'disable', label: '停用' },
    { key: 'delete', label: '删除' },
  ]
  assert.deepEqual(partitionActions(actions, 2), {
    inlineActions: [actions[0]],
    secondaryActions: [actions[1], actions[2]],
    useDropdown: true,
  })
})

test('all-mode authorization and row loading are resolved independently', () => {
  const action = {
    key: 'edit',
    label: '编辑',
    auth: ['system.role.update', 'system.role.assign-permission'],
    authMatch: 'all' as const,
    loading: (row: { pending: boolean }) => row.pending,
  }
  const granted = new Set(['system.role.update', 'system.role.assign-permission'])
  assert.equal(
    isActionVisible(action, (value) => granted.has(String(value))),
    true,
  )
  assert.equal(
    isActionVisible(action, (value) => String(value) === 'system.role.update'),
    false,
  )
  assert.equal(isActionLoading(action, { pending: true }), true)
})
