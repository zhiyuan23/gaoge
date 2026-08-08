# Gaoge Brand Organization Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the public Gaoge homepage and group page with the confirmed four-division organization and enterprise delivery model.

**Architecture:** Keep the existing React routes, dark visual system, homepage capability dialog, and group-page orbit. Replace the obsolete `future` model with `film`, add two group-page presentation components fed by static typed data, and update public copy without creating a film route.

**Tech Stack:** React 18, React Router 6, TypeScript, Tailwind CSS, shared CSS, Framer Motion, Vitest, Testing Library

## Global Constraints

- Preserve the existing `/`, `/group`, `/digital`, and `/content` routes.
- Do not create a `/film` route or modify the sports application.
- Preserve all pre-existing uncommitted user changes in `apps/brand`.
- Keep `高歌影视` non-interactive where no formal page exists.
- Remove public references to `未来领域`, `未来`, and `高歌小绿本` from the homepage and group page.
- Keep the group page dark with sage green as its only accent.
- Keep the 20-seat league board and do not restore the removed management team section.
- Do not add dependencies or create shared-package abstractions.
- Do not create implementation commits while the working tree contains the user's in-scope changes; leave the final diff for user review.

---

## File Map

- Modify `apps/brand/src/brand/components/BrandNavigation.tsx`: replace future capability with film and update all four public capability definitions.
- Modify `apps/brand/src/concepts/skiing/SkiingPage.tsx`: update homepage metadata.
- Modify `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`: add the film signal and update homepage positioning copy.
- Modify `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`: verify all four signals.
- Modify `apps/brand/src/pages/group/types.ts`: define confirmed industry, business capability, and delivery model types.
- Modify `apps/brand/src/pages/group/data.ts`: publish the confirmed four divisions, enterprise capabilities, delivery modes, and sports descriptions.
- Modify `apps/brand/src/pages/group/data.test.ts`: lock the new organization facts.
- Modify `apps/brand/src/pages/group/components/GroupHero.tsx`: update group positioning copy.
- Modify `apps/brand/src/pages/group/components/IndustryOrbit.tsx`: display division nature and remove future/alias behavior.
- Create `apps/brand/src/pages/group/components/BusinessCapabilities.tsx`: render the three enterprise delivery divisions as an editorial index.
- Create `apps/brand/src/pages/group/components/DeliveryModel.tsx`: render direct purchase, group coordination, and sports relationship.
- Modify `apps/brand/src/pages/group/components/SportsStructure.tsx`: state the nonprofit sports positioning and truthful entity descriptions.
- Modify `apps/brand/src/pages/group/GroupPage.tsx`: compose the new sections, remove future territory, and update metadata.
- Modify `apps/brand/src/styles.css`: place the fourth homepage signal and remap the orbit's fourth slot from future to film.
- Modify `apps/brand/src/App.test.tsx`: verify homepage dialogs, group organization, service capabilities, delivery model, and removed obsolete copy.

---

### Task 1: Replace obsolete organization data with the confirmed model

**Files:**

- Modify: `apps/brand/src/pages/group/types.ts`
- Modify: `apps/brand/src/pages/group/data.ts`
- Test: `apps/brand/src/pages/group/data.test.ts`

**Interfaces:**

- Produces: `GroupIndustry`, `BusinessCapability`, `DeliveryModel`, `groupIndustries`, `businessCapabilities`, `deliveryModels`.
- Preserves: `GroupLeader`, `LeagueDirector`, `SportsEntity`, `groupLeaders`, `leagueDirectors`, `sportsEntities` for compatibility and existing data tests.

- [ ] **Step 1: Rewrite the organization-data assertions**

Assert the exact industry order and public nature:

```ts
expect(groupIndustries).toEqual([
  expect.objectContaining({ id: 'digital', name: '高歌数字', nature: '企业服务' }),
  expect.objectContaining({ id: 'content', name: '高歌内容', nature: '企业服务' }),
  expect.objectContaining({
    id: 'film',
    name: '高歌影视',
    nature: '企业服务 · 自主创作',
  }),
  expect.objectContaining({ id: 'sports', name: '高歌体育', nature: '非营利' }),
])
expect(groupIndustries.some(({ name }) => name.includes('小绿本'))).toBe(false)
```

Add assertions that `businessCapabilities` contains `digital`, `content`, and `film`, and that `deliveryModels` contains `direct`, `coordinated`, and `sports-support`.

- [ ] **Step 2: Run the focused data test and confirm the old model fails**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts
```

Expected: FAIL because `film`, `nature`, `businessCapabilities`, and `deliveryModels` do not exist.

- [ ] **Step 3: Implement the confirmed typed model**

Use these type boundaries:

```ts
export interface GroupIndustry {
  readonly description: string
  readonly id: 'digital' | 'content' | 'film' | 'sports'
  readonly name: string
  readonly nature: '企业服务' | '企业服务 · 自主创作' | '非营利'
}

export interface BusinessCapability {
  readonly capabilities: readonly string[]
  readonly description: string
  readonly id: 'digital' | 'content' | 'film'
  readonly name: string
  readonly positioning: string
}

export interface DeliveryModel {
  readonly description: string
  readonly id: 'direct' | 'coordinated' | 'sports-support'
  readonly name: string
}
```

Set the four industry descriptions to the confirmed public positioning. Set the sports entities to:

```ts
;[
  {
    description: '集团全资运营的非营利球队，参加业余联赛和友谊赛。',
    id: 'club',
    name: '高歌 FC',
  },
  {
    description: '面向球友的内部联赛与社区赛事品牌，不作为商业赛事产品。',
    id: 'league',
    name: '高歌超级联赛',
  },
]
```

- [ ] **Step 4: Run the focused data test**

Run the same command. Expected: PASS with the new four-division model and the existing 20 directors unchanged.

---

### Task 2: Align homepage navigation, copy, and four capability signals

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/concepts/skiing/SkiingPage.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`
- Modify: `apps/brand/src/styles.css`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Changes `CapabilityArea` to `'digital' | 'content' | 'film' | 'sports'`.
- Preserves `BrandNavigationHandle.openCapability(area, trigger)` and the existing native-dialog lifecycle.

- [ ] **Step 1: Update homepage tests for the four confirmed divisions**

Require visible signals:

```ts
;['DIGITAL', 'CONTENT', 'FILM', 'SPORTS', '企业软件', '内容运营', '专业影像', '体育社区'].forEach(
  (label) => expect(screen.getByText(label)).toBeInTheDocument(),
)
```

Require navigation buttons `数字`, `内容`, `影视`, `体育`, no `未来`, and add `['打开影视能力说明', '影视']` to the hero dialog table test. In the dialog sequence, assert `专业影像与作品开发` and the confirmed film description.

Update `SkiingHero.test.tsx` to expect four signals and four mobile/desktop dividers.

- [ ] **Step 2: Run the homepage-focused tests and confirm failure**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx src/concepts/skiing/components/SkiingHero.test.tsx
```

Expected: FAIL because the current UI still renders future and has no film signal.

- [ ] **Step 3: Implement navigation and capability copy**

Replace the `future` definition with:

```ts
{
  description: '制作企业宣传片、品牌片和专业影像，并长期开发自主影视作品。',
  key: 'film',
  label: '影视',
  status: '专业影像与作品开发',
}
```

Use the approved digital, content, and sports copy from the design spec. On formal non-home pages, render film as a non-link `<span aria-label="影视，独立页面筹备中">`.

- [ ] **Step 4: Add the homepage film signal and revised positioning**

Add:

```tsx
<BrandSignal
  ariaLabel="打开影视能力说明"
  className="hero-signal--film absolute left-4 top-24 z-10 md:left-20 md:top-[13%]"
  dividerClassName="rotate-[-20deg]"
  dividerPosition="after"
  label="专业影像"
  onClick={(event) => navigationRef.current?.openCapability('film', event.currentTarget)}
  value="FILM"
/>
```

Change the remaining labels to `企业软件`, `内容运营`, and `体育社区`. Update the Chinese hero copy and page description to mention enterprise software, content operation, professional imagery, and the nonprofit sports community.

In the short landscape media query, position `.hero-signal--film` at `top: 6rem; left: 1rem;` opposite sports.

- [ ] **Step 5: Run homepage tests**

Run the focused command again. Expected: PASS with four signals and no future capability.

---

### Task 3: Recompose the group page around services, nonprofit sports, and joint delivery

**Files:**

- Modify: `apps/brand/src/pages/group/components/GroupHero.tsx`
- Modify: `apps/brand/src/pages/group/components/IndustryOrbit.tsx`
- Create: `apps/brand/src/pages/group/components/BusinessCapabilities.tsx`
- Create: `apps/brand/src/pages/group/components/DeliveryModel.tsx`
- Modify: `apps/brand/src/pages/group/components/SportsStructure.tsx`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/styles.css`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- `BusinessCapabilities` consumes `readonly BusinessCapability[]`.
- `DeliveryModel` consumes `readonly DeliveryModel[]` under the local prop name `models`.
- `IndustryOrbit` continues consuming `readonly GroupIndustry[]`.

- [ ] **Step 1: Update group-route assertions**

Assert all four nodes are articles:

```ts
;['digital', 'content', 'film', 'sports'].forEach((industry) => {
  expect(document.querySelector(`[data-industry="${industry}"]`)?.tagName).toBe('ARTICLE')
})
```

Assert `高歌影视`, `企业服务能力`, `集团协同交付`, `非营利体育与球友社区`, and the three delivery headings. Assert `高歌小绿本`, `未来领域`, and `持续生长中的新领域` are absent.

- [ ] **Step 2: Run the group-route test and confirm failure**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL because the old orbit and future footer are still present and new sections are missing.

- [ ] **Step 3: Update the orbit and hero copy**

Render each node as:

```tsx
<article className="group-orbit-node flex min-h-36 flex-col p-5 md:min-h-0 md:p-4 lg:p-5">
  <span>{industry.name}</span>
  <span className="mt-2 text-[10px] tracking-[0.14em] text-[rgb(var(--brand-accent))]">
    {industry.nature}
  </span>
  <span className="mt-4 text-xs leading-5 text-[rgb(var(--brand-muted))]">
    {industry.description}
  </span>
</article>
```

Rename the CSS orbit slot selector from `future` to `film` and remove the dashed future-node rule. Update the hero paragraph to the approved group positioning without changing the headline or image.

- [ ] **Step 4: Build the enterprise capability index**

Create a semantic section headed `企业服务能力`. Render three vertically separated `<article>` rows with the division name and positioning on the left and description plus a short capability list on the right. Use an asymmetric desktop grid, plain spacing, and existing group tokens rather than three equal cards.

- [ ] **Step 5: Update nonprofit sports copy**

Add visible text `非营利体育与球友社区` above the sports description and state that the division serves participation, team building, internal competition, and community culture without a commercial revenue target. Continue mapping the two existing secure external links.

- [ ] **Step 6: Replace the future footer with the delivery model**

Create a semantic section headed `集团协同交付`. Render the three models in stable order:

```text
独立采购
集团统筹
体育内部支持
```

Update `GroupPage` order to `GroupHero`, `BusinessCapabilities`, `SportsStructure`, `LeagueBoard`, `DeliveryModel`. Remove the `future-title` section and update metadata to include all four divisions.

- [ ] **Step 7: Run group and full Brand tests**

Run:

```bash
pnpm --filter @gaoge/app-brand test
```

Expected: all Brand tests PASS, including 20 league board seats and no management-team section.

---

### Task 4: Engineering, visual, and knowledge-impact verification

**Files:**

- Review all modified `apps/brand` files.
- Review `docs/superpowers/specs/2026-08-08-gaoge-brand-organization-alignment-design.md`.

**Interfaces:**

- Consumes the final page implementation and repository-relative changed paths.
- Produces verification evidence and the knowledge-base review mode.

- [ ] **Step 1: Run formatting and static checks**

Run:

```bash
pnpm exec prettier --check apps/brand/src docs/superpowers/specs/2026-08-08-gaoge-brand-organization-alignment-design.md docs/superpowers/plans/2026-08-08-gaoge-brand-organization-alignment.md
pnpm --filter @gaoge/app-brand typecheck
```

Expected: both commands exit 0.

- [ ] **Step 2: Run automated tests and production build**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
```

Expected: all tests pass and Vite emits the production build without errors.

- [ ] **Step 3: Run the design preflight audit**

Mechanically search visible page strings for the removed terms and forbidden em dash:

```bash
rg -n "高歌小绿本|未来领域|持续生长中的新领域|—" apps/brand/src
```

Expected: no homepage or group-page matches. Review the final diff for consistent dark theme, one sage accent on group, valid links, reduced-motion coverage, and no new dependency.

- [ ] **Step 4: Inspect desktop and mobile pages**

Start the Brand development server and inspect `/` and `/group` at 1440×900, 390×844, and 320×800. Confirm no horizontal overflow, all four homepage signals remain readable, the group orbit collapses to a vertical relation, and the 20-seat board remains complete.

- [ ] **Step 5: Query knowledge impact**

Call `impact_for_changes` for all modified `apps/brand` paths. If the result is manual review only and the canonical group note already matches the implementation, do not duplicate the code change into the knowledge base; report that the page was aligned to the existing canonical note.
