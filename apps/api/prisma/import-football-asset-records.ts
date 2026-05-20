#!/usr/bin/env ts-node

import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const IMPORT_RECORD_DATE = new Date('2026-05-20T00:00:00.000Z')
const SPLIT_SEASON_LABEL = '26赛季春季赛（6）'
const LEGACY_EXPECTED_TOTALS = {
  income: 126000,
  expense: 75698,
  balance: 50302,
}

type LegacyExpenseType = 'equipment' | 'activity' | 'other_expense'

type LegacySeasonRecord = {
  seasonLabel: string
  incomeLabel: string
  incomeYuan: number
  expenses: Array<{
    title: string
    amountYuan: number
    recordType: LegacyExpenseType
  }>
}

const LEGACY_SEASON_RECORDS: LegacySeasonRecord[] = [
  {
    seasonLabel: '春季联赛（10场）',
    incomeLabel: '20*10=200',
    incomeYuan: 200,
    expenses: [{ title: '足球', amountYuan: 178, recordType: 'equipment' }],
  },
  {
    seasonLabel: '夏季联赛（9场）',
    incomeLabel: '20*9=180',
    incomeYuan: 180,
    expenses: [{ title: '手套', amountYuan: 37, recordType: 'equipment' }],
  },
  {
    seasonLabel: '秋季联赛（9场）',
    incomeLabel: '20*9=180',
    incomeYuan: 180,
    expenses: [{ title: '记分牌', amountYuan: 6, recordType: 'equipment' }],
  },
  {
    seasonLabel: '冬季联赛（2场）',
    incomeLabel: '20*2=40',
    incomeYuan: 40,
    expenses: [{ title: '手套', amountYuan: 68, recordType: 'equipment' }],
  },
  {
    seasonLabel: '春季联赛（9场）',
    incomeLabel: '20*9=180',
    incomeYuan: 180,
    expenses: [{ title: '手套', amountYuan: 58, recordType: 'equipment' }],
  },
  {
    seasonLabel: '夏季赛（5场）',
    incomeLabel: '20*5=100',
    incomeYuan: 100,
    expenses: [{ title: '缺人补位', amountYuan: 78.57, recordType: 'activity' }],
  },
  {
    seasonLabel: '夏季赛（6/6场）',
    incomeLabel: '20*6=120',
    incomeYuan: 120,
    expenses: [{ title: '条幅', amountYuan: 45, recordType: 'equipment' }],
  },
  {
    seasonLabel: '秋季赛（7/7场）',
    incomeLabel: '20*7=140',
    incomeYuan: 140,
    expenses: [{ title: '手套x2', amountYuan: 48, recordType: 'equipment' }],
  },
  {
    seasonLabel: '26赛季春季赛（6）',
    incomeLabel: '20*6=120',
    incomeYuan: 120,
    expenses: [
      { title: '足球', amountYuan: 115, recordType: 'equipment' },
      { title: '手套x2', amountYuan: 34.79, recordType: 'equipment' },
      { title: '买水', amountYuan: 20, recordType: 'activity' },
      { title: '手套x2', amountYuan: 42, recordType: 'equipment' },
      { title: '积分器', amountYuan: 21.83, recordType: 'equipment' },
      { title: '积分排', amountYuan: 4.79, recordType: 'equipment' },
    ],
  },
]

function yuanToCent(value: number) {
  return Math.round(value * 100)
}

function buildMatchRoundSeasonLabel(year: number, season: string, round: number) {
  return `${year}年${season}第${round}轮`
}

function buildIncomeRecord(
  record: LegacySeasonRecord,
  recordDate: Date,
): Prisma.FootballAssetRecordCreateManyInput {
  return {
    direction: 'income',
    recordType: 'match_fee',
    amount: yuanToCent(record.incomeYuan),
    seasonLabel: null,
    matchLabel: record.seasonLabel,
    isWaived: false,
    title: `${record.seasonLabel}球队建设费`,
    description: `历史导入收入：${record.incomeLabel}`,
    recordDate,
    status: 'confirmed',
    creatorId: null,
  }
}

function buildExpenseRecord(
  expense: LegacySeasonRecord['expenses'][number],
  recordDate: Date,
): Prisma.FootballAssetRecordCreateManyInput {
  return {
    direction: 'expense',
    recordType: expense.recordType,
    amount: yuanToCent(expense.amountYuan),
    seasonLabel: null,
    matchLabel: null,
    isWaived: false,
    title: expense.title,
    description: '历史支出',
    recordDate,
    status: 'confirmed',
    creatorId: null,
  }
}

async function buildSplitIncomeRecords() {
  const rounds = await prisma.matchRound.findMany({
    where: {
      year: 2026,
      season: '春季赛',
      collectTeamFee: true,
    },
    orderBy: [{ round: 'asc' }, { matchDate: 'asc' }, { id: 'asc' }],
    select: {
      round: true,
      matchDate: true,
    },
  })

  if (rounds.length !== 6) {
    throw new Error(
      `拆分 ${SPLIT_SEASON_LABEL} 失败：当前符合条件的比赛场次为 ${rounds.length}，预期为 6 场`,
    )
  }

  return rounds.map((round) => ({
    direction: 'income' as const,
    recordType: 'match_fee' as const,
    amount: 2000,
    seasonLabel: null,
    matchLabel: buildMatchRoundSeasonLabel(2026, '春季赛', round.round),
    isWaived: false,
    title: '球队建设费',
    description: `历史导入收入：第${round.round}轮 20 元球队建设费`,
    recordDate: round.matchDate,
    status: 'confirmed' as const,
    creatorId: null,
  }))
}

function createHistoryRecordDate(firstMatchDate: Date, offset: number) {
  return new Date(firstMatchDate.getTime() - (offset + 1) * 60 * 1000)
}

async function buildRecords() {
  const splitIncomeRecords = await buildSplitIncomeRecords()
  const firstSplitDate = splitIncomeRecords[0]?.recordDate ?? IMPORT_RECORD_DATE
  const historyRecords: Prisma.FootballAssetRecordCreateManyInput[] = []
  const splitSeasonRecords: Prisma.FootballAssetRecordCreateManyInput[] = []

  for (const seasonRecord of LEGACY_SEASON_RECORDS) {
    if (seasonRecord.seasonLabel === SPLIT_SEASON_LABEL) {
      splitSeasonRecords.push(...splitIncomeRecords)
    } else {
      historyRecords.push(buildIncomeRecord(seasonRecord, IMPORT_RECORD_DATE))
    }

    for (const expense of seasonRecord.expenses) {
      historyRecords.push(buildExpenseRecord(expense, IMPORT_RECORD_DATE))
    }
  }

  const reversedHistoryRecords = [...historyRecords].reverse().map((record, index) => ({
    ...record,
    recordDate: createHistoryRecordDate(firstSplitDate, index),
  }))

  return [...splitSeasonRecords, ...reversedHistoryRecords]
}

function summarize(records: Prisma.FootballAssetRecordCreateManyInput[]) {
  const income = records
    .filter((record) => record.direction === 'income')
    .reduce((sum, record) => sum + record.amount, 0)
  const expense = records
    .filter((record) => record.direction === 'expense')
    .reduce((sum, record) => sum + record.amount, 0)

  return {
    income,
    expense,
    balance: income - expense,
  }
}

function formatCent(value: number) {
  return `¥${(value / 100).toFixed(2)}`
}

async function main() {
  const apply = process.argv.includes('--apply')
  const replace = process.argv.includes('--replace')
  const records = await buildRecords()
  const totals = summarize(records)

  console.log('历史足球资产导入预览')
  console.log(`记录条数: ${records.length}`)
  console.log(`收入合计: ${formatCent(totals.income)}`)
  console.log(`支出合计: ${formatCent(totals.expense)}`)
  console.log(`结余合计: ${formatCent(totals.balance)}`)
  console.log(`台账总收入: ${formatCent(LEGACY_EXPECTED_TOTALS.income)}`)
  console.log(`台账总支出: ${formatCent(LEGACY_EXPECTED_TOTALS.expense)}`)
  console.log(`台账结余: ${formatCent(LEGACY_EXPECTED_TOTALS.balance)}`)

  if (
    totals.income !== LEGACY_EXPECTED_TOTALS.income ||
    totals.expense !== LEGACY_EXPECTED_TOTALS.expense ||
    totals.balance !== LEGACY_EXPECTED_TOTALS.balance
  ) {
    console.warn('警告: 导入明细汇总与提供的总计不一致，请先核对原始台账金额。')
  }

  console.table(
    records.map((record) => ({
      direction: record.direction,
      recordType: record.recordType,
      matchLabel: record.matchLabel,
      title: record.title,
      amount: formatCent(record.amount),
      description: record.description,
    })),
  )

  if (!apply) {
    console.log('当前为 dry-run，未写入数据库。追加 --apply 才会执行导入。')
    return
  }

  if (replace) {
    await prisma.footballAssetRecord.deleteMany()
    console.log('已清空现有足球资产记录。')
  }

  await prisma.footballAssetRecord.createMany({
    data: records,
  })

  console.log(`已导入 ${records.length} 条足球资产记录。`)
}

main()
  .catch((error) => {
    console.error('导入失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
