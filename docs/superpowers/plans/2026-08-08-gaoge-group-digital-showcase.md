# Gaoge Group Digital Showcase Implementation Plan

> **Execution mode:** Implement inline in the current session. Do not use subagents and do not use TDD. Apply the confirmed implementation and test updates together, then run unified verification.

**Goal:** Remove the Gaoge Digital capability band and compact the three product cards into an exact one-primary, two-half-height layout on desktop and mobile.

**Architecture:** Keep `DigitalStructure` focused only on the three product links. Remove the unused capability contract and data, shorten the two secondary descriptions, and encode the confirmed heights directly in responsive Tailwind classes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, lucide-react, Vitest, Testing Library

## Global Constraints

- Preserve all pre-existing uncommitted work and do not stage or commit unrelated changes.
- Do not use TDD or subagents.
- Do not change the three `?demo` URLs or external-link accessibility behavior.
- Remove the entire “我们可以提供” block and its four capability records.
- Desktop: primary card `416px`; two secondary rows `200px + 16px + 200px`.
- Mobile: primary card `288px`; each secondary card `144px`.
- Preserve the DOM order Compass, CRM, Club.
- Do not add dependencies or edit shared styles.

---

### Task 1: Remove capability data and compact secondary copy

**Files:**

- Modify: `apps/brand/src/pages/group/types.ts`
- Modify: `apps/brand/src/pages/group/data.ts`
- Modify: `apps/brand/src/pages/group/data.test.ts`

**Interfaces:**

- Preserve: `GroupDigitalProduct` and `groupDigitalProducts`.
- Remove: `GroupDigitalCapability` and `groupDigitalCapabilities`.
- Update CRM description to `统一记录线索、客户、商机与跟进过程。`.
- Update Club description to `连接会员、活动、社群与俱乐部日常运营。`.

- [ ] **Step 1: Remove `GroupDigitalCapability` from `types.ts`.**

- [ ] **Step 2: Remove the `GroupDigitalCapability` import and `groupDigitalCapabilities` array from `data.ts`.**

- [ ] **Step 3: Replace the CRM and Club descriptions in `data.ts` with the confirmed compact copy.**

- [ ] **Step 4: Update `data.test.ts` to remove capability imports and assertions, and assert the compact product descriptions.**

### Task 2: Compact the product grid and remove the capability UI

**Files:**

- Modify: `apps/brand/src/pages/group/components/DigitalStructure.tsx`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- `DigitalStructureProps` contains only `readonly products: readonly GroupDigitalProduct[]`.
- Product cards preserve `data-testid="group-digital-product"`, `data-product`, and `data-emphasis`.
- The grid uses `lg:grid-rows-[12.5rem_12.5rem]` with the existing `gap-4`.

- [ ] **Step 1: Remove the capabilities prop, type import, and complete capability block from `DigitalStructure.tsx`.**

- [ ] **Step 2: Apply exact responsive heights to the product cards.**

Use these card classes:

```ts
const sizeClassName = isPrimary
  ? 'h-72 p-6 md:p-7 lg:col-span-7 lg:row-span-2 lg:h-full'
  : 'h-36 p-4 lg:col-span-5 lg:h-full lg:p-6'
```

Use this grid class:

```tsx
<div className="mt-10 grid gap-4 md:mt-12 lg:grid-cols-12 lg:grid-rows-[12.5rem_12.5rem]">
```

- [ ] **Step 3: Compact the card typography without hiding text.**

Render the English name and “演示系统” label on one compact line. Use `h-8 w-8` for secondary external-link icons, `text-xl lg:text-3xl` for secondary titles, and `text-xs leading-5 lg:text-sm lg:leading-6` for secondary descriptions. Keep the primary title and description visually dominant.

- [ ] **Step 4: Remove the capabilities import and prop from `GroupPage.tsx`.**

The call becomes:

```tsx
<DigitalStructure products={groupDigitalProducts} />
```

- [ ] **Step 5: Update route assertions in `App.test.tsx`.**

Assert:

```ts
expect(digitalProductCards[0]).toHaveClass('h-72', 'lg:row-span-2', 'lg:h-full')
digitalProductCards.slice(1).forEach((card) => {
  expect(card).toHaveClass('h-36', 'lg:col-span-5', 'lg:h-full')
})
expect(screen.queryByText('我们可以提供')).not.toBeInTheDocument()
expect(screen.queryByTestId('group-digital-capability')).not.toBeInTheDocument()
```

Remove the old assertion expecting four capability items.

### Task 3: Unified verification

**Files:**

- Verify all files changed in Tasks 1 and 2.

- [ ] **Step 1: Format only task-owned files.**

```bash
pnpm exec prettier --write \
  apps/brand/src/pages/group/types.ts \
  apps/brand/src/pages/group/data.ts \
  apps/brand/src/pages/group/data.test.ts \
  apps/brand/src/pages/group/components/DigitalStructure.tsx \
  apps/brand/src/pages/group/GroupPage.tsx \
  apps/brand/src/App.test.tsx
```

- [ ] **Step 2: Run automated verification.**

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm lint:style
```

- [ ] **Step 3: Inspect `/group` at 1440px and 390px widths.**

Confirm desktop card heights are `416px`, `200px`, `200px`; mobile heights are `288px`, `144px`, `144px`; all descriptions are visible; no capability band or horizontal overflow remains.

- [ ] **Step 4: Run `impact_for_changes` for the changed group-page paths and report the existing source-map limitation.**
