# Miniapp 架构与目录约定

本规范用于约束 `apps/miniapp` 微信原生 Skyline 小程序的应用内目录结构、模块层级和导入路径。

## 基本边界

`apps/miniapp` 是独立小程序应用，内部代码只依赖：

- 微信小程序运行时 API
- `@gaoge/miniapp-api-contract`
- `packages/*` 中允许被应用层依赖的共享包
- 本应用内 `miniprogram/*` 代码和静态资源

禁止从 `apps/miniapp` 直接引用 `apps/api/src`、`apps/admin/src` 或其他应用内部路径。

## 目录职责

当前主目录保持以下职责：

```text
miniprogram/
  core/        小程序运行层，如 http、auth、router、cache、lifecycle
  config/      环境、品牌、页面路由、版本等稳定配置
  services/    mini/v1 接口调用封装
  stores/      跨页面轻量状态
  components/  基础组件、壳组件和业务展示组件
  pages/       主包页面
  packages/    小程序分包
  styles/      WXSS tokens 与全局样式片段
  assets/      图片、图标等静态资源
```

不要为了补齐架构图提前创建空目录。只有真实页面、服务或转换逻辑出现时，再增加对应目录。

## Services 分组

`services/` 的职责是封装接口调用，不承载复杂页面状态，不直接操作组件，也不直接写全局 store。复杂业务编排应优先放在页面或后续明确的领域编排层中。

当前 `services/` 已按业务域分组。新增接口服务默认进入对应业务域目录：

```text
services/
  auth/
    auth.service.ts
  event/
    event.service.ts
  match/
    schedule.service.ts
    registration.service.ts
    check-in.service.ts
  content/
    report.service.ts
  player/
    team.service.ts
    standing.service.ts
  telemetry/
    client-event.service.ts
```

新增分组的判断标准：

- 现有分组无法准确表达功能域
- 同一新业务域预计会出现 2 个以上接口文件
- 页面 import 需要同时引用多个同域 service
- service 文件开始出现非请求封装的业务转换或组合逻辑

不要因为单个零散接口提前创建过深层级。优先维持一层业务域目录，例如 `match/schedule.service.ts`，不要拆成 `match/schedule/api/*.ts`。

## Stores 分组

`stores/` 保持轻量，默认只放跨页面稳定状态。页面私有 loading、表单、弹窗、列表筛选和局部缓存留在页面 `data` 内。

当前文件较少时可继续平铺：

```text
stores/
  app.store.ts
  auth.store.ts
  event.store.ts
```

当某个业务域 store 出现多个文件，或 store 需要配套 selectors、persistence、effects 时，再按域拆分：

```text
stores/
  auth/
    auth.store.ts
    auth.selectors.ts
  event/
    event.store.ts
```

## Domain 目录

`domain/` 不是默认必建目录。只有出现以下需求时再引入：

- DTO 到页面展示模型的稳定转换
- 枚举值、状态文案、颜色或图标 fallback 规则
- 多个页面复用的纯业务计算
- 与微信运行时、页面生命周期、网络请求无关的领域函数

`domain/` 内代码应保持纯 TypeScript，不依赖 `wx`、`Page`、`Component` 或具体 UI 组件。

## 导入路径

`apps/miniapp` 原生微信小程序 TS 代码当前使用相对路径导入。微信开发者工具内置 TypeScript 编译不会把 `tsconfig.json` 的 `paths` alias 重写成运行时可解析路径，直接使用 `@/` 会在小程序运行时报模块不存在。

```ts
import { requestMiniApi } from '../../core/http'
import { Routes } from '../config/routes'
```

相对路径使用规则：

- 同目录文件之间使用 `./`
- 同一局部目录内的强相关文件使用 `./xxx`
- 跨顶层目录按真实文件层级使用 `../`
- WXML、WXSS、JSON 中的资源或组件路径，按微信规范使用相对路径或小程序路径

暂不在运行代码中使用 `@/`：

```ts
// 不使用，除非后续引入可验证的 alias 重写构建链路
import { requestMiniApi } from '@/core/http'
```

`apps/miniapp/tsconfig.json` 中的 `@/*` paths 只能辅助编辑器和 `tsc` 类型解析，不能作为当前小程序运行时导入规范。若后续引入能重写 alias 的构建链路，必须先通过微信开发者工具和 `miniprogram-ci` 验证，再调整本约定。

同理，原生小程序运行代码不要直接从 workspace 包做 value import，例如不要在运行时代码中导入 `@gaoge/miniapp-api-contract` 的 `MiniRoutes`、`MiniErrorCode`、`MINI_API_VERSION`。这些常量应放在 `miniprogram/contracts/*` 这类本地运行时文件中；共享契约包在小程序端只用于 `import type`。

## 分包页面

主包只放首屏和高频入口。详情、报名、签到、海报、长列表和低频能力默认进入分包。

页面路径统一由 `config/routes.ts` 管理。页面内不要手写跳转路径字符串。

分包内页面可以引用主包内 `core/`、`config/`、`services/`、`stores/` 和 `components/`，但主包内基础层不要反向依赖分包页面。

## 环境配置

小程序环境配置集中在 `miniprogram/config/env.ts`。当前只维护两套业务环境：

- `development`：本地开发环境，默认 API 为 `http://127.0.0.1:3000`
- `production`：正式线上环境，默认 API 为 `https://api.gaoge.cc`

环境通过 `wx.getAccountInfoSync().miniProgram.envVersion` 自动识别：

- `release` 使用 `production`
- `develop` 和 `trial` 使用 `development`

页面和 service 不直接判断环境，只消费 `API_BASE_URL`、`REQUEST_TIMEOUT` 等已整理好的配置值。小程序端配置只放公开信息，不放 appSecret、数据库地址、私钥或其他密钥。

本地只开发小程序端时，根目录执行 `pnpm dev:miniapp`。该命令会检查本地 API 是否已在 `http://127.0.0.1:3000/health` 运行；未运行时自动启动 `apps/api`，并提示手动用微信开发者工具打开 `apps/miniapp` 目录。

真机调试时，手机无法访问电脑的 `127.0.0.1`。需要改成本机局域网地址、内网穿透 HTTPS 地址，或在开发者工具内仅做模拟器调试。
