# Admin Banner Card Page Design

## Background

Current `apps/admin` banner management uses the standard `EsTable` list. This is functionally complete, but it is not a good fit for banner assets because operators need to identify content primarily through images while still reading and acting on operational metadata.

The goal of this change is to replace the banner table body with a friendlier card-based management view, while preserving the existing search, create/edit dialog, delete flow, permissions, and request logic.

## Goals

- Make banner assets easier to identify through larger previews
- Preserve complete operational information on the main list view
- Keep edit and delete actions efficient and visually stable
- Reuse the current admin CRUD page structure as much as possible

## Non-goals

- No drag-and-drop sorting
- No inline editing
- No quick enable/disable action
- No API contract changes
- No new pagination or virtualization behavior

## Confirmed Direction

Use a horizontal media-card list instead of the current table.

This direction was chosen because it balances:

- stronger visual recognition than the current table
- fuller metadata exposure than an image-first card wall
- better action stability than dense grid cards

## Page Structure

The page structure stays aligned with current `apps/admin` conventions:

- Keep `EsSearch` as the query area
- Keep `EsListToolbar` with the existing `新增 Banner` action
- Replace the `EsTable` list body with a vertical card list
- Keep `BannerFormDialog` for create and edit
- Keep the existing delete confirmation flow

Only the list presentation layer changes. Search params, request flow, dialog flow, permissions, mapper logic, and payload handling remain unchanged.

## Card Layout

Each banner item uses a three-zone horizontal layout:

### 1. Preview Area

- Fixed-width banner thumbnail on the left
- Larger than the current table preview so the asset can be recognized quickly
- Keep a banner-like aspect ratio close to the real material
- Provide a stable fallback placeholder when the image cannot load

### 2. Information Area

Display the operational information directly on the card instead of hiding it in secondary interactions.

- First row: `title` and status tag
- Following rows:
  - sort
  - jump type
  - jump URL
  - updated time

Rules:

- Jump URL stays directly visible
- Long URLs are truncated visually but keep hover text
- If `jumpType === 'webview'` and `jumpUrl` exists, keep it clickable

### 3. Action Area

- Fixed action zone on the right
- Show `编辑` and `删除`
- Keep action layout visually separate from metadata
- Preserve existing permission gating from `auth.ts`

This prevents actions from drifting when the metadata block wraps.

## Responsive Behavior

Use a single-column vertical list, not a multi-column wall.

Reasons:

- admin management pages prioritize stable reading and operation over visual density
- banner metadata is too dense for a masonry/grid presentation
- single-column cards degrade more predictably on narrower widths

Responsive rules:

- Wide layout: `preview / info / actions` in one row
- Narrower layout: actions may move below the info block, but remain a separate grouped area

## States

### Loading

- Reuse the current page-level loading behavior
- Do not add a new skeleton-screen system in this change

### Empty State

- Replace the table-empty feel with a friendlier empty card-list state
- Keep the copy specific to banner management

### Refresh Behavior

- Keep current refresh behavior after create, edit, and delete
- No special optimistic UI behavior is added

## Data and Module Impact

### Files that stay

- `index.vue` remains the page composition layer
- `auth.ts` remains the permission source
- `schemas/search.ts` remains the search schema source
- `BannerForm.vue` and `BannerFormDialog.vue` remain unchanged in role
- `model/*` and mapper logic remain unchanged

### Files to add or change

- Add a page-private card component such as `components/BannerCard.vue`
- Update `index.vue` to render the card list instead of `EsTable`
- Extract or retain small shared display helpers as needed, for example time formatting

### Table schema handling

`schemas/table.ts` is no longer the primary list rendering contract once the card view lands.

Options during implementation:

- remove it if it becomes fully unused
- keep only narrow reusable display helpers if that is the cleanest incremental path

The implementation should prefer the smaller change that keeps the module readable.

## Implementation Notes

- Do not invent a new generic card-list framework for this task
- Keep the card as a page-private component first
- Keep current API usage and `useListPage` wiring
- Keep `destroy-on-close` dialog behavior unchanged

This is intentionally a targeted presentation refactor, not a page framework redesign.

## Verification

Minimum verification for the implementation phase:

- banner page renders the new card list correctly
- search by keyword/status/jump type still works
- create banner still opens and submits correctly
- edit banner still opens with the correct data
- delete banner still confirms and refreshes correctly
- permission-controlled actions still hide/show correctly
- long jump URLs do not break card layout
- narrow-width layout remains usable

## Risks

### Risk: layout becomes visually nicer but operationally slower

Mitigation:

- keep complete metadata directly visible
- keep actions in a fixed zone
- avoid decorative multi-column card walls

### Risk: page becomes a one-off pattern that diverges from admin conventions

Mitigation:

- keep `EsSearch`, toolbar, dialog, request flow, permissions, and module structure unchanged
- scope the customization only to the list body
