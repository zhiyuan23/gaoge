import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  ASSET_FILTER_OPTIONS,
  formatAssetCurrency,
  formatAssetSignedAmount,
  getAssetDirectionByFilter,
  getAssetRecordTypeLabel,
  getAssetTotalPage,
} from '../src/pages/football/asset/model.ts'

const pagesJson = JSON.parse(readFileSync(new URL('../src/pages.json', import.meta.url), 'utf8'))
const teamPageSource = readFileSync(new URL('../src/pages/team/index.vue', import.meta.url), 'utf8')
const assetPageSource = readFileSync(
  new URL('../src/pages/football/asset/index.vue', import.meta.url),
  'utf8',
)

test('formats football asset currency and signed amount for miniapp cards', () => {
  assert.equal(formatAssetCurrency(123456), '¥1,234.56')
  assert.equal(formatAssetSignedAmount('income', 123456), '+¥1,234.56')
  assert.equal(formatAssetSignedAmount('expense', 123456), '-¥1,234.56')
})

test('maps football asset filter and record labels for miniapp detail page', () => {
  assert.deepEqual(ASSET_FILTER_OPTIONS, [
    { key: 'all', label: '全部' },
    { key: 'income', label: '收入' },
    { key: 'expense', label: '支出' },
  ])
  assert.equal(getAssetDirectionByFilter('all'), undefined)
  assert.equal(getAssetDirectionByFilter('income'), 'income')
  assert.equal(getAssetDirectionByFilter('expense'), 'expense')
  assert.equal(getAssetRecordTypeLabel('equipment'), '球队装备')
  assert.equal(getAssetRecordTypeLabel('extra_income'), '额外收入')
})

test('computes football asset total pages with a minimum of one page', () => {
  assert.equal(getAssetTotalPage(0, 10), 1)
  assert.equal(getAssetTotalPage(1, 10), 1)
  assert.equal(getAssetTotalPage(21, 10), 3)
})

test('registers the team tab and football asset detail page in miniapp pages config', () => {
  const tabBarEntry = pagesJson.tabBar.list.find((item) => item.pagePath === 'pages/team/index')

  assert.deepEqual(tabBarEntry, {
    text: '球队',
    pagePath: 'pages/team/index',
    iconPath: 'static/images/tabbar/profile.png',
    selectedIconPath: 'static/images/tabbar/profile-active.png',
  })
  assert.equal(
    pagesJson.pages.some((page) => page.path === 'pages/football/asset/index'),
    true,
  )
  assert.equal(
    pagesJson.tabBar.list.some((item) => item.pagePath === 'pages/profile/index'),
    false,
  )
})

test('renders the team overview page as an asset summary entry point', () => {
  assert.match(teamPageSource, /球队资产/)
  assert.match(teamPageSource, /公开球队当前收支总览与历史明细/)
  assert.match(teamPageSource, /查看明细/)
  assert.match(teamPageSource, /pages\/football\/asset\/index/)
})

test('renders the football asset detail page with filters and pagination affordances', () => {
  assert.match(assetPageSource, /球队资产明细/)
  assert.match(assetPageSource, /ASSET_FILTER_OPTIONS/)
  assert.match(assetPageSource, /上一页/)
  assert.match(assetPageSource, /下一页/)
})
