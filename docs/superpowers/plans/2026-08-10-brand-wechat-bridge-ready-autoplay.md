# Brand WeChat Bridge-Ready Autoplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retry the Brand homepage background video through an already initialized WeChat Bridge so playback does not depend on the first page touch.

**Architecture:** Keep playback ownership in `SkiingHero`. Add one Bridge-aware retry helper that invokes `getNetworkType` and calls the existing safe playback helper from its callback, while preserving all current media and interaction fallbacks.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Vite

## Global Constraints

- Keep the current CloudFront video URL and poster.
- Do not add WeChat JS-SDK, official-account configuration, third-party players, or dependencies.
- Preserve reduced-motion, `canplay`, first-touch, muted, inline, and rejected-play fallback behavior.

---

### Task 1: Handle a WeChat Bridge that is ready before React mounts

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`

**Interfaces:**

- Consumes: optional `window.WeixinJSBridge.invoke(method, params, callback)` supplied by the WeChat WebView.
- Produces: a Bridge callback that invokes the existing `tryPlayVideo(): Promise<void>` helper.

- [x] **Step 1: Write the failing test**

Add a test that installs a complete `WeixinJSBridge` test double before rendering, captures the `getNetworkType` callback, verifies Bridge invocation, invokes the callback, and verifies an additional media playback attempt.

```tsx
let bridgeCallback: (() => void) | undefined
const invoke = vi.fn((_method: string, _params: Record<string, never>, callback: () => void) => {
  bridgeCallback = callback
})

weixinWindow.WeixinJSBridge = { invoke }
render(<SkiingHero />)

expect(invoke).toHaveBeenCalledWith('getNetworkType', {}, expect.any(Function))
act(() => bridgeCallback?.())
expect(play).toHaveBeenCalledTimes(2)
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/SkiingHero.test.tsx`

Expected: FAIL because the component does not inspect or invoke an already initialized Bridge.

- [x] **Step 3: Implement the minimal Bridge-aware retry**

Add a local Bridge type and a callback that invokes `getNetworkType`. On mount, perform the ordinary play attempt and invoke the Bridge path when the global exists. Route `WeixinJSBridgeReady` through the same helper, with a safe direct-play fallback if invocation is unavailable or throws.

```tsx
const tryPlayVideoThroughWeixinBridge = useCallback(() => {
  const bridge = getWeixinJSBridge()

  if (!bridge) {
    void tryPlayVideo()
    return
  }

  try {
    bridge.invoke('getNetworkType', {}, () => void tryPlayVideo())
  } catch {
    void tryPlayVideo()
  }
}, [tryPlayVideo])
```

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/SkiingHero.test.tsx`

Expected: PASS.

- [x] **Step 5: Run Brand verification**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Expected: all commands exit successfully.
