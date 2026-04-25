# EsSearch And Player List Design

Date: 2026-04-25

## Goal

Rebuild `EsSearch` as a standard Element Plus search component for admin list pages, keep the existing `EsTable`, and refactor the player page into a reusable example of the list page pattern.

This work intentionally stops short of building a full `EsListPage` wrapper. The output should make that future wrapper straightforward by stabilizing the search field config, table column config, permissions, data flow, and API response shape.

## Scope

Included:

- Rewrite `apps/admin/src/components/common/EsSearch`.
- Keep `EsTable` as the table component.
- Refactor `apps/admin/src/views/gaoge/player` into focused files.
- Change player list API to server-side filtering and pagination.
- Return player list data as `{ list, total }`.

Not included:

- Build `EsListPage`.
- Build a reusable list-query composable.
- Add remote option loading inside `EsSearch`.
- Replace unrelated list pages.

## Architecture

`EsSearch` is a UI component. It renders search fields from config, manages form state, emits search/reset/change events, and exposes an `actions` slot. It does not fetch data and does not know about tables.

`EsTable` remains the table renderer. It receives `columns`, `data`, `total`, pagination values, and loading state from the page.

The player page becomes the first standard usage:

- `constants.ts` holds pure configuration and defaults.
- `auth.ts` holds permission codes and player-specific auth helpers.
- `formatters.ts` holds display formatting helpers.
- `PlayerFormDialog.vue` owns the create/edit form UI and validation.
- `index.vue` coordinates search, pagination, API calls, table slots, and row actions.

This keeps reusable configuration separate from page orchestration while avoiding a premature higher-level page abstraction.

## EsSearch Component

### Field Types

The first version supports:

- `input`
- `select`
- `multiSelect`
- `number`
- `numberRange`
- `date`
- `dateRange`
- `switch`
- `custom`

### Field Config

`SearchField` should support:

- `key`: form field name.
- `label`: displayed label.
- `type`: field type.
- `placeholder`: control placeholder.
- `defaultValue`: reset value.
- `span`: Element Plus grid span for this field.
- `hidden`: hide field.
- `clearable`: common control behavior.
- `props`: passthrough props for the rendered Element Plus control.
- `options`: `SearchOption[] | (() => SearchOption[])` for option controls.
- `component`, `componentProps`, `componentEvents`: custom component support.
- `slot`: named slot support for custom rendering.

`SearchOption` should use:

- `label`
- `value`
- `disabled`
- optional `children` for future compatibility, though cascader is not part of this first version.

### Props And Emits

Core props:

- `fields`
- `modelValue`
- `columns`
- `gutter`
- `labelWidth`
- `showSearch`
- `showReset`
- `showCollapse`
- `defaultVisibleCount`
- `autoSearch`
- `searchDelay`
- `searchText`
- `resetText`

Core emits:

- `update:modelValue`
- `search`
- `reset`
- `change`
- `collapseChange`

### Behavior

Default mode is manual search:

- Editing fields updates internal state and emits `change`.
- Clicking search emits `update:modelValue` and `search`.
- Clicking reset restores every field to its `defaultValue`, emits `update:modelValue`, `reset`, and `search`.

Auto mode is optional:

- With `autoSearch` enabled, field changes trigger debounced `search`.
- Manual search and reset buttons can still be displayed unless disabled through props.

Collapse behavior:

- If field count exceeds `defaultVisibleCount`, show expand/collapse.
- Hidden fields are never rendered.
- Collapsed state emits `collapseChange`.

Actions:

- The component provides an `actions` slot near the built-in buttons.
- Player uses this slot for the "新增球员" button.

## Player Module Structure

### constants.ts

Exports:

- `PLAYER_DEFAULT_SEARCH`
- `PLAYER_STATUS_OPTIONS`
- `PLAYER_TABLE_COLUMNS`
- `createEmptyPlayerForm()`
- `createPlayerSearchFields(ctx)`

`createPlayerSearchFields(ctx)` receives dynamic options:

- `subTeamOptions`
- `positionOptions`
- `statusOptions`

It returns `SearchField[]` and can use option functions so the search component sees current option values without rebuilding business logic in `index.vue`.

### auth.ts

Exports:

- `PLAYER_PERMISSIONS`
- `PLAYER_MANAGE_PERMISSIONS`
- `usePlayerAuth()`

`usePlayerAuth()` uses the existing global auth/permission system and returns:

- `canCreatePlayer`
- `canUpdatePlayer`
- `canDeletePlayer`
- `canManagePlayers`

Player-specific permission knowledge should move out of `useUserStore`. The store should keep generic account, token, role, and permission state.

### formatters.ts

Exports:

- `formatDateTime`
- `formatBirthDate`
- `getPlayerStatusLabel`
- `getPlayerStatusTagType`

These helpers keep display rules out of `index.vue` and can be reused by the form or future player detail pages.

### PlayerFormDialog.vue

Responsibilities:

- Render create/edit dialog.
- Maintain local form model.
- Validate required fields.
- Build and emit `PlayerPayload`.
- Receive dynamic select options from parent.

Props:

- `modelValue`
- `mode`
- `player`
- `subTeamOptions`
- `positionOptions`
- `statusOptions`
- `loading`

Emits:

- `update:modelValue`
- `submit`

The parent decides whether submit means create or update.

### index.vue

Responsibilities:

- Maintain `search`, `page`, `pageSize`, `tableData`, `total`, `loading`, and dialog state.
- Call `playersApi.list({ page, pageSize, ...search })`.
- Reset to page 1 when search changes.
- Fetch again on table pagination changes.
- Refresh after create, update, and delete.
- Render table slots for avatar, status, admin flag, dates, and actions.
- Use `usePlayerAuth()` for visible actions and runtime guards.

## Player API

### Frontend

`playersApi.list(params?: PlayerListParams)` returns:

```ts
Promise<{ list: Player[]; total: number }>
```

`PlayerListParams` includes:

- `page?: number`
- `pageSize?: number`
- `keyword?: string`
- `subTeam?: string`
- `position?: string`
- `status?: string`

### Backend

`GET /players` accepts the same query params.

Defaults:

- `page = 1`
- `pageSize = 15`
- Invalid page values fall back to defaults

Filtering:

- `keyword` fuzzy matches `nickname`, `realName`, `openid`, `position`, and `subTeam`.
- `subTeam`, `position`, and `status` are exact matches.

Sorting:

- Preserve current ordering: `createdAt desc`.

Response:

```ts
{
  list: Player[]
  total: number
}
```

## Validation

Automated checks:

- `pnpm --filter @gaoge/app-admin typecheck`
- `pnpm --filter @gaoge/app-api typecheck` or the nearest available API type/build script.

Manual checks:

- Initial player list loads.
- Keyword search works.
- Sub-team, position, and status filters work.
- Reset clears filters, returns to page 1, and refreshes.
- Pagination and page-size changes fetch the expected page.
- Create, update, and delete refresh the list.
- Users without player permissions do not see create/edit/delete actions.
- Runtime action handlers still guard permissions.

## Future EsListPage Path

After this design is implemented and used in one or two pages, a future `EsListPage` can wrap the stable composition:

- `EsSearch`
- `EsTable`
- pagination state
- loading state
- fetch/reset/search conventions

This should wait until at least the player page proves the config shapes are comfortable.
