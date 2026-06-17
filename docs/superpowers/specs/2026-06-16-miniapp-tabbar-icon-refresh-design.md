# Miniapp Tabbar Icon Refresh Design

## Goal

为 `apps/miniapp` 当前四个 tabbar 入口补一套新的位图图标资源，覆盖未选中与选中两种状态，保持现有页面路径、资源命名和 `pages.json` 配置不变。

## Scope

- 替换 `apps/miniapp/src/static/images/tabbar` 下现有 8 张 PNG
- 维持现有资源文件名：
  - `home(.png|-active.png)`
  - `discover(.png|-active.png)`
  - `message(.png|-active.png)`
  - `profile(.png|-active.png)`
- 不调整 `pages.json` 的 tabbar 结构和文本

## Visual Direction

- 风格：更具象的扁平填充
- 选中态：深色高亮，不使用品牌绿作为主高亮
- 语义映射：
  - 高歌：奖杯
  - 发现：罗盘
  - 流言板：公告板 + 对话气泡
  - 球队：盾牌队徽
- 输出：透明背景 PNG，尺寸保持 `81x81`

## Constraints

- 只做资源替换，不影响用户当前正在修改的页面与路由文件
- 图形细节需适配小尺寸 tabbar 展示，避免过度复杂
- 资源命名与路径不变，确保现有引用无需改动

## Verification

- 校验 8 张 PNG 均存在且尺寸为 `81x81`
- 运行 `pnpm --filter @gaoge/app-miniapp typecheck`
