# Obsidian Knowledge Wechat Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the Obsidian `Knowledge` directory into a clearer domain-first, capability-second, content-type-third structure for current WeChat-related notes.

**Architecture:** Keep `Knowledge` domain-first and make `微信` the stable first-level domain for all WeChat ecosystem topics. Under `微信`, organize by capability such as `公众号` and `微信支付`, then by content type such as `配置` or `规则与限制`, so future notes can land in deterministic locations without overloading filenames.

**Tech Stack:** Obsidian vault filesystem, Markdown, shell file operations

---

## File Structure

### Target structure

- Create: `/Users/snow/Documents/Obsidian Vault/Knowledge/微信/公众号/配置/`
- Create: `/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/规则与限制/`
- Create: `/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/机制与流程/`

### Files to move

- Move: `/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信公众号H5分享配置方法.md`
- Move: `/Users/snow/Documents/Obsidian Vault/Knowledge/支付/微信支付/微信小程序支付前置条件与限制.md`
- Move: `/Users/snow/Documents/Obsidian Vault/Knowledge/支付/微信支付/微信支付回调、退款与补偿机制.md`

### Verification

- Test: `find '/Users/snow/Documents/Obsidian Vault/Knowledge' -maxdepth 4 \\( -type d -o -type f \\) | sort`

## Task 1: Create the new WeChat knowledge structure and move notes

**Files:**

- Create: `/Users/snow/Documents/Obsidian Vault/Knowledge/微信/公众号/配置/`
- Create: `/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/规则与限制/`
- Create: `/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/机制与流程/`
- Move: `/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信公众号H5分享配置方法.md`
- Move: `/Users/snow/Documents/Obsidian Vault/Knowledge/支付/微信支付/微信小程序支付前置条件与限制.md`
- Move: `/Users/snow/Documents/Obsidian Vault/Knowledge/支付/微信支付/微信支付回调、退款与补偿机制.md`
- Test: `find '/Users/snow/Documents/Obsidian Vault/Knowledge' -maxdepth 4 \\( -type d -o -type f \\) | sort`

- [ ] **Step 1: Confirm the current knowledge tree before moving files**

Run:

```bash
find '/Users/snow/Documents/Obsidian Vault/Knowledge' -maxdepth 4 \( -type d -o -type f \) | sort
```

Expected: Current tree shows `Knowledge/微信/微信公众号H5分享配置方法.md` and `Knowledge/支付/微信支付/*`.

- [ ] **Step 2: Create the target directories**

Run:

```bash
mkdir -p '/Users/snow/Documents/Obsidian Vault/Knowledge/微信/公众号/配置'
mkdir -p '/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/规则与限制'
mkdir -p '/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/机制与流程'
```

Expected: The three target directories exist.

- [ ] **Step 3: Move the existing notes into the new structure**

Run:

```bash
mv '/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信公众号H5分享配置方法.md' '/Users/snow/Documents/Obsidian Vault/Knowledge/微信/公众号/配置/微信公众号H5分享配置方法.md'
mv '/Users/snow/Documents/Obsidian Vault/Knowledge/支付/微信支付/微信小程序支付前置条件与限制.md' '/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/规则与限制/微信小程序支付前置条件与限制.md'
mv '/Users/snow/Documents/Obsidian Vault/Knowledge/支付/微信支付/微信支付回调、退款与补偿机制.md' '/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/机制与流程/微信支付回调、退款与补偿机制.md'
```

Expected: The three notes now exist only under the new `Knowledge/微信/...` paths.

- [ ] **Step 4: Remove now-empty legacy directories if they are empty**

Run:

```bash
rmdir '/Users/snow/Documents/Obsidian Vault/Knowledge/支付/微信支付' 2>/dev/null || true
rmdir '/Users/snow/Documents/Obsidian Vault/Knowledge/支付' 2>/dev/null || true
```

Expected: Empty legacy directories are removed; if not empty, they are left intact.

- [ ] **Step 5: Verify the final tree**

Run:

```bash
find '/Users/snow/Documents/Obsidian Vault/Knowledge' -maxdepth 4 \( -type d -o -type f \) | sort
```

Expected: The tree shows:

```text
/Users/snow/Documents/Obsidian Vault/Knowledge
/Users/snow/Documents/Obsidian Vault/Knowledge/微信
/Users/snow/Documents/Obsidian Vault/Knowledge/微信/公众号
/Users/snow/Documents/Obsidian Vault/Knowledge/微信/公众号/配置
/Users/snow/Documents/Obsidian Vault/Knowledge/微信/公众号/配置/微信公众号H5分享配置方法.md
/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付
/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/规则与限制
/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/规则与限制/微信小程序支付前置条件与限制.md
/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/机制与流程
/Users/snow/Documents/Obsidian Vault/Knowledge/微信/微信支付/机制与流程/微信支付回调、退款与补偿机制.md
```
