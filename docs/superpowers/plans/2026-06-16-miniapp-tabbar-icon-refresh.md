# Miniapp Tabbar Icon Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the miniapp tabbar bitmap assets with a new flat-filled icon set while keeping current routing and file references unchanged.

**Architecture:** Keep the existing `pages.json` image references intact and regenerate only the PNG files under the current tabbar asset directory. Use deterministic SVG-to-PNG rendering so the assets stay crisp at small size and can be verified locally.

**Tech Stack:** Node.js, Sharp, miniapp static PNG assets

---

### Task 1: Freeze the icon contract

**Files:**

- Create: `docs/superpowers/specs/2026-06-16-miniapp-tabbar-icon-refresh-design.md`
- Create: `docs/superpowers/plans/2026-06-16-miniapp-tabbar-icon-refresh.md`

- [ ] **Step 1: Confirm icon semantics and visual direction**

Approved mapping:

```text
高歌 -> 奖杯
发现 -> 罗盘
流言板 -> 公告板 + 对话气泡
球队 -> 盾牌队徽
```

- [ ] **Step 2: Lock output contract**

Output contract:

```text
Directory: apps/miniapp/src/static/images/tabbar
Format: PNG
Size: 81x81
Background: transparent
States: default + active
```

### Task 2: Generate the replacement assets

**Files:**

- Modify: `apps/miniapp/src/static/images/tabbar/home.png`
- Modify: `apps/miniapp/src/static/images/tabbar/home-active.png`
- Modify: `apps/miniapp/src/static/images/tabbar/discover.png`
- Modify: `apps/miniapp/src/static/images/tabbar/discover-active.png`
- Modify: `apps/miniapp/src/static/images/tabbar/message.png`
- Modify: `apps/miniapp/src/static/images/tabbar/message-active.png`
- Modify: `apps/miniapp/src/static/images/tabbar/profile.png`
- Modify: `apps/miniapp/src/static/images/tabbar/profile-active.png`

- [ ] **Step 1: Render SVG-based source shapes into PNG assets**

Render parameters:

```text
Canvas: 81x81
Default palette: light gray + medium gray
Active palette: #111827 + #374151
```

- [ ] **Step 2: Preserve existing filenames**

Expected filenames:

```text
home.png
home-active.png
discover.png
discover-active.png
message.png
message-active.png
profile.png
profile-active.png
```

### Task 3: Verify the asset-only update

**Files:**

- Verify: `apps/miniapp/src/static/images/tabbar/*`

- [ ] **Step 1: Verify the generated PNG sizes**

Run:

```bash
sips -g pixelWidth -g pixelHeight apps/miniapp/src/static/images/tabbar/*.png
```

Expected: every file reports `pixelWidth: 81` and `pixelHeight: 81`

- [ ] **Step 2: Run miniapp typecheck**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: command exits with code 0
