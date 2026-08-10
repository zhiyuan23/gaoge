import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from '../../../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js'

const campaignDir = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.join(campaignDir, 'sources')
const outputDir = path.join(campaignDir, 'exports')
const backgroundPath = path.join(sourceDir, 'cover-background-generated.png')

const colors = {
  accent: '#a8bd9b',
  background: '#0b0f0c',
  border: '#293029',
  muted: '#879087',
  surface: '#111712',
  white: '#f2f4ef',
}

const font = "'PingFang SC', 'Hiragino Sans GB', sans-serif"

function svg(width, height, body) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#080b09" stop-opacity="0.94" />
          <stop offset="0.58" stop-color="#080b09" stop-opacity="0.54" />
          <stop offset="1" stop-color="#080b09" stop-opacity="0.08" />
        </linearGradient>
        <radialGradient id="sage" cx="75%" cy="42%" r="58%">
          <stop offset="0" stop-color="#a8bd9b" stop-opacity="0.14" />
          <stop offset="1" stop-color="#0b0f0c" stop-opacity="0" />
        </radialGradient>
      </defs>
      ${body}
    </svg>
  `)
}

async function renderCover({ filename, height, square = false, width }) {
  const titleX = square ? 92 : 128
  const titleY = square ? 450 : 318
  const titleSize = square ? 92 : 86
  const lineHeight = square ? 112 : 103
  const safeWidth = square ? width : Math.round(width * 0.66)
  const overlay = svg(
    width,
    height,
    `
      <rect width="${width}" height="${height}" fill="url(#fade)" />
      <rect width="${width}" height="${height}" fill="url(#sage)" />
      <text x="${titleX}" y="78" fill="${colors.accent}" font-family="${font}" font-size="22" font-weight="500" letter-spacing="5">GAOGE · A NEW CHAPTER</text>
      <text x="${titleX}" y="${titleY}" fill="${colors.white}" font-family="${font}" font-size="${titleSize}" font-weight="600" letter-spacing="-4">
        <tspan x="${titleX}" dy="0">连接热爱，</tspan>
        <tspan x="${titleX}" dy="${lineHeight}">奔赴所爱。</tspan>
      </text>
      <text x="${titleX}" y="${titleY + lineHeight + 72}" fill="#b8beb8" font-family="${font}" font-size="30" font-weight="400">高歌，全新启幕。</text>
      <line x1="${titleX}" y1="${height - 82}" x2="${safeWidth}" y2="${height - 82}" stroke="#ffffff" stroke-opacity="0.22" />
      <text x="${titleX}" y="${height - 42}" fill="#aab0aa" font-family="${font}" font-size="18" letter-spacing="4">DIGITAL · CONTENT · FILM · SPORTS</text>
    `,
  )

  await sharp(backgroundPath)
    .resize(width, height, { fit: 'cover', position: square ? 'right' : 'centre' })
    .composite([{ input: overlay }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, filename))
}

async function renderManifesto() {
  const width = 1080
  const height = 1350
  const artwork = svg(
    width,
    height,
    `
      <rect width="${width}" height="${height}" fill="${colors.background}" />
      <circle cx="1030" cy="480" r="430" fill="none" stroke="${colors.accent}" stroke-opacity="0.18" stroke-width="2" />
      <circle cx="1030" cy="480" r="290" fill="none" stroke="${colors.accent}" stroke-opacity="0.13" stroke-width="2" />
      <path d="M 620 1180 C 760 920, 820 740, 1120 620" fill="none" stroke="${colors.accent}" stroke-opacity="0.2" stroke-width="3" />
      <text x="86" y="102" fill="${colors.accent}" font-family="${font}" font-size="22" font-weight="500" letter-spacing="6">GAOGE MANIFESTO</text>
      <text x="86" y="558" fill="${colors.white}" font-family="${font}" font-size="106" font-weight="600" letter-spacing="-6">
        <tspan x="86" dy="0">将热爱，</tspan>
        <tspan x="86" dy="132">坚决贯彻到底。</tspan>
      </text>
      <text x="86" y="878" fill="#b1b8b1" font-family="${font}" font-size="30" font-weight="400">
        <tspan x="86" dy="0">热爱本身，就是一种浪漫。</tspan>
        <tspan x="86" dy="52">让它不只停留在心里，而是成为真实的行动。</tspan>
      </text>
      <text x="86" y="1240" fill="${colors.muted}" font-family="${font}" font-size="18" letter-spacing="3">CONNECT · CREATE · MOVE FORWARD</text>
    `,
  )
  await sharp(artwork).png({ compressionLevel: 9 }).toFile(path.join(outputDir, '04-manifesto.png'))
}

async function renderValues() {
  const width = 1080
  const height = 1440
  const cards = [
    ['因热爱出发', '从真正喜欢的事情开始，保持好奇，也保持行动。'],
    ['让想法发生', '把想法带进真实生活，不停留在想象里。'],
    ['与伙伴同行', '珍惜每一次相遇，在共同创造中走得更远。'],
  ]
  const cardBody = cards
    .map(([title, description], index) => {
      const y = 620 + index * 214
      return `
        <rect x="72" y="${y}" width="936" height="178" rx="26" fill="${colors.surface}" stroke="${colors.border}" />
        <text x="112" y="${y + 66}" fill="${colors.white}" font-family="${font}" font-size="38" font-weight="550">${title}</text>
        <text x="112" y="${y + 122}" fill="#9da59d" font-family="${font}" font-size="24">${description}</text>
        <text x="940" y="${y + 62}" text-anchor="end" fill="${colors.accent}" font-family="${font}" font-size="18" letter-spacing="2">0${index + 1}</text>
      `
    })
    .join('')

  const artwork = svg(
    width,
    height,
    `
      <rect width="${width}" height="${height}" fill="${colors.background}" />
      <rect width="${width}" height="${height}" fill="url(#sage)" />
      <text x="72" y="92" fill="${colors.accent}" font-family="${font}" font-size="22" font-weight="500" letter-spacing="6">GAOGE VISION</text>
      <text x="72" y="286" fill="${colors.white}" font-family="${font}" font-size="78" font-weight="600" letter-spacing="-4">
        <tspan x="72" dy="0">让每一份热爱，</tspan>
        <tspan x="72" dy="102">都有持续生长的可能。</tspan>
      </text>
      <line x1="72" y1="500" x2="1008" y2="500" stroke="#ffffff" stroke-opacity="0.15" />
      ${cardBody}
    `,
  )
  await sharp(artwork)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, '05-brand-values.png'))
}

async function renderExpressions() {
  const width = 1080
  const height = 1350
  const nodes = [
    { code: 'DIGITAL', name: '高歌数字', x: 80, y: 640 },
    { code: 'CONTENT', name: '高歌内容', x: 560, y: 640 },
    { code: 'FILM', name: '高歌影视', x: 80, y: 890 },
    { code: 'SPORTS', name: '高歌体育', x: 560, y: 890 },
  ]
  const nodeBody = nodes
    .map(
      ({ code, name, x, y }) => `
        <rect x="${x}" y="${y}" width="440" height="192" rx="22" fill="${colors.surface}" stroke="${colors.border}" />
        <text x="${x + 32}" y="${y + 58}" fill="${colors.accent}" font-family="${font}" font-size="18" font-weight="500" letter-spacing="4">${code}</text>
        <text x="${x + 32}" y="${y + 126}" fill="${colors.white}" font-family="${font}" font-size="42" font-weight="550">${name}</text>
      `,
    )
    .join('')

  const artwork = svg(
    width,
    height,
    `
      <rect width="${width}" height="${height}" fill="${colors.background}" />
      <circle cx="900" cy="300" r="310" fill="none" stroke="${colors.accent}" stroke-opacity="0.14" stroke-width="2" />
      <circle cx="900" cy="300" r="205" fill="none" stroke="${colors.accent}" stroke-opacity="0.1" stroke-width="2" />
      <text x="80" y="92" fill="${colors.accent}" font-family="${font}" font-size="22" font-weight="500" letter-spacing="6">ONE GAOGE · FOUR EXPRESSIONS</text>
      <text x="80" y="286" fill="${colors.white}" font-family="${font}" font-size="82" font-weight="600" letter-spacing="-4">
        <tspan x="80" dy="0">一种高歌，</tspan>
        <tspan x="80" dy="104">四种表达。</tspan>
      </text>
      <text x="80" y="492" fill="#9da59d" font-family="${font}" font-size="26">技术、内容、影像与体育，是高歌连接想法与真实生活的四种方式。</text>
      ${nodeBody}
      <line x1="80" y1="1194" x2="1000" y2="1194" stroke="#ffffff" stroke-opacity="0.14" />
      <text x="80" y="1250" fill="${colors.muted}" font-family="${font}" font-size="18" letter-spacing="3">CONNECTING IDEAS WITH REAL LIFE</text>
    `,
  )
  await sharp(artwork)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, '06-four-expressions.png'))
}

async function renderEnding() {
  const width = 1080
  const height = 1350
  const artwork = svg(
    width,
    height,
    `
      <rect width="${width}" height="${height}" fill="${colors.background}" />
      <rect width="${width}" height="${height}" fill="url(#sage)" />
      <circle cx="540" cy="430" r="188" fill="none" stroke="${colors.accent}" stroke-opacity="0.22" stroke-width="2" />
      <circle cx="540" cy="430" r="118" fill="none" stroke="${colors.accent}" stroke-opacity="0.14" stroke-width="2" />
      <text x="540" y="453" text-anchor="middle" fill="${colors.accent}" font-family="${font}" font-size="76" font-weight="500" transform="rotate(-18 540 430)">G</text>
      <text x="540" y="760" text-anchor="middle" fill="${colors.white}" font-family="${font}" font-size="74" font-weight="600" letter-spacing="-4">
        <tspan x="540" dy="0">新的面貌，</tspan>
        <tspan x="540" dy="96">不变的热爱。</tspan>
      </text>
      <text x="540" y="1042" text-anchor="middle" fill="#aeb5ae" font-family="${font}" font-size="30">连接热爱，奔赴所爱。</text>
      <text x="540" y="1220" text-anchor="middle" fill="${colors.accent}" font-family="${font}" font-size="20" letter-spacing="6">GAOGE · A NEW CHAPTER</text>
    `,
  )
  await sharp(artwork).png({ compressionLevel: 9 }).toFile(path.join(outputDir, '08-ending.png'))
}

async function renderPlaceholder({ description, eyebrow, filename, replacement, title }) {
  const width = 1080
  const height = 1080
  const artwork = svg(
    width,
    height,
    `
      <rect width="${width}" height="${height}" fill="${colors.background}" />
      <rect x="56" y="56" width="968" height="968" rx="34" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2" stroke-dasharray="12 14" />
      <circle cx="884" cy="228" r="250" fill="none" stroke="${colors.accent}" stroke-opacity="0.16" stroke-width="2" />
      <circle cx="884" cy="228" r="152" fill="none" stroke="${colors.accent}" stroke-opacity="0.12" stroke-width="2" />
      <text x="104" y="134" fill="${colors.accent}" font-family="${font}" font-size="22" font-weight="500" letter-spacing="6">${eyebrow}</text>
      <text x="104" y="430" fill="${colors.white}" font-family="${font}" font-size="76" font-weight="600" letter-spacing="-4">${title}</text>
      <text x="104" y="522" fill="#aeb5ae" font-family="${font}" font-size="30">${description}</text>
      <rect x="104" y="674" width="872" height="154" rx="22" fill="#0c110d" stroke="${colors.accent}" stroke-opacity="0.35" />
      <text x="140" y="738" fill="${colors.accent}" font-family="${font}" font-size="20" font-weight="500" letter-spacing="3">PLACEHOLDER · 发布前替换</text>
      <text x="140" y="790" fill="${colors.white}" font-family="${font}" font-size="28">${replacement}</text>
      <text x="104" y="944" fill="${colors.muted}" font-family="${font}" font-size="18" letter-spacing="3">GAOGE · A NEW CHAPTER</text>
    `,
  )
  await sharp(artwork).png({ compressionLevel: 9 }).toFile(path.join(outputDir, filename))
}

async function renderDraftContactSheet() {
  const files = [
    '01-cover-landscape.png',
    '02-cover-share-safe.png',
    '04-manifesto.png',
    '05-brand-values.png',
    '06-four-expressions.png',
    '08-ending.png',
  ]
  const cellWidth = 720
  const cellHeight = 930
  const gap = 40
  const margin = 60
  const sheetWidth = margin * 2 + cellWidth * 2 + gap
  const sheetHeight = margin * 2 + cellHeight * 3 + gap * 2
  const composites = []

  for (const [index, filename] of files.entries()) {
    const x = margin + (index % 2) * (cellWidth + gap)
    const y = margin + Math.floor(index / 2) * (cellHeight + gap)
    const preview = await sharp(path.join(outputDir, filename))
      .resize(cellWidth, cellHeight - 70, {
        background: '#080b09',
        fit: 'contain',
      })
      .png()
      .toBuffer()
    const label = svg(
      cellWidth,
      70,
      `<rect width="${cellWidth}" height="70" fill="#111712" />
       <text x="24" y="44" fill="#a8bd9b" font-family="${font}" font-size="22" letter-spacing="2">${filename}</text>`,
    )
    composites.push({ input: preview, left: x, top: y })
    composites.push({ input: label, left: x, top: y + cellHeight - 70 })
  }

  await sharp({
    create: {
      background: '#060806',
      channels: 4,
      height: sheetHeight,
      width: sheetWidth,
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'contact-sheet-draft.png'))
}

async function renderFinalContactSheet() {
  const files = [
    '01-cover-landscape.png',
    '02-cover-share-safe.png',
    '03-gaoge-road.png',
    '04-manifesto.png',
    '05-brand-values.png',
    '06-four-expressions.png',
    '07-gaoge-fc.png',
    '08-ending.png',
  ]
  const cellWidth = 720
  const cellHeight = 930
  const gap = 40
  const margin = 60
  const sheetWidth = margin * 2 + cellWidth * 2 + gap
  const sheetHeight = margin * 2 + cellHeight * 4 + gap * 3
  const composites = []

  for (const [index, filename] of files.entries()) {
    const x = margin + (index % 2) * (cellWidth + gap)
    const y = margin + Math.floor(index / 2) * (cellHeight + gap)
    const preview = await sharp(path.join(outputDir, filename))
      .resize(cellWidth, cellHeight - 70, {
        background: '#080b09',
        fit: 'contain',
      })
      .png()
      .toBuffer()
    const label = svg(
      cellWidth,
      70,
      `<rect width="${cellWidth}" height="70" fill="#111712" />
       <text x="24" y="44" fill="#a8bd9b" font-family="${font}" font-size="22" letter-spacing="2">${filename}</text>`,
    )
    composites.push({ input: preview, left: x, top: y })
    composites.push({ input: label, left: x, top: y + cellHeight - 70 })
  }

  await sharp({
    create: {
      background: '#060806',
      channels: 4,
      height: sheetHeight,
      width: sheetWidth,
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'contact-sheet.png'))
}

await fs.mkdir(outputDir, { recursive: true })
await renderCover({ filename: '01-cover-landscape.png', height: 766, width: 1800 })
await renderCover({ filename: '02-cover-share-safe.png', height: 1080, square: true, width: 1080 })
await renderManifesto()
await renderValues()
await renderExpressions()
await renderEnding()
await renderPlaceholder({
  description: '一个具体的地点，成为高歌最初的坐标。',
  eyebrow: 'THE NAME · 高歌',
  filename: '03-gaoge-road.png',
  replacement: '替换为高歌路或路牌的真实照片',
  title: '高歌，从一条路开始。',
})
await renderPlaceholder({
  description: '因为共同奔跑，热爱变得具体。',
  eyebrow: 'GAOGE FC · 高歌体育',
  filename: '07-gaoge-fc.png',
  replacement: '替换为高歌 FC 比赛、训练或合影',
  title: '在球场上，热爱继续发生。',
})
await renderDraftContactSheet()
await renderFinalContactSheet()

console.log('Rendered 8 GAOGE campaign assets and contact sheets.')
