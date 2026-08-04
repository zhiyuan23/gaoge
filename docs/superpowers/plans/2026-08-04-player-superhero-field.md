# Player Superhero Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional superhero name to football players, expose it through the existing player API, and let admins create, edit, clear, and view it.

**Architecture:** Persist `superheroName` as a nullable scalar on Prisma `Player`, expose the same nullable shape through shared contracts and the existing NestJS CRUD endpoints, and keep all Admin behavior inside the current player CRUD module. The field remains free text with a 50-character limit; no hero entity, publisher enum, search filter, or client-page integration is introduced.

**Tech Stack:** Prisma 5, PostgreSQL, NestJS 11, class-validator, Jest, TypeScript workspace contracts, Vue 3, Element Plus, EsTable, Node test runner.

## Global Constraints

- The database and API property name is exactly `superheroName`.
- `Player.superheroName` is `string | null`.
- `PlayerPayload.superheroName` is optional and accepts `string | null`.
- The value is free text, nullable, and limited to 50 characters.
- Admin trims surrounding whitespace and submits blank input as `null`.
- Public player API responses include the field.
- Only Admin renders the field in this change; do not modify uni-app, Sports, Desktop, iOS, or Miniapp pages.
- Do not add a Marvel/DC publisher field, hero enum, hero table, uniqueness constraint, index, or search filter.
- Keep the existing Admin player CRUD structure and existing API routes and permissions.
- Follow the repository preference to implement the cohesive change first and run unified verification afterward rather than strict TDD.
- Any Prisma schema change must be applied locally, followed by Prisma Client generation, API restart confirmation, `prisma migrate status`, and affected endpoint smoke tests.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`: declare nullable `Player.superheroName`.
- Create `apps/api/prisma/migrations/20260804090000_add_player_superhero_name/migration.sql`: add the nullable PostgreSQL column without touching existing rows.
- Modify `packages/shared/types/src/player.ts`: add the field to `Player`, `PlayerPayload`, and their documentation.
- Modify `apps/api/src/modules/sports/football/player/dto/create-player.dto.ts`: accept nullable superhero names and enforce the 50-character limit.
- Modify `apps/api/src/modules/sports/football/player/dto/create-player.dto.spec.ts`: cover normal, null, and oversized values.
- Modify `apps/api/src/modules/sports/football/player/player.service.spec.ts`: prove the existing scalar persistence and serializer path preserves values and explicit null clears.
- Modify `apps/admin/src/views/sports/football/player/model/types.ts`: add the Admin form field.
- Modify `apps/admin/src/views/sports/football/player/model/defaults.ts`: initialize the field to an empty string.
- Modify `apps/admin/src/views/sports/football/player/model/mapper.ts`: map API nulls to form blanks and form blanks to API nulls.
- Create `apps/admin/tests/player-superhero-mapper.test.ts`: cover Admin read, trim, and clear mappings.
- Modify `apps/admin/src/views/sports/football/player/schemas/form.ts`: add the 50-character form rule.
- Modify `apps/admin/src/views/sports/football/player/schemas/table.ts`: add the superhero column using the existing slot mechanism.
- Modify `apps/admin/src/views/sports/football/player/components/PlayerForm.vue`: render the optional input.
- Modify `apps/admin/src/views/sports/football/player/index.vue`: render a hero name or `-` in the table slot.

## Task 1: Database And Shared Contract

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260804090000_add_player_superhero_name/migration.sql`
- Modify: `packages/shared/types/src/player.ts`

**Interfaces:**

- Produces: Prisma `Player.superheroName: string | null`.
- Produces: shared `Player.superheroName: string | null`.
- Produces: shared `PlayerPayload.superheroName?: string | null`.
- Consumes: existing Prisma `Player`, `Player`, and `PlayerPayload` definitions.

- [ ] **Step 1: Add the Prisma scalar**

Place the field near the other profile text fields in `Player`:

```prisma
superheroName String? // 对应的漫威或 DC 超级英雄名称，非必填
```

- [ ] **Step 2: Add the migration**

Create `apps/api/prisma/migrations/20260804090000_add_player_superhero_name/migration.sql` with:

```sql
ALTER TABLE "Player"
ADD COLUMN "superheroName" TEXT;
```

The migration must not update current records, add a default, create an index, or add a uniqueness constraint.

- [ ] **Step 3: Extend the shared player contract**

Add the property documentation to both interface comments:

```ts
 * @property superheroName 对应的漫威或 DC 超级英雄名称。
```

Add the response property near `signature`:

```ts
superheroName: string | null
```

Add the write property:

```ts
superheroName?: string | null
```

- [ ] **Step 4: Generate the Prisma Client and validate the focused contract**

Run:

```bash
pnpm --filter @gaoge/app-api db:generate
pnpm --filter @gaoge/shared-types typecheck
pnpm --filter @gaoge/app-api exec prisma validate
```

Expected: all commands exit with code 0 and Prisma Client contains `superheroName`.

- [ ] **Step 5: Commit the storage contract**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/20260804090000_add_player_superhero_name/migration.sql packages/shared/types/src/player.ts
git commit -m "feat: add player superhero data contract"
```

## Task 2: API Validation And Scalar Persistence Coverage

**Files:**

- Modify: `apps/api/src/modules/sports/football/player/dto/create-player.dto.ts`
- Modify: `apps/api/src/modules/sports/football/player/dto/create-player.dto.spec.ts`
- Modify: `apps/api/src/modules/sports/football/player/player.service.spec.ts`

**Interfaces:**

- Consumes: `PlayerPayload.superheroName?: string | null` and generated Prisma scalar.
- Produces: `CreatePlayerDto.superheroName?: string | null`.
- Preserves: existing `PlayerService` scalar spread into Prisma create/update and serialized responses.

- [ ] **Step 1: Add DTO validation**

Insert after the other profile text fields:

```ts
@IsOptional()
@IsString()
@MaxLength(50)
superheroName?: string | null
```

`IsOptional` must remain first so `null` skips string and length validation, while non-null values are still validated.

- [ ] **Step 2: Add DTO test cases**

Append these cases to `create-player.dto.spec.ts`:

```ts
it.each([null, '蝙蝠侠'])('accepts an optional superhero name: %s', (superheroName) => {
  const dto = plainToInstance(CreatePlayerDto, {
    nickname: '高歌7号',
    playerNumber: 7,
    superheroName,
  })

  const errors = validateSync(dto)

  expect(errors.some((error) => error.property === 'superheroName')).toBe(false)
})

it('rejects superhero names longer than 50 characters', () => {
  const dto = plainToInstance(CreatePlayerDto, {
    nickname: '高歌7号',
    playerNumber: 7,
    superheroName: 'A'.repeat(51),
  })

  const errors = validateSync(dto)

  expect(errors.some((error) => error.property === 'superheroName')).toBe(true)
})
```

- [ ] **Step 3: Extend the service fixture and add pass-through coverage**

Add this property to `playerWithRelations`:

```ts
superheroName: '蝙蝠侠',
```

Append:

```ts
it('returns superhero names and persists explicit null clears', async () => {
  const { prisma, service } = createService()

  await expect(service.findOne(1)).resolves.toMatchObject({
    superheroName: '蝙蝠侠',
  })

  await service.update(1, {
    superheroName: null,
  } as any)

  expect(prisma.player.update).toHaveBeenCalledWith({
    where: { id: 1 },
    data: expect.objectContaining({
      superheroName: null,
    }),
  })
})
```

Do not add special `PlayerService` branching: the generated Prisma scalar, DTO, `baseDto` spread, and `serializePlayer` spread already provide the required behavior.

- [ ] **Step 4: Run focused API tests**

Run:

```bash
pnpm --filter @gaoge/app-api test -- create-player.dto.spec.ts player.service.spec.ts --runInBand
pnpm --filter @gaoge/app-api typecheck
```

Expected: the DTO and service suites pass and API typecheck exits with code 0.

- [ ] **Step 5: Commit API validation and coverage**

```bash
git add apps/api/src/modules/sports/football/player/dto/create-player.dto.ts apps/api/src/modules/sports/football/player/dto/create-player.dto.spec.ts apps/api/src/modules/sports/football/player/player.service.spec.ts
git commit -m "feat: validate player superhero names"
```

## Task 3: Admin Form Model And Mapper

**Files:**

- Modify: `apps/admin/src/views/sports/football/player/model/types.ts`
- Modify: `apps/admin/src/views/sports/football/player/model/defaults.ts`
- Modify: `apps/admin/src/views/sports/football/player/model/mapper.ts`
- Create: `apps/admin/tests/player-superhero-mapper.test.ts`

**Interfaces:**

- Consumes: `Player.superheroName: string | null`.
- Produces: `PlayerFormModel.superheroName: string`.
- Produces: `buildPlayerPayload(...).superheroName: string | null`.

- [ ] **Step 1: Extend the Admin form model and default**

Add to `PlayerFormModel`:

```ts
superheroName: string
```

Add to `createEmptyPlayerForm()`:

```ts
superheroName: '',
```

- [ ] **Step 2: Add nullable text normalization**

In `mapper.ts`, add:

```ts
function normalizeNullableText(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}
```

Map API rows into the form:

```ts
superheroName: row.superheroName ?? '',
```

Add the payload property:

```ts
superheroName: normalizeNullableText(model.superheroName),
```

Do not reuse the existing `normalizeText`, because it returns `undefined` and would make clearing an existing database value impossible.

- [ ] **Step 3: Add mapper behavior tests**

Create `apps/admin/tests/player-superhero-mapper.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import type { Player } from '@gaoge/shared-types'

import { createEmptyPlayerForm } from '../src/views/sports/football/player/model/defaults.ts'
import {
  buildPlayerPayload,
  createPlayerFormFromRow,
} from '../src/views/sports/football/player/model/mapper.ts'

test('maps a nullable superhero name into an empty Admin form value', () => {
  const form = createPlayerFormFromRow({
    superheroName: null,
  } as Player)

  assert.equal(form.superheroName, '')
})

test('trims a superhero name and maps blank input to an explicit null clear', () => {
  const form = createEmptyPlayerForm()
  form.playerNumber = 7
  form.nickname = '高歌7号'
  form.superheroName = '  蝙蝠侠  '

  assert.equal(buildPlayerPayload(form).superheroName, '蝙蝠侠')

  form.superheroName = '   '

  assert.equal(buildPlayerPayload(form).superheroName, null)
})
```

- [ ] **Step 4: Run mapper tests**

Run:

```bash
node --experimental-strip-types --test apps/admin/tests/player-superhero-mapper.test.ts
pnpm --filter @gaoge/app-admin typecheck
```

Expected: both mapper subtests pass and Admin typecheck exits with code 0.

- [ ] **Step 5: Commit Admin mapping**

```bash
git add apps/admin/src/views/sports/football/player/model/types.ts apps/admin/src/views/sports/football/player/model/defaults.ts apps/admin/src/views/sports/football/player/model/mapper.ts apps/admin/tests/player-superhero-mapper.test.ts
git commit -m "feat: map player superhero admin data"
```

## Task 4: Admin Input And Table Display

**Files:**

- Modify: `apps/admin/src/views/sports/football/player/schemas/form.ts`
- Modify: `apps/admin/src/views/sports/football/player/schemas/table.ts`
- Modify: `apps/admin/src/views/sports/football/player/components/PlayerForm.vue`
- Modify: `apps/admin/src/views/sports/football/player/index.vue`

**Interfaces:**

- Consumes: `PlayerFormModel.superheroName` and `Player.superheroName`.
- Produces: an optional validated text input and an Admin list column displaying the name or `-`.

- [ ] **Step 1: Add the frontend length rule**

Add to `PLAYER_FORM_RULES`:

```ts
superheroName: [{ max: 50, message: '超级英雄最多 50 个字符', trigger: 'blur' }],
```

- [ ] **Step 2: Add the form input**

Place the field after “真实姓名”:

```vue
<ElCol :span="12">
  <ElFormItem label="超级英雄" prop="superheroName">
    <ElInput
      v-model="model.superheroName"
      placeholder="请输入对应的漫威或 DC 超级英雄"
      maxlength="50"
      show-word-limit
    />
  </ElFormItem>
</ElCol>
```

- [ ] **Step 3: Add the table column**

Place the column after “真实姓名”:

```ts
{ label: '超级英雄', prop: 'superheroName', width: 140, slot: 'superheroName' },
```

Use a local slot because the current `EsTable` requires a slot for custom empty-value rendering; do not change the shared `EsTable` component.

- [ ] **Step 4: Render the table value**

Add to the existing `EsTable` slots in `index.vue`:

```vue
<template #superheroName="{ row }">
  {{ row.superheroName || '-' }}
</template>
```

- [ ] **Step 5: Verify Admin compilation and formatting**

Run:

```bash
node --experimental-strip-types --test apps/admin/tests/player-superhero-mapper.test.ts
pnpm --filter @gaoge/app-admin typecheck
pnpm exec prettier --check \
  apps/admin/src/views/sports/football/player/schemas/form.ts \
  apps/admin/src/views/sports/football/player/schemas/table.ts \
  apps/admin/src/views/sports/football/player/components/PlayerForm.vue \
  apps/admin/src/views/sports/football/player/index.vue
```

Expected: mapper tests pass, typecheck succeeds, and Prettier reports all four files formatted.

- [ ] **Step 6: Commit the Admin controls**

```bash
git add apps/admin/src/views/sports/football/player/schemas/form.ts apps/admin/src/views/sports/football/player/schemas/table.ts apps/admin/src/views/sports/football/player/components/PlayerForm.vue apps/admin/src/views/sports/football/player/index.vue
git commit -m "feat: manage player superhero names"
```

## Task 5: Database Synchronization And Unified Verification

**Files:**

- Verify all files from Tasks 1–4.
- No additional source file is expected.

**Interfaces:**

- Consumes: completed Prisma, API, shared contract, and Admin changes.
- Produces: fresh migration, test, typecheck, lint, runtime, and smoke-test evidence.

- [ ] **Step 1: Apply the migration and regenerate Prisma Client**

Run against the configured local development database:

```bash
pnpm --filter @gaoge/app-api exec prisma migrate dev
pnpm --filter @gaoge/app-api db:generate
pnpm --filter @gaoge/app-api exec prisma migrate status
```

Expected: migration `20260804090000_add_player_superhero_name` is applied, client generation succeeds, and status reports the schema is up to date.

- [ ] **Step 2: Run focused and application-wide checks**

Run:

```bash
pnpm --filter @gaoge/app-api test -- create-player.dto.spec.ts player.service.spec.ts --runInBand
pnpm --filter @gaoge/app-api test --runInBand
pnpm --filter @gaoge/app-api typecheck
node --experimental-strip-types --test apps/admin/tests/player-superhero-mapper.test.ts
pnpm --filter @gaoge/app-admin typecheck
pnpm typecheck
pnpm lint
```

Expected: every command exits with code 0. If full-repository lint exposes unrelated pre-existing failures, record the exact failures and still require all changed-file checks to pass.

- [ ] **Step 3: Restart or confirm the API runtime**

If port 3000 is already occupied by an old API process, stop that project process and restart it. In a separate terminal run:

```bash
pnpm dev:api
```

Expected: Nest starts without Prisma missing-column errors and listens on the configured API port.

- [ ] **Step 4: Smoke-test list, update, clear, and restore**

Use an existing local Admin account through task-specific environment variables. The shell must already provide `GAOGE_SMOKE_ACCOUNT` and `GAOGE_SMOKE_PASSWORD`; fail immediately rather than guessing credentials:

```bash
export GAOGE_SMOKE_BASE_URL="${GAOGE_SMOKE_BASE_URL:-http://127.0.0.1:3000}"
: "${GAOGE_SMOKE_ACCOUNT:?GAOGE_SMOKE_ACCOUNT must contain a local Admin account}"
: "${GAOGE_SMOKE_PASSWORD:?GAOGE_SMOKE_PASSWORD must contain its password}"
```

Log in and capture the token:

```bash
GAOGE_SMOKE_LOGIN_PAYLOAD=$(jq -cn \
  --arg account "$GAOGE_SMOKE_ACCOUNT" \
  --arg password "$GAOGE_SMOKE_PASSWORD" \
  '{account: $account, password: $password}')
GAOGE_SMOKE_LOGIN=$(curl -sS \
  -H 'Content-Type: application/json' \
  -d "$GAOGE_SMOKE_LOGIN_PAYLOAD" \
  "$GAOGE_SMOKE_BASE_URL/auth/admin/login")
GAOGE_SMOKE_TOKEN=$(jq -er '.data.accessToken' <<<"$GAOGE_SMOKE_LOGIN")
```

Read one player and preserve its current value:

```bash
GAOGE_SMOKE_LIST=$(curl -sS "$GAOGE_SMOKE_BASE_URL/football/players?page=1&pageSize=1")
jq -e '.code == 0 and (.data.list | length) == 1 and (.data.list[0] | has("superheroName"))' \
  <<<"$GAOGE_SMOKE_LIST"
GAOGE_SMOKE_PLAYER_ID=$(jq -er '.data.list[0].id' <<<"$GAOGE_SMOKE_LIST")
GAOGE_SMOKE_ORIGINAL=$(jq -c '.data.list[0].superheroName' <<<"$GAOGE_SMOKE_LIST")
```

Update, clear, and restore the value:

```bash
curl -sS -X PATCH \
  -H "Authorization: Bearer $GAOGE_SMOKE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"superheroName":"蝙蝠侠"}' \
  "$GAOGE_SMOKE_BASE_URL/football/players/$GAOGE_SMOKE_PLAYER_ID" \
  | jq -e '.code == 0 and .data.superheroName == "蝙蝠侠"'

curl -sS -X PATCH \
  -H "Authorization: Bearer $GAOGE_SMOKE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"superheroName":null}' \
  "$GAOGE_SMOKE_BASE_URL/football/players/$GAOGE_SMOKE_PLAYER_ID" \
  | jq -e '.code == 0 and .data.superheroName == null'

GAOGE_SMOKE_RESTORE=$(jq -cn \
  --argjson superheroName "$GAOGE_SMOKE_ORIGINAL" \
  '{superheroName: $superheroName}')
curl -sS -X PATCH \
  -H "Authorization: Bearer $GAOGE_SMOKE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$GAOGE_SMOKE_RESTORE" \
  "$GAOGE_SMOKE_BASE_URL/football/players/$GAOGE_SMOKE_PLAYER_ID" \
  | jq -e --argjson original "$GAOGE_SMOKE_ORIGINAL" \
    '.code == 0 and .data.superheroName == $original'
```

Expected: all four `jq -e` checks exit with code 0, and the final request restores the original value.

- [ ] **Step 5: Manually verify the Admin path**

Open Admin “球员信息” and verify:

1. The list has a “超级英雄” column.
2. An empty value renders as `-`.
3. Editing a player shows the saved name.
4. Saving surrounding whitespace persists the trimmed value.
5. Clearing the input persists an empty value and the list returns to `-`.
6. A 51-character value is blocked with `超级英雄最多 50 个字符`.

- [ ] **Step 6: Check knowledge impact and repository state**

Call Knowledge Base `impact_for_changes` for repository `gaoge` with:

```text
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/20260804090000_add_player_superhero_name/migration.sql
packages/shared/types/src/player.ts
apps/api/src/modules/sports/football/player/dto/create-player.dto.ts
apps/admin/src/views/sports/football/player
```

Because current lookup incorrectly maps `gaoge` to `gaoge-compass`, report the conflict and recommend a `kb-maintainer` mapping repair instead of writing conclusions into the wrong project page.

Finally run:

```bash
git status --short
git log -5 --oneline --decorate
```

Expected: no uncommitted implementation files remain, and the feature commits are visible at the branch tip.
