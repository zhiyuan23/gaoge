# Miniapp Profile Player Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the miniapp "我的" page use bound `player` data as the primary personal profile source, showing the full editable player business profile while keeping internal backend fields hidden.

**Architecture:** Keep `/miniapp/me` as the single source of truth, but upgrade `player` from a small summary to a full miniapp-safe player profile object. Move profile update writes from `User` to the bound `Player`, reuse the existing avatar upload transport, and keep the miniapp page state local with a simple player form that submits directly back to `/miniapp/me`.

**Tech Stack:** NestJS, Prisma, Vue 3 `<script setup>`, uni-app, Pinia, shared workspace types, Jest, Node built-in `node:test`

---

## File Structure

### Shared miniapp profile contract

- Modify: `packages/shared/types/src/auth.ts`

### Miniapp backend read/write flow

- Create: `apps/api/src/modules/miniapp/dto/update-miniapp-player-profile.dto.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/auth.service.spec.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.controller.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.controller.spec.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.service.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.service.spec.ts`

### Miniapp profile page form

- Modify: `apps/miniapp/src/api/auth/index.ts`
- Modify: `apps/miniapp/src/pages/profile/index.vue`
- Modify: `apps/miniapp/scripts/profile-binding.test.mjs`

## Task 1: Expand `player` into a full miniapp-safe profile contract

**Files:**

- Modify: `packages/shared/types/src/auth.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Write the failing auth-service expectation for a full `player` payload**

Add a failure-first assertion to `apps/api/src/modules/auth/auth.service.spec.ts` so the bound-user login test expects the returned `player` to include business fields such as `realName`, `jerseyName`, `birthDate`, `position`, `jerseySize`, `remark`, `isAdmin`, and timestamps, while still excluding `openid` and `userId`.

- [ ] **Step 2: Run the focused auth-service test and confirm it fails**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/auth/auth.service.spec.ts
```

Expected: FAIL because `serializeMiniappPlayer` still returns only the old summary shape.

- [ ] **Step 3: Extend the shared type and serializer minimally**

Update `packages/shared/types/src/auth.ts` to replace the summary-only `MiniappPlayerSummary` contract with a full miniapp-safe player profile type that contains:

```ts
playerId: number
playerNumber: number | null
nickname: string
avatarUrl: string | null
realName: string | null
subTeam: string | null
jerseyName: string | null
birthDate: DateTimeString | null
isAdmin: boolean
position: string | null
jerseySize: string | null
status: string
remark: string | null
createdAt: DateTimeString
updatedAt: DateTimeString
```

Then update `apps/api/src/modules/auth/auth.service.ts` so `serializeMiniappPlayer` selects and serializes exactly that shape.

- [ ] **Step 4: Re-run the auth-service test and confirm it passes**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/auth/auth.service.spec.ts
```

Expected: PASS with the bound miniapp login test green.

## Task 2: Move miniapp profile updates onto the bound player

**Files:**

- Create: `apps/api/src/modules/miniapp/dto/update-miniapp-player-profile.dto.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.controller.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.controller.spec.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.service.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.service.spec.ts`

- [ ] **Step 1: Write failing controller and service tests for player-centric profile updates**

Add tests that prove:

1. `POST /miniapp/me/profile` delegates the full DTO to the service.
2. `MiniappService.getMe()` returns a full `player` object.
3. `MiniappService.updateProfile()` updates the bound player record, not the user record.
4. `MiniappService.updateProfile()` rejects when the current user has not bound a player.

- [ ] **Step 2: Run the focused miniapp backend tests and confirm they fail**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/miniapp/miniapp.controller.spec.ts src/modules/miniapp/miniapp.service.spec.ts
```

Expected: FAIL because the DTO, selects, and update target still point at `User`.

- [ ] **Step 3: Implement the minimal backend contract**

Create `update-miniapp-player-profile.dto.ts` with editable fields only:

```ts
nickname?: string
realName?: string
subTeam?: string
jerseyName?: string
birthDate?: Date
position?: string
jerseySize?: string
remark?: string
```

Then update:

- `miniapp.controller.ts` so `updateProfile()` forwards the full DTO and `uploadAvatar()` still calls the same service with `{ avatarUrl }`
- `miniapp.service.ts` so:
  - `findBindingByUserId()` and login binding selects fetch the full player business profile
  - `updateProfile()` first loads the active bound player
  - updates `prisma.player.update({ where: { id: boundPlayer.id }, data: ... })`
  - normalizes optional text/date fields without exposing internal fields
  - returns the refreshed `MiniappMeResponse`

- [ ] **Step 4: Re-run the miniapp backend tests and confirm they pass**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/miniapp/miniapp.controller.spec.ts src/modules/miniapp/miniapp.service.spec.ts
```

Expected: PASS with player read/update flow green.

## Task 3: Rebuild the miniapp "我的" page around editable player fields

**Files:**

- Modify: `apps/miniapp/src/api/auth/index.ts`
- Modify: `apps/miniapp/src/pages/profile/index.vue`
- Modify: `apps/miniapp/scripts/profile-binding.test.mjs`

- [ ] **Step 1: Write failing page assertions for player-based rendering**

Extend `profile-binding.test.mjs` so the source assertions require:

- header nickname/avatar reads from `me?.player`
- a player form is rendered for editable business fields
- internal `openid` text is still absent

- [ ] **Step 2: Run the focused miniapp page test and confirm it fails**

Run:

```bash
node --test apps/miniapp/scripts/profile-binding.test.mjs
```

Expected: FAIL because the page still renders from `me.user` and only shows a small summary.

- [ ] **Step 3: Implement the minimal player form and request payload**

Update `apps/miniapp/src/api/auth/index.ts` so `updateMiniappProfile()` accepts the new player profile payload shape.

Update `apps/miniapp/src/pages/profile/index.vue` to:

- use `me.player.avatarUrl` and `me.player.nickname` for the header when bound
- keep the unbound state and bind popup behavior unchanged
- add local `playerForm` state synchronized from `me.player`
- render editable inputs for:
  - `realName`
  - `subTeam`
  - `jerseyName`
  - `birthDate`
  - `position`
  - `jerseySize`
  - `remark`
- render read-only rows for:
  - `playerNumber`
  - `status`
  - `isAdmin`
- submit the edited player fields back to `/miniapp/me/profile`
- keep avatar upload routed through `/miniapp/me/avatar`

- [ ] **Step 4: Re-run the page test and typecheck**

Run:

```bash
node --test apps/miniapp/scripts/profile-binding.test.mjs
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: both PASS.

## Task 4: Run full targeted verification

**Files:**

- Modify: `packages/shared/types/src/auth.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/auth.service.spec.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.controller.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.controller.spec.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.service.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.service.spec.ts`
- Modify: `apps/miniapp/src/api/auth/index.ts`
- Modify: `apps/miniapp/src/pages/profile/index.vue`
- Modify: `apps/miniapp/scripts/profile-binding.test.mjs`

- [ ] **Step 1: Run backend tests**

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/auth/auth.service.spec.ts src/modules/miniapp/miniapp.controller.spec.ts src/modules/miniapp/miniapp.service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run miniapp page tests**

```bash
node --test apps/miniapp/scripts/profile-binding.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Run typechecks**

```bash
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: PASS.
