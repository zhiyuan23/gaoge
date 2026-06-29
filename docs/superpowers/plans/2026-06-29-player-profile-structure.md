# Player Profile Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend football player profiles with team relations, primary team, multi-position data, primary position, and a 15-character signature while keeping legacy `subTeam` and `position` compatibility.

**Architecture:** Keep stable contracts in `packages/shared/types`, persist team membership through Prisma `PlayerTeam`, and keep API orchestration inside `PlayerService`. Admin remains in the existing `sports/football/player` CRUD structure, using dynamic team options and the shared position dictionary.

**Tech Stack:** NestJS, Prisma 5, PostgreSQL, Jest, Vue 3, Element Plus, Vite, shared workspace TypeScript packages.

## Global Constraints

- `apps/*` must not directly depend on other apps.
- Shared contracts live in `packages/shared/types` and must stay runtime/framework independent.
- Preserve legacy database fields `Player.subTeam` and `Player.position`; do not delete them in this implementation.
- `primaryTeamId` may be null; if present it must be included in `teamIds`.
- `teamIds` must contain at least one valid team for admin create/update.
- `primaryPosition` may be null; if present it must be included in `positions`.
- `positions` must contain at least one valid football position for admin create/update.
- `signature` is nullable after trimming and must be at most 15 characters.
- Run focused API tests before implementation changes and again after code changes.

---

## File Structure

- Modify `packages/shared/types/src/player.ts`: add `FootballPosition`, position options, extended player fields, and list filters.
- Modify `packages/shared/types/src/auth.ts`: extend `MiniappPlayerSummary`.
- Modify `packages/shared/types/src/index.ts`: export any new player symbols through the existing barrel if needed.
- Modify `apps/api/prisma/schema.prisma`: add `Player.primaryTeamId`, `Player.positions`, `Player.primaryPosition`, `Player.signature`, `PlayerTeam`, and `Team` relations.
- Create `apps/api/prisma/migrations/20260629140000_extend_player_profile_structure/migration.sql`: database migration for new columns/table/indexes.
- Modify `apps/api/src/modules/sports/football/player/dto/create-player.dto.ts`: validate arrays, primary fields, and signature shape.
- Modify `apps/api/src/modules/sports/football/player/player.service.ts`: normalize payloads, validate teams/positions, include related teams in responses, rebuild `PlayerTeam` in transactions, and support `teamId`/`position` filtering.
- Modify `apps/api/src/modules/sports/football/player/player.service.spec.ts`: TDD coverage for validations, relation rebuild, and list include/filter.
- Modify `apps/api/src/modules/miniapp/miniapp.service.ts`: include and serialize expanded summary fields.
- Modify `apps/api/src/modules/miniapp/miniapp.service.spec.ts`: summary serialization coverage.
- Modify `apps/api/src/modules/auth/auth.service.ts`: include and serialize expanded summary fields.
- Modify `apps/api/src/modules/auth/auth.service.spec.ts`: login summary coverage.
- Modify `apps/admin/src/views/sports/football/player/model/types.ts`: extend search/form models.
- Modify `apps/admin/src/views/sports/football/player/model/defaults.ts`: initialize new fields.
- Modify `apps/admin/src/views/sports/football/player/model/mapper.ts`: map API rows to form models and build payload/search params.
- Modify `apps/admin/src/views/sports/football/player/schemas/form.ts`: add position labels/options and validation rules.
- Modify `apps/admin/src/views/sports/football/player/schemas/search.ts`: use dynamic team options and position options.
- Modify `apps/admin/src/views/sports/football/player/schemas/table.ts`: rename/add columns for teams, primary team, positions, primary position, and signature.
- Modify `apps/admin/src/views/sports/football/player/components/PlayerForm.vue`: replace text fields with multi-select/single-select controls and add signature input.
- Modify `apps/admin/src/views/sports/football/player/components/PlayerFormDialog.vue`: pass team options through the dialog.
- Modify `apps/admin/src/views/sports/football/player/index.vue`: fetch team options from team API and wire new table slots/search.

## Task 1: Shared Player Contracts

**Files:**

- Modify: `packages/shared/types/src/player.ts`
- Modify: `packages/shared/types/src/auth.ts`

**Interfaces:**

- Produces: `FootballPosition`, `FOOTBALL_POSITION_OPTIONS`, `Player.teamIds`, `Player.teams`, `Player.primaryTeamId`, `Player.primaryTeam`, `Player.positions`, `Player.primaryPosition`, `Player.signature`.
- Consumes: existing `Team` type from `packages/shared/types/src/team.ts`.

- [ ] **Step 1: Write shared type expectations by compiling dependent code**

Run before changes:

```bash
pnpm --filter @gaoge/shared-types typecheck
```

Expected: fail after adding temporary references in implementation tasks until the contract exists.

- [ ] **Step 2: Add the shared player contract**

Add the football position union, a label option list, and expanded `Player`, `PlayerPayload`, `PlayerListParams`, and `MiniappPlayerSummary` fields exactly matching the spec names.

- [ ] **Step 3: Verify package compilation**

Run:

```bash
pnpm --filter @gaoge/shared-types typecheck
```

Expected: pass.

## Task 2: Prisma Model And PlayerService

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260629140000_extend_player_profile_structure/migration.sql`
- Modify: `apps/api/src/modules/sports/football/player/dto/create-player.dto.ts`
- Modify: `apps/api/src/modules/sports/football/player/player.service.spec.ts`
- Modify: `apps/api/src/modules/sports/football/player/player.service.ts`

**Interfaces:**

- Consumes: `FootballPosition`, `PlayerListParams`.
- Produces: Player API rows with `teams`, `teamIds`, `primaryTeam`, `primaryTeamId`, `positions`, `primaryPosition`, and `signature`.

- [ ] **Step 1: Write failing PlayerService tests**

Add tests for:

```ts
await expect(
  service.create({
    nickname: 'A',
    playerNumber: 7,
    teamIds: [1],
    primaryTeamId: 2,
    positions: ['striker'],
  }),
).rejects.toThrow('主队必须包含在代表球队中')
await expect(
  service.update(1, { positions: ['striker'], primaryPosition: 'goalkeeper' }),
).rejects.toThrow('主位置必须包含在可踢位置中')
await service.create({
  nickname: 'A',
  playerNumber: 7,
  teamIds: [1, 2],
  primaryTeamId: 1,
  positions: ['striker'],
  primaryPosition: 'striker',
  signature: '  冲就完了  ',
})
expect(prisma.$transaction).toHaveBeenCalled()
await service.findAll({ teamId: 1, position: 'striker' })
expect(prisma.player.findMany).toHaveBeenCalledWith(
  expect.objectContaining({ include: expect.any(Object) }),
)
```

Run:

```bash
pnpm --filter @gaoge/app-api test -- player.service.spec.ts --runInBand
```

Expected: fail because the new behavior is missing.

- [ ] **Step 2: Add Prisma schema and migration**

Add nullable primary team fields, string-array positions, nullable primary position and signature fields, plus `PlayerTeam`.

- [ ] **Step 3: Generate Prisma client**

Run:

```bash
pnpm --filter @gaoge/app-api db:generate
```

Expected: generated Prisma client exits 0.

- [ ] **Step 4: Implement service normalization and persistence**

Use a transaction for create/update. Validate team IDs exist, ensure primary team belongs to `teamIds`, validate position codes, ensure primary position belongs to `positions`, trim `signature`, set empty signature to null, rebuild `playerTeams`, and return rows with included relations.

- [ ] **Step 5: Verify PlayerService tests pass**

Run:

```bash
pnpm --filter @gaoge/app-api test -- player.service.spec.ts --runInBand
```

Expected: pass.

## Task 3: Miniapp And Auth Summary Serialization

**Files:**

- Modify: `apps/api/src/modules/miniapp/miniapp.service.spec.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.service.ts`
- Modify: `apps/api/src/modules/auth/auth.service.spec.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`

**Interfaces:**

- Consumes: the expanded player select shape from Prisma.
- Produces: `MiniappPlayerSummary` with new team and position fields.

- [ ] **Step 1: Write failing summary tests**

Assert both services return `teamIds`, `teams`, `primaryTeamId`, `primaryTeam`, `positions`, `primaryPosition`, and `signature` in player summaries.

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @gaoge/app-api test -- miniapp.service.spec.ts auth.service.spec.ts --runInBand
```

Expected: fail because serializers do not include new fields.

- [ ] **Step 3: Extend selects and serializers**

Include `primaryTeam` and `playerTeams.team`, map `teams` from `playerTeams`, and serialize all new fields while preserving `subTeam` and `position`.

- [ ] **Step 4: Verify summary tests pass**

Run:

```bash
pnpm --filter @gaoge/app-api test -- miniapp.service.spec.ts auth.service.spec.ts --runInBand
```

Expected: pass.

## Task 4: Admin Player CRUD

**Files:**

- Modify: `apps/admin/src/views/sports/football/player/model/types.ts`
- Modify: `apps/admin/src/views/sports/football/player/model/defaults.ts`
- Modify: `apps/admin/src/views/sports/football/player/model/mapper.ts`
- Modify: `apps/admin/src/views/sports/football/player/schemas/form.ts`
- Modify: `apps/admin/src/views/sports/football/player/schemas/search.ts`
- Modify: `apps/admin/src/views/sports/football/player/schemas/table.ts`
- Modify: `apps/admin/src/views/sports/football/player/components/PlayerForm.vue`
- Modify: `apps/admin/src/views/sports/football/player/components/PlayerFormDialog.vue`
- Modify: `apps/admin/src/views/sports/football/player/index.vue`

**Interfaces:**

- Consumes: `Team[]`, `FOOTBALL_POSITION_OPTIONS`, expanded `Player` and `PlayerPayload`.
- Produces: admin create/update payloads with new profile fields and list filters with `teamId`/`position`.

- [ ] **Step 1: Write type-level expectations by adding model fields first**

Update `PlayerFormModel`/`PlayerSearch` with `teamIds`, `primaryTeamId`, `positions`, `primaryPosition`, `signature`, `teamId`, and `position`.

- [ ] **Step 2: Run admin typecheck to verify breakage**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
```

Expected: fail until mapper/form/index are updated.

- [ ] **Step 3: Wire mapper/defaults/search/table**

Map API row fields to form state, build payloads with arrays/nulls, search by `teamId` and `position`, and add table display slots for teams and positions.

- [ ] **Step 4: Wire form UI**

Use `ElSelect multiple` for representative teams and positions, single selects for primary team/position with an explicit null option, clear invalid primary values when selected arrays change, and add signature input with `maxlength=15` and `show-word-limit`.

- [ ] **Step 5: Fetch team options and pass them to form/search**

Use `teamsApi.list({ page: 1, pageSize: 100 })` on mount alongside player fetch; keep options derived from real team resources.

- [ ] **Step 6: Verify admin typecheck passes**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
```

Expected: pass.

## Task 5: Final Verification

**Files:**

- Review all changed files.

- [ ] **Step 1: Run focused API tests**

```bash
pnpm --filter @gaoge/app-api test -- player.service.spec.ts miniapp.service.spec.ts auth.service.spec.ts --runInBand
```

Expected: pass.

- [ ] **Step 2: Run focused typechecks**

```bash
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-admin typecheck
pnpm typecheck
```

Expected: pass, unless unrelated pre-existing issues are found and reported with exact output.

- [ ] **Step 3: Review git diff**

```bash
git diff -- apps/api apps/admin packages/shared docs/superpowers/plans/2026-06-29-player-profile-structure.md
```

Expected: diff only contains changes required by the spec and this plan.
