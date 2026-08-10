# Brand Chinese Display Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the formal brand pages a dedicated Chinese display-font stack and relax large Chinese heading tracking to `-0.025em` without changing body copy, English typography, layout, or concept-specific styles.

**Architecture:** Add one Tailwind font-family token whose first face remains `Kanit` for Latin glyphs and whose fallback faces cover Simplified Chinese. Apply that token only to page-level Chinese display headings in `/group`, `/digital`, and `/content`, while leaving information-level product names, card titles, navigation, body copy, and independent concepts untouched.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, Vite 6, Vitest

## Global Constraints

- The display stack is `Kanit`, `Source Han Sans CN Variable`, `Source Han Sans CN`, `Noto Sans SC`, `PingFang SC`, `Hiragino Sans GB`, `Microsoft YaHei`, `system-ui`, `sans-serif`.
- Target large Chinese display headings use `tracking-[-0.025em]`.
- Do not add font binaries, `@font-face`, external font requests, packages, or runtime font loaders.
- Do not change copy, line height, weight, wrapping, layout, color, or motion. The only font-size exception is the `/digital` hero heading: `44px` at `399px` and below, then `36px` at `359px` and below, to preserve its intended two-line copy after tracking is relaxed.
- Do not modify body copy, navigation, information-level product/person/card titles, or concept-specific typography.

---

### Task 1: Add and apply the Chinese display typography token

**Files:**

- Modify: `apps/brand/tailwind.config.ts`
- Modify: `apps/brand/src/pages/group/components/BusinessCapabilities.tsx`
- Modify: `apps/brand/src/pages/group/components/ContentStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/DeliveryModel.tsx`
- Modify: `apps/brand/src/pages/group/components/DigitalStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/GroupHero.tsx`
- Modify: `apps/brand/src/pages/group/components/GroupVision.tsx`
- Modify: `apps/brand/src/pages/group/components/LeadershipStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/LeagueBoard.tsx`
- Modify: `apps/brand/src/pages/group/components/SportsStructure.tsx`
- Modify: `apps/brand/src/pages/digital/components/CurrentProducts.tsx`
- Modify: `apps/brand/src/pages/digital/components/DigitalDelivery.tsx`
- Modify: `apps/brand/src/pages/digital/components/DigitalHero.tsx`
- Modify: `apps/brand/src/pages/digital/components/ProductRoadmap.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentBelief.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentHero.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentValue.tsx`

**Interfaces:**

- Consumes: Tailwind `theme.extend.fontFamily` and existing component `className` strings.
- Produces: the `font-display-cn` utility and its explicit use on formal page-level Chinese display headings.

- [ ] **Step 1: Add the Tailwind font-family token**

Add this entry under `theme.extend.fontFamily` in `apps/brand/tailwind.config.ts`:

```ts
'display-cn': [
  'Kanit',
  '"Source Han Sans CN Variable"',
  '"Source Han Sans CN"',
  '"Noto Sans SC"',
  '"PingFang SC"',
  '"Hiragino Sans GB"',
  '"Microsoft YaHei"',
  'system-ui',
  'sans-serif',
],
```

- [ ] **Step 2: Apply the token to `/group` page-level display headings**

In the listed group components, add `font-display-cn` to only these elements and replace their existing negative tracking utility with `tracking-[-0.025em]`:

- `BusinessCapabilities`: the `企业服务能力` section `h2`; leave mapped capability-name `h3` elements unchanged.
- `ContentStructure`: the `高歌内容` section `h2` and the large `overview.headline` `h3`.
- `DeliveryModel`: the `集团协同交付` `h2`.
- `DigitalStructure`: the `高歌数字` section `h2`; leave mapped product-name `h3` elements unchanged.
- `GroupHero`: the `连接热爱，奔赴所爱。` hero `h2`.
- `GroupVision`: the `集团愿景` `h2` and the large vision-statement `p`.
- `LeadershipStructure`: both empty-state and populated-state `集团管理层` `h2` elements; leave leader-name cards unchanged.
- `LeagueBoard`: the `联赛董事会` `h2`; leave the large numeric count and member names unchanged.
- `SportsStructure`: the `高歌体育` section `h2`; leave `FC`/`GSL` marks and entity-name `h3` elements unchanged.

For example, transform:

```tsx
className = 'text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl'
```

into:

```tsx
className = 'font-display-cn text-4xl font-medium tracking-[-0.025em] text-white md:text-6xl'
```

- [ ] **Step 3: Apply the token to `/digital` page-level display headings**

Add `font-display-cn` and `tracking-[-0.025em]` to:

- `DigitalHero`: hero Chinese `h2`; add `max-[399px]:text-[2.75rem] max-[359px]:text-4xl` so the second explicit line does not orphan “晰。” after the tracking change.
- `CurrentProducts`: `当前产品` `h2`.
- `ProductRoadmap`: `未来产品规划` `h2`.
- `DigitalDelivery`: `产品如何被交付` `h2` and `清晰边界，持续演进。` display `p`.

Leave product-name headings, status labels, section navigation, and English `GAOGE DIGITAL` unchanged.

- [ ] **Step 4: Apply the token to `/content` page-level display headings**

Add `font-display-cn` and `tracking-[-0.025em]` to:

- `ContentHero`: hero Chinese `h2`.
- `ContentBelief`: the multi-line belief `h2`.
- `ContentValue`: the closing value-statement `h2`.

Leave capability-item headings in `ContentCapabilities`, body copy, section navigation, and English `GAOGE CONTENT` unchanged.

- [ ] **Step 5: Format the touched source files**

Run:

```bash
pnpm exec prettier --write \
  apps/brand/tailwind.config.ts \
  apps/brand/src/pages/group/components/BusinessCapabilities.tsx \
  apps/brand/src/pages/group/components/ContentStructure.tsx \
  apps/brand/src/pages/group/components/DeliveryModel.tsx \
  apps/brand/src/pages/group/components/DigitalStructure.tsx \
  apps/brand/src/pages/group/components/GroupHero.tsx \
  apps/brand/src/pages/group/components/GroupVision.tsx \
  apps/brand/src/pages/group/components/LeadershipStructure.tsx \
  apps/brand/src/pages/group/components/LeagueBoard.tsx \
  apps/brand/src/pages/group/components/SportsStructure.tsx \
  apps/brand/src/pages/digital/components/CurrentProducts.tsx \
  apps/brand/src/pages/digital/components/DigitalDelivery.tsx \
  apps/brand/src/pages/digital/components/DigitalHero.tsx \
  apps/brand/src/pages/digital/components/ProductRoadmap.tsx \
  apps/brand/src/pages/content/components/ContentBelief.tsx \
  apps/brand/src/pages/content/components/ContentHero.tsx \
  apps/brand/src/pages/content/components/ContentValue.tsx
```

- [ ] **Step 6: Audit scope before running the application checks**

Run:

```bash
git diff --check
git diff -- apps/brand/tailwind.config.ts apps/brand/src/pages/group/components apps/brand/src/pages/digital/components apps/brand/src/pages/content/components
rg -n 'font-display-cn|tracking-\[-0\.0(5|6|65|7|8)em\]' \
  apps/brand/src/pages/group/components \
  apps/brand/src/pages/digital/components \
  apps/brand/src/pages/content/components
```

Expected: every intended display element has `font-display-cn` and `tracking-[-0.025em]`; remaining tighter tracking belongs only to explicitly excluded information-level or Latin/numeric elements.

- [ ] **Step 7: Run the required brand verification**

Run each command and require exit code `0`:

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
```

Then verify the generated CSS contains the utility and no new font resources were added:

```bash
rg -n "Source Han Sans CN|font-display-cn" apps/brand/dist/assets
git status --short
```

Expected: typecheck, tests, and build pass; the generated CSS contains the Source Han/Noto fallback stack; no `.woff`, `.woff2`, `.otf`, or `.ttf` files appear as new changes.

- [ ] **Step 8: Check knowledge-base impact**

Call `impact_for_changes` for `apps/brand/tailwind.config.ts` and the changed `/group`, `/digital`, and `/content` component paths. If no canonical brand typography page is mapped, report that no knowledge-maintenance follow-up is required for this scoped implementation.

- [ ] **Step 9: Commit the implementation**

Stage only the plan and implementation files, then commit:

```bash
git add \
  docs/superpowers/plans/2026-08-10-brand-chinese-display-typography.md \
  apps/brand/tailwind.config.ts \
  apps/brand/src/pages/group/components/BusinessCapabilities.tsx \
  apps/brand/src/pages/group/components/ContentStructure.tsx \
  apps/brand/src/pages/group/components/DeliveryModel.tsx \
  apps/brand/src/pages/group/components/DigitalStructure.tsx \
  apps/brand/src/pages/group/components/GroupHero.tsx \
  apps/brand/src/pages/group/components/GroupVision.tsx \
  apps/brand/src/pages/group/components/LeadershipStructure.tsx \
  apps/brand/src/pages/group/components/LeagueBoard.tsx \
  apps/brand/src/pages/group/components/SportsStructure.tsx \
  apps/brand/src/pages/digital/components/CurrentProducts.tsx \
  apps/brand/src/pages/digital/components/DigitalDelivery.tsx \
  apps/brand/src/pages/digital/components/DigitalHero.tsx \
  apps/brand/src/pages/digital/components/ProductRoadmap.tsx \
  apps/brand/src/pages/content/components/ContentBelief.tsx \
  apps/brand/src/pages/content/components/ContentHero.tsx \
  apps/brand/src/pages/content/components/ContentValue.tsx
git commit -m "style(brand): refine Chinese display typography"
```
