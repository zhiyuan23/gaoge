# Admin App Setting Motion and Horizontal Masonry Design

> **Status: Not implemented.** The fade-only plus `ResizeObserver` Masonry proposal is not part of source revision `d9567ea0845965b08e36519129b2941dd23358d4` or the synchronized gaoge-club, gaoge-compass, and gaoge-crm worktrees.

## Context

The development-only application settings UI now uses `FaModal` and seven `FaPageMain` panels. Two presentation details still need refinement:

- The shared dialog content animation combines fade, zoom, and a slight vertical slide, so this large settings modal appears to enter from above.
- The PC panel container uses CSS multi-column layout. It packs panels compactly, but source order flows down the first column before continuing in the second column.

The requested result is a locally fading settings modal and a PC masonry layout whose placement begins in horizontal source order while retaining compact packing.

## Goals

- Make only the application settings modal use a 200 ms fade-in and fade-out animation.
- Remove zoom and directional movement from this modal without changing the shared `FaModal` default.
- Lay out the seven PC panels in a two-column, horizontally seeded masonry grid.
- Preserve the existing single-column mobile layout.
- Preserve every configuration field, binding, visibility rule, disabled state, footer action, and copy interaction.

## Non-goals

- Do not change shared modal APIs or animations used by other dialogs.
- Do not reorder the seven panels in the template or change their grouping.
- Do not add a masonry dependency or introduce a reusable layout abstraction.
- Do not change panel visuals, modal dimensions, settings persistence, menu behavior, or other applications.

## Modal Motion

`AppSetting` will override the transform-related animation utilities through its existing `FaModal.class` value:

- Keep the shared `animate-in`, `animate-out`, `fade-in-0`, `fade-out-0`, and 200 ms duration.
- Override the open and closed zoom values to 100%, making scale constant.
- Override the vertical slide values to zero, making position constant.
- Keep the overlay's existing 200 ms fade behavior.

The override is local to `AppSetting`; `FaModal`, `DialogContent`, and all other consumers remain unchanged.

## Horizontal Masonry Layout

### Source and reading order

The template order remains:

1. Navigation menu
2. Topbar
3. Tabbar
4. Toolbar
5. Theme
6. Page
7. Application

This remains the DOM, keyboard, and screen-reader order. On PC, the grid considers panels in that sequence and uses dense placement to fill the earliest available space in either column.

### Grid structure

Replace the current `columns-2` container with a local settings-panel grid:

- PC baseline: two equal-width columns with 16 px horizontal and vertical gaps.
- PC masonry-ready state: small implicit row tracks, dense auto-placement, and calculated row spans.
- Mobile: one normal vertical column with 16 px gaps and no calculated row spans.
- Remove panel bottom margins and multi-column-only `break-inside` behavior so spacing has a single owner.

### Dynamic height measurement

Panel heights vary by content, device mode, and conditional controls. A component-local `ResizeObserver` will observe the seven rendered panel root elements while the modal is open.

For each PC panel, the observer will:

1. Read the rendered panel height.
2. Convert it to an implicit grid-row span using the configured row size and row gap.
3. Apply `grid-row-end: span N` directly to that panel.

The observer starts after the modal content is mounted, marks the grid as masonry-ready, reacts to panel or viewport-driven size changes, and disconnects when the modal closes or the component unmounts. Mobile mode removes calculated row spans and uses normal document flow.

No settings data or business state is stored in the layout measurement.

## Component Boundaries

Only `apps/admin/src/layouts/components/AppSetting/index.vue` changes:

- Script: local observer lifecycle and row-span calculation.
- Template: modal animation overrides, grid ref, and responsive grid classes.
- Scoped style: PC masonry tracks and mobile single-column rules.

No shared component, store, type, route, or theme contract changes.

## Edge Cases

- Opening the modal starts observation only after teleported dialog content is available.
- Closing and reopening does not retain stale observers.
- Switching between PC and mobile mode recalculates or clears spans.
- Conditional PC-only controls can change panel height without overlapping later panels.
- Dark and light themes do not affect measurements or require hard-coded colors.
- If `ResizeObserver` is unavailable, the masonry-ready state is not enabled and panels remain usable in a standard two-column Grid; only compact vertical packing degrades.

## Verification

Static verification:

- Format the changed Vue file and this spec.
- Run focused ESLint and Stylelint for `AppSetting`.
- Run Admin typecheck and production build.
- Run `git diff --check`.

Browser verification:

- Opening and closing AppSetting uses fade only, without zoom or directional movement.
- Other modals keep their existing shared animation.
- PC shows a compact two-column layout seeded from horizontal source order with no panel overlap.
- Resizing the viewport and changing representative settings updates placement without visible stale gaps or collisions.
- Mobile uses one column without horizontal overflow.
- Light and dark themes remain readable.
- All seven panels, the footer notice, copy action, and existing setting behavior remain intact.

## Decision Record

- Use the approved horizontal masonry direction rather than standard row Grid or the current vertical CSS columns.
- Use local CSS Grid plus `ResizeObserver`; add no third-party dependency.
- Keep the animation override local to AppSetting.
- Preserve DOM order and configuration behavior.
