import { describe, expect, it } from 'vitest'

import { contentCapabilities } from '@/pages/content/data'

describe('content abstract field data', () => {
  it('defines only the four approved content capabilities', () => {
    expect(contentCapabilities).toEqual([
      { description: '找到值得表达的核心', title: '内容策略' },
      { description: '让故事形成自己的语言', title: '内容创作' },
      { description: '让内容进入适合的场域', title: '全平台运营' },
      { description: '让触达沉淀为长期关系', title: '社群连接' },
    ])
  })
})
