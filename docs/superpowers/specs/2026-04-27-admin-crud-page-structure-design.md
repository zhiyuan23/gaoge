# Admin CRUD Page Structure Design

Date: 2026-04-27

## Goal

Define a standard frontend structure for CRUD pages in `apps/admin`, using the player page as the first concrete example.

This design focuses only on the admin project. It does not attempt to create a cross-app abstraction for `web` or `miniapp`.

## Why This Work

The current player page has already moved in the right direction by separating page orchestration from some business details, but two issues remain:

- Page-level concerns are not separated consistently. Search config, table config, form model factories, and row-to-form mapping are still mixed in `constants.ts`.
- The create/edit dialog is still implemented as one business component that combines dialog shell, form rendering, validation, and payload building.

If this structure is copied into more modules as-is, the admin app will end up with repeated but slightly different CRUD page patterns. That would make later extraction harder, not easier.

## Scope

Included:

- Define a standard directory layout for admin CRUD pages.
- Define naming rules for business form components and dialog components.
- Define which concerns should move into `schemas`, `model`, `components`, and page orchestration.
- Define a lightweight reusable CRUD page behavior layer for admin list pages.
- Define which generic components should exist now and which should not.

Not included:

- Build a fully schema-driven `CrudPage` renderer.
- Build a generic form renderer equivalent to `EsSearch`.
- Define cross-platform abstractions for `web` or `miniapp`.
- Refactor every existing admin page in this round.

## Design Principles

### Reuse Behavior, Not Business Shape

CRUD pages in admin share behavior more reliably than they share field structure. Search, pagination, dialog open-close flow, submit loading, and refresh-after-submit are stable patterns. Table columns, form layout, validation, and field-level interaction are more business-specific.

The design therefore standardizes page orchestration and folder boundaries first, while keeping business schema and form UI inside each module.

### Prefer Clear Boundaries Over Maximum Configurability

The goal is not to build a low-code engine. The goal is to make the next admin CRUD page easy to add, easy to read, and easy to evolve.

This means:

- `index.vue` should assemble a page, not define all details inline.
- Config files should stay declarative.
- Mapping logic should be isolated instead of hidden inside constants.
- Generic components should stay thin and predictable.

### Admin-Only Optimization

This structure is allowed to align directly with `apps/admin` conventions, Vue 3, and Element Plus. It does not need to preserve compatibility with other frontend runtimes.

## Standard Module Structure

Each admin CRUD module should use the following layout:

```text
views/<domain>/<module>/
  index.vue
  components/
    <Entity>Form.vue
    <Entity>FormDialog.vue
  schemas/
    search.ts
    table.ts
    form.ts
  model/
    types.ts
    mapper.ts
  services/
    options.ts
  auth.ts
  formatters.ts
```

Example for `player`:

```text
views/gaoge/player/
  index.vue
  components/
    PlayerForm.vue
    PlayerFormDialog.vue
  schemas/
    search.ts
    table.ts
    form.ts
  model/
    types.ts
    mapper.ts
  services/
    options.ts
  auth.ts
  formatters.ts
```

## Directory Responsibilities

### `index.vue`

`index.vue` is the page assembler. It should coordinate page state, wire API calls, connect reusable components, and render page-level slots.

It should own:

- `search`
- `page`
- `pageSize`
- `tableData`
- `total`
- `loading`
- `submitLoading`
- `dialogVisible`
- `dialogMode`
- `currentRow`

It should call:

- list fetch
- delete action
- create or update submit
- permission guards

It should not define:

- large field schema objects
- table column arrays
- form default factories
- row-to-form or form-to-payload conversion logic

### `components/`

`<Entity>Form.vue` is the business form body.

Responsibilities:

- render form items
- own form validation rules if they are tightly coupled to fields
- expose or emit validated form data
- receive business options as props

`<Entity>FormDialog.vue` is the business dialog container.

Responsibilities:

- dialog title
- dialog open-close bridge
- submit button area
- loading state bridge
- compose dialog shell with `<Entity>Form.vue`

This split avoids coupling the business form to one presentation shell. If the same form later needs drawer or full-page editing, the form body remains reusable.

### `schemas/`

This folder contains declarative configuration only.

`search.ts`:

- search default values
- search field config factory

`table.ts`:

- table column config

`form.ts`:

- form default values
- static field option constants
- form-only declarative metadata if needed

`schemas/*` should not contain API calls, mutable page state, or row-to-payload transformation code.

### `model/`

This folder isolates page-level business data transformation.

`types.ts`:

- page-internal types that do not belong in shared packages

`mapper.ts`:

- `createEmptyForm()`
- `createFormFromRow()`
- `buildPayload()`
- field normalization helpers

If a module does not need a dedicated `types.ts`, it may omit that file. If the mapping logic stays non-trivial, `mapper.ts` should still exist.

### `services/`

This folder contains page-local service helpers that are not the primary REST API client.

Typical examples:

- option list preparation
- dictionary normalization
- remote select option loading

`services/options.ts` is the default starting point for CRUD pages that need dynamic select data. If a module has no local service helpers yet, this folder may be omitted until needed.

### `auth.ts`

This file defines module-local permission constants and helpers such as `usePlayerAuth()`.

Permission naming and visibility logic should stay close to the module instead of leaking into generic user-store APIs.

### `formatters.ts`

This file holds display-only logic:

- label mapping
- tag type mapping
- date formatting
- other presentation helpers

It should not contain form normalization or API payload logic.

## Naming Rules

### Business Components

Use explicit business names:

- `PlayerForm.vue`
- `PlayerFormDialog.vue`

This is preferred over keeping everything inside a single `PlayerFormDialog.vue`.

Reason:

- `PlayerForm.vue` describes business content.
- `PlayerFormDialog.vue` describes business content plus shell choice.

That gives a clean upgrade path if the shell changes later.

### Generic Components

Current generic components may keep their existing names temporarily:

- `EsSearch`
- `EsTable`

They are already referenced broadly enough that immediate renaming would create churn without enough architectural payoff.

However, the design formally treats them as admin CRUD foundation components rather than one-off helpers. If the naming is revisited later, the target direction should be role-based names such as:

- `CrudSearch` or `AdminSearchForm`
- `CrudTable` or `AdminDataTable`

That rename is intentionally deferred until the CRUD pattern stabilizes across more than one module.

## Reusable Component Strategy

### Keep `EsSearch`

`EsSearch` remains the standard search area renderer for admin CRUD pages.

Why it is a good generic component:

- search fields are comparatively shallow
- interactions are uniform
- layout is predictable
- field differences are manageable through schema

### Keep `EsTable`

`EsTable` remains the standard table and pagination renderer for admin CRUD pages.

Why it is a good generic component:

- column rendering and pagination are stable concerns
- business-specific rendering already fits naturally into slots

### Add A Thin Dialog Shell

Add a lightweight reusable dialog-form shell, with a name such as:

- `EsFormDialogShell`
- or `EsDialogForm`

Recommended responsibility:

- standard title area
- standard footer buttons
- standard confirm/cancel handling
- loading binding
- `modelValue` binding
- content slot for business form body

This component should not know business fields, validation rules, or payload shapes.

### Do Not Add A Generic `EsForm` Yet

Do not build a full schema-driven form renderer in this phase.

Reason:

- business edit forms vary more than search forms
- validation coupling is stronger
- field linkage is more common
- custom layout needs are higher

Creating a generic admin form renderer now would likely overfit the current player page and slow down later modules that need exceptions.

The correct current boundary is:

- generic search renderer
- generic table renderer
- generic dialog shell
- business form body per module

## Lightweight CRUD Behavior Layer

Admin CRUD pages should share a thin behavior abstraction, preferably a composable such as `useCrudPage` or `useCrudListPage`.

This composable should unify common list-page behavior, not full business definition.

Recommended responsibilities:

- hold `page`, `pageSize`, `loading`, `submitLoading`
- hold `dialogVisible`, `dialogMode`, `currentRow`
- expose `handleSearch`
- expose `handlePaginationChange`
- expose `openCreate`
- expose `openEdit`
- expose refresh-after-submit flow
- optionally expose empty-page-after-delete correction

It should not:

- own search schema
- own table columns
- own business form schema
- decide API payload shape
- decide permission rules

This keeps the abstraction at the workflow layer, which is the part most likely to remain stable across modules.

## Player Page Refactor Direction

The player page should evolve from:

- one large `constants.ts`
- one mixed `PlayerFormDialog.vue`

to:

- `schemas/search.ts`
- `schemas/table.ts`
- `schemas/form.ts`
- `model/mapper.ts`
- `components/PlayerForm.vue`
- `components/PlayerFormDialog.vue`

Concrete migration guidance:

### Move Search Definitions

Move:

- `PlayerSearch`
- `PLAYER_DEFAULT_SEARCH`
- `createPlayerSearchFields()`

into `schemas/search.ts`.

### Move Table Definitions

Move:

- `PLAYER_TABLE_COLUMNS`

into `schemas/table.ts`.

### Move Form Defaults And Static Options

Move:

- `PLAYER_STATUS_OPTIONS`
- form default values

into `schemas/form.ts`.

### Move Mapping Logic

Move:

- `createEmptyPlayerForm()`
- `createPlayerFormFromRow()`
- payload normalization logic

into `model/mapper.ts`.

Payload-building logic should no longer live inside the dialog component.

### Split Form And Dialog

Create:

- `components/PlayerForm.vue`
- `components/PlayerFormDialog.vue`

`PlayerForm.vue` should render the actual form and expose validated submission data.

`PlayerFormDialog.vue` should coordinate dialog shell concerns and emit the final `submit` event to the page.

## Expected Benefits

For developers:

- faster onboarding into each CRUD module
- lower chance of page logic collapsing back into `index.vue`
- clearer search/table/form ownership
- easier future extraction of a shared CRUD behavior composable

For the codebase:

- less repeated ad hoc CRUD structure
- less pressure to prematurely introduce a heavy schema engine
- cleaner path from one example page to a scalable admin convention

## Trade-Offs

### Why Not Build A Full `CrudPage`

Because it would force unstable business differences into a common API too early. That would optimize for generation speed at the cost of clarity and changeability.

### Why Add More Files

Because the current coupling problem is not caused by too many files. It is caused by too many responsibilities per file. The proposed split creates smaller units with clearer reasons to change.

### Why Delay Renaming `EsSearch` And `EsTable`

Because the value of renaming is semantic clarity, not behavior. That clarity matters, but not enough to justify immediate broad churn while the pattern is still being proven.

## Implementation Guidance

The implementation plan for this design should focus on the player page first and use it as the admin CRUD reference module.

Suggested order:

1. Split `player/constants.ts` into `schemas/*` and `model/mapper.ts`.
2. Extract `PlayerForm.vue` from `PlayerFormDialog.vue`.
3. Introduce a thin dialog shell if the split reveals repeated dialog footer/title behavior worth standardizing immediately.
4. Evaluate whether player page state flow is ready to move into a `useCrudPage` composable after the structural split is complete.

The plan should not try to solve all admin CRUD modules in one implementation pass.

## Final Decision

Use a standard admin CRUD module structure built around:

- page assembly in `index.vue`
- declarative schema files
- dedicated mapping layer
- business form body plus business dialog wrapper
- thin reusable CRUD foundation components
- optional lightweight CRUD page composable for workflow reuse

This is the preferred design because it improves consistency and scalability for `apps/admin` without over-abstracting current business pages.
