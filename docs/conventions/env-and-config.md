# 环境变量与配置规范

本规范用于统一 monorepo 中各应用的环境变量命名、配置读取和密钥边界。

## 核心原则

- 环境变量按应用边界管理，不做跨应用隐式共享
- 前端可注入变量必须显式使用对应前缀
- 业务代码优先通过应用内配置入口读取，不散落直读
- 密钥和生产配置不入库

## 文件约定

- 示例配置使用 `.env.example`
- 本地开发配置优先使用 `.env.local`
- 生产环境配置由部署环境管理，不提交真实密钥

当前已知事实：

- `apps/api` 启动时按 `.env.local`、`.env` 顺序加载
- 前端应用通过 Vite / uni-app 的环境变量机制读取配置
- `apps/miniapp` 为微信原生小程序，当前通过 `wx.getAccountInfoSync().miniProgram.envVersion` 在 `miniprogram/config/env.ts` 中选择环境 profile，不使用 Vite / uni-app 环境变量机制

## 前端应用约定

适用应用：

- `apps/admin`
- `apps/web`
- `apps/uniapp`

规则：

- 只允许暴露带前缀的前端变量
- 页面和业务模块优先通过应用内 API/config 文件消费配置
- 不在大量组件和页面里散落 `import.meta.env.*`

`apps/miniapp` 例外：

- 原生微信小程序没有 Vite / uni-app 的环境变量注入链路
- 小程序端只在 `miniprogram/config/env.ts` 维护公开配置 profile
- `release` 对应正式线上，`develop` / `trial` 对应本地开发

建议：

- API 基地址、代理前缀、应用标题这类公共配置集中在 `api`、`config` 或启动入口附近读取
- 页面只消费已经整理好的配置值

## API 应用约定

适用应用：

- `apps/api`

规则：

- 普通业务模块优先通过 `ConfigService` 读取配置
- `main.ts`、进程入口、脚本文件可直接读取少量 `process.env.*`
- 数据库连接仍以 Prisma schema 和 `DATABASE_URL` 为事实来源
- 上传目录这类部署相关路径必须使用显式环境变量配置；当前 API 上传根目录使用 `API_UPLOAD_ROOT`
- 生产部署必须通过 `EXPECTED_DATABASE_HOST` 固定期望数据库 host，避免同机多 PostgreSQL 时 `DATABASE_URL` 指向含义不明确的 `127.0.0.1:5432` 或 `localhost:5432`

## 脚本与工具约定

- 开发辅助脚本可读取环境变量，但要控制在脚本入口集中处理
- 脚本依赖的关键变量，应在注释、示例文件或文档中声明
- 不在多个 shell 脚本和 Node 脚本里各自发明同名不同义的变量

## 命名建议

- API 地址、代理、应用标题、端口等使用清晰且稳定的名字
- 不使用语义含糊的变量名，例如 `HOST2`、`TEMP_URL`
- 新增变量时，优先与当前应用既有命名风格保持一致

## 禁止行为

- 提交真实密钥、生产数据库地址或第三方私钥
- 在共享包里依赖某个应用的环境变量
- 在页面细节里广泛散落环境变量判断
