# Football API Naming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify football API naming across server and admin code structure while preserving existing HTTP routes and behavior.

**Architecture:** Rename server football module directories, files, and Nest classes from plural resource names to singular resource names, but keep controller route decorators on plural REST endpoints. Move admin API resources under `src/api/football/<resource>/index.ts` and update all imports to use the new domain/resource structure.

**Tech Stack:** NestJS, Vue 3, TypeScript, pnpm, Jest

---

### Task 1: Rename Server Football Modules

**Files:**

- Modify: `apps/api/src/modules/football/football.module.ts`
- Rename/Modify: `apps/api/src/modules/football/players/*`
- Rename/Modify: `apps/api/src/modules/football/teams/*`
- Rename/Modify: `apps/api/src/modules/football/match-rounds/*`
- Test: `apps/api/src/modules/football-routing.spec.ts`

- [ ] Rename football resource directories and files from plural to singular.
- [ ] Rename Nest classes and imports to singular resource names.
- [ ] Preserve controller route decorators on `/football/players`, `/football/teams`, and `/football/match-rounds`.
- [ ] Update routing metadata tests to import the renamed controllers.

### Task 2: Reorganize Admin Football API Entrypoints

**Files:**

- Rename/Modify: `apps/admin/src/api/players/index.ts`
- Rename/Modify: `apps/admin/src/api/teams/index.ts`
- Rename/Modify: `apps/admin/src/api/match-rounds/index.ts`
- Modify: football view files importing these APIs

- [ ] Move admin football API resources under `apps/admin/src/api/football/<resource>/index.ts`.
- [ ] Keep request URLs unchanged and continue re-exporting shared types from each resource entrypoint.
- [ ] Update all football admin imports to use `@/api/football/<resource>`.

### Task 3: Verify No Behavioral Regressions

**Files:**

- Verify: `apps/api`
- Verify: `apps/admin`

- [ ] Run targeted API Jest coverage for football routing metadata and renamed services.
- [ ] Run targeted admin type checking or equivalent verification for updated import paths.
- [ ] Review the final diff to confirm only naming/structure changes were introduced.
