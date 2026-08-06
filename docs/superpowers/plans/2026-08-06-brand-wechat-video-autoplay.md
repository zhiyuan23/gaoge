# Brand WeChat Video Autoplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing online Brand hero video's playback behavior inside WeChat without changing its CloudFront URL.

**Architecture:** Keep the native React `<video>` element and add one idempotent playback helper. Invoke it on mount, WeChat bridge readiness, media readiness, and the first touch while preserving the current poster and reduced-motion fallback.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Vite

## Global Constraints

- Keep the current CloudFront video URL.
- Do not add WeChat JS-SDK, official-account credentials, or third-party player dependencies.
- Preserve the existing poster and reduced-motion behavior.
- Treat autoplay as best-effort and safely absorb rejected `play()` promises.

---

### Task 1: Add WeChat-compatible hero playback retries

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Test: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`

**Interfaces:**

- Consumes: the existing CloudFront `backgroundVideo` URL and static `backgroundPoster`.
- Produces: a hero video that retries playback through native media and WeChat lifecycle events.

- [ ] **Step 1: Write failing component tests**

Add assertions that the rendered video contains `webkit-playsinline`, `x5-playsinline`, `x5-video-player-type="h5-page"`, and `preload="auto"`. Spy on `HTMLMediaElement.prototype.play` and assert playback attempts on mount, `WeixinJSBridgeReady`, `canplay`, and only the first `touchstart`.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/SkiingHero.test.tsx`

Expected: FAIL because the compatibility attributes and playback retry behavior do not exist.

- [ ] **Step 3: Implement the minimal playback helper**

Use `useCallback`, `useEffect`, and a video ref. Before every `play()` call set `muted` and `defaultMuted`; catch rejected promises. Register and clean up `WeixinJSBridgeReady` and one-time `touchstart` listeners only when reduced motion is not requested. Bind the helper to `onCanPlay` and add the X5/inline attributes.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/SkiingHero.test.tsx`

Expected: PASS with no unhandled media errors.

- [ ] **Step 5: Run full Brand verification**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Expected: all commands exit successfully.
