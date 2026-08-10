# Group 页高歌内容模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Group 页高歌数字与高歌体育之间增加一个宣言主导的高歌内容模块，并提供进入 `/content` 的站内卡片入口。

**Architecture:** Group 数据层新增一个独立的 `GroupContentOverview` 对象，表现层新增 `ContentStructure` 组件，`GroupPage` 负责按数字、内容、体育的顺序组装。章节导航同步加入 `group-content`，样式复用 Group 页现有表面、交互和响应式语言，仅增加深酒红内容识别层。

**Tech Stack:** React 19、React Router、TypeScript、Vite、Tailwind CSS、全局 CSS、Vitest、Testing Library

## Global Constraints

- 模块位于高歌数字之后、高歌体育之前。
- 模块只使用一张横向大卡片，不增加图片、案例、平台清单或数据。
- 必须保留“让每一份热爱 / 持续被看见。”和“以内容与运营连接品牌、平台和真实社群。”。
- 能力只展示“内容策略、内容创作、全平台运营、社群连接”。
- 整张卡片使用站内链接进入 `/content`，不打开新窗口。
- 桌面和移动导航都增加“内容”。
- 不新增第三方依赖、API、CMS 或共享包。

---

### Task 1: 建立 Group 内容模块数据契约

**Files:**

- Modify: `apps/brand/src/pages/group/types.ts`
- Modify: `apps/brand/src/pages/group/data.ts`
- Modify: `apps/brand/src/pages/group/data.test.ts`

**Interfaces:**

- Produces: `GroupContentOverview { capabilities; description; eyebrow; headline; href }`
- Produces: `groupContentOverview: GroupContentOverview`

- [ ] **Step 1: 在数据测试中声明确认的内容契约**

```ts
expect(groupContentOverview).toEqual({
  capabilities: ['内容策略', '内容创作', '全平台运营', '社群连接'],
  description: '以内容与运营连接品牌、平台和真实社群。',
  eyebrow: 'GAOGE CONTENT',
  headline: ['让每一份热爱', '持续被看见。'],
  href: '/content',
})
```

- [ ] **Step 2: 运行数据测试并确认新导出缺失**

Run: `pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts`

Expected: FAIL，`groupContentOverview` 尚未导出。

- [ ] **Step 3: 新增类型和只读数据对象**

```ts
export interface GroupContentOverview {
  readonly capabilities: readonly string[]
  readonly description: string
  readonly eyebrow: string
  readonly headline: readonly [string, string]
  readonly href: '/content'
}
```

- [ ] **Step 4: 运行数据测试并提交**

Run: `pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts`

Expected: PASS。

Commit: `feat(brand): add group content overview data`

---

### Task 2: 增加高歌内容卡片并接入页面

**Files:**

- Create: `apps/brand/src/pages/group/components/ContentStructure.tsx`
- Create: `apps/brand/src/pages/group/components/ContentStructure.test.tsx`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx`

**Interfaces:**

- Consumes: `overview: GroupContentOverview`
- Produces: `ContentStructure({ overview })`

- [ ] **Step 1: 为理念、能力和站内链接编写组件测试**

```tsx
expect(screen.getByRole('heading', { name: '高歌内容' })).toBeInTheDocument()
expect(screen.getByText('让每一份热爱')).toBeInTheDocument()
expect(screen.getByText('持续被看见。')).toBeInTheDocument()
expect(screen.getByRole('link', { name: '了解高歌内容' })).toHaveAttribute('href', '/content')
overview.capabilities.forEach((capability) => {
  expect(screen.getByText(capability)).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行组件测试并确认组件缺失**

Run: `pnpm --filter @gaoge/app-brand test -- src/pages/group/components/ContentStructure.test.tsx`

Expected: FAIL，组件尚不存在。

- [ ] **Step 3: 实现单张可点击理念卡片**

组件使用 `Link`、`ArrowUpRight` 和现有 Group 标题结构；章节 ID 为 `group-content`，卡片类名为 `group-content-card`，能力列表使用语义化 `ul`。

- [ ] **Step 4: 在 GroupPage 中接入数字与体育之间**

```tsx
<GroupSectionReveal>
  <DigitalStructure products={groupDigitalProducts} />
</GroupSectionReveal>
<GroupSectionReveal>
  <ContentStructure overview={groupContentOverview} />
</GroupSectionReveal>
<GroupSectionReveal>
  <SportsStructure entities={sportsEntities} />
</GroupSectionReveal>
```

- [ ] **Step 5: 运行组件和 Group 页面测试并提交**

Run: `pnpm --filter @gaoge/app-brand test -- src/pages/group/components/ContentStructure.test.tsx src/pages/group/GroupPage.test.tsx`

Expected: PASS。

Commit: `feat(brand): add content module to group page`

---

### Task 3: 将内容章节加入响应式导航

**Files:**

- Modify: `apps/brand/src/pages/group/components/GroupSectionNavigation.tsx`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Adds: `{ id: 'group-content', label: '内容' }`

- [ ] **Step 1: 扩展路由测试中的 Group 导航断言**

在桌面和移动视口断言都能找到 `href="#group-content"`、文本为“内容”的章节链接。

- [ ] **Step 2: 运行 App 测试并确认导航项缺失**

Run: `pnpm --filter @gaoge/app-brand test -- src/App.test.tsx`

Expected: FAIL，导航中尚无“内容”。

- [ ] **Step 3: 在桌面和移动导航配置中插入内容章节**

将 `group-content` 放在 `group-digital` 与 `group-sports` 之间，并保持移动端“集团”继续汇总治理、董事会和愿景。

- [ ] **Step 4: 运行 App 测试并提交**

Run: `pnpm --filter @gaoge/app-brand test -- src/App.test.tsx`

Expected: PASS。

Commit: `feat(brand): add content to group navigation`

---

### Task 4: 完成卡片视觉、响应式与整体验证

**Files:**

- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Styles: `.group-content-card`、`.group-content-card::before`、`.group-content-capabilities`

- [ ] **Step 1: 增加深酒红光影和交互状态**

卡片保持 Group 页 `24px` 圆角、深色表面和单一深酒红识别光；hover、focus-visible、active 与数字和体育卡片一致。

- [ ] **Step 2: 增加移动端能力换行和文字尺寸约束**

在常见手机宽度保持理念完整、能力自然换行、导航单行且页面无水平溢出。

- [ ] **Step 3: 运行完整工程校验**

Run: `pnpm exec prettier --check "apps/brand/src/**/*.{ts,tsx,css}" && pnpm exec eslint apps/brand/src && pnpm exec stylelint "apps/brand/src/**/*.css" && pnpm --filter @gaoge/app-brand typecheck && pnpm --filter @gaoge/app-brand test && pnpm --filter @gaoge/app-brand build && git diff --check`

Expected: 所有命令退出码为 0，19 个以上测试文件全部通过。

- [ ] **Step 4: 浏览器检查**

在 1440×900、390×844 和 320×568 检查模块顺序、卡片链接、导航、文字裁切、焦点和水平溢出；浏览器控制台不得出现 warn/error。

- [ ] **Step 5: 提交视觉与验证改动**

Commit: `style(brand): polish group content module`
