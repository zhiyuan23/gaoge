# Gaoge Capability Dialog Copy Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the original brand-oriented copy for the digital, content, and sports capability dialogs and add matching copy for film.

**Architecture:** Keep the existing `brandAreas` configuration and native dialog behavior unchanged. Modify only the four `status` and `description` values, then update route-level assertions so the homepage dialog remains the source of truth for this copy.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library

## Global Constraints

- Do not modify homepage layout, group-page organization, routes, dialog lifecycle, or capability identifiers.
- Keep the four capability keys in the existing order: `digital`, `content`, `film`, `sports`.
- The group page retains its concrete organization and service positioning.
- Do not add dependencies or create new components.
- Preserve all pre-existing uncommitted changes in `apps/brand`.
- Do not create an implementation commit while these files contain the user's broader uncommitted brand-page work.

---

### Task 1: Restore and verify the capability-dialog brand voice

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: existing `CapabilityAreaInfo` fields `status` and `description`.
- Preserves: `CapabilityArea`, `brandAreas` order, `BrandNavigationHandle.openCapability`, and all dialog interaction behavior.
- Produces: the confirmed visible copy for all four homepage capability tabs.

- [ ] **Step 1: Update the dialog assertions**

Replace the current concrete service-copy assertions with:

```ts
expect(screen.getByText('产品矩阵')).toBeInTheDocument()
expect(screen.getByText('以技术与产品思维，把想法转化为面向未来的数字能力。')).toBeInTheDocument()

expect(within(dialog).getByText('内容运营')).toBeInTheDocument()
expect(
  within(dialog).getByText('以创意与内容思维，把热爱转化为持续生长的影响力。'),
).toBeInTheDocument()

expect(within(dialog).getByText('影像创作')).toBeInTheDocument()
expect(
  within(dialog).getByText('以影像与叙事思维，把想法转化为承载情感与表达的光影作品。'),
).toBeInTheDocument()

expect(within(dialog).getByText('体育生态')).toBeInTheDocument()
expect(
  within(dialog).getByText('以运动与连接的力量，把热爱转化为真实发生的共同体验。'),
).toBeInTheDocument()
```

- [ ] **Step 2: Run the Brand route test and verify the assertions fail**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL because `BrandNavigation` still contains the concrete service descriptions.

- [ ] **Step 3: Restore the configuration values**

Set `brandAreas` to the following copy without changing keys or labels:

```ts
const brandAreas: readonly CapabilityAreaInfo[] = [
  {
    description: '以技术与产品思维，把想法转化为面向未来的数字能力。',
    key: 'digital',
    label: '数字',
    status: '产品矩阵',
  },
  {
    description: '以创意与内容思维，把热爱转化为持续生长的影响力。',
    key: 'content',
    label: '内容',
    status: '内容运营',
  },
  {
    description: '以影像与叙事思维，把想法转化为承载情感与表达的光影作品。',
    key: 'film',
    label: '影视',
    status: '影像创作',
  },
  {
    description: '以运动与连接的力量，把热爱转化为真实发生的共同体验。',
    key: 'sports',
    label: '体育',
    status: '体育生态',
  },
]
```

- [ ] **Step 4: Run focused and complete verification**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec eslint apps/brand/src/App.test.tsx apps/brand/src/brand/components/BrandNavigation.tsx
```

Expected: all 49 Brand tests pass, TypeScript exits 0, Vite builds successfully, and ESLint exits 0.

- [ ] **Step 5: Review the final diff**

Confirm only the intended dialog-copy values and matching assertions changed relative to the current working tree. Call `impact_for_changes` with the two modified paths; the canonical group knowledge note does not require a content update because organization positioning is unchanged.
