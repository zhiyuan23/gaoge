# Web/Admin Monorepo 迁移与部署设计

日期：2026-05-04

## 目标

在当前 `gaoge` monorepo 内完成前台站点迁移与后续部署规划收敛，使仓库成为唯一开发与发布源，并为后续 `admin` 自动部署建立统一模式。

本设计覆盖三件事：

- 将平级仓库 `gaoge-web` 迁入当前仓库的 `apps/web`
- 明确 `gaoge-server` 与当前 `apps/api` 的关系，避免双仓库双发布源
- 规划 `web`、`admin`、`api` 三条独立 GitHub Actions 部署流水线

## 背景

当前仓库已经具备 monorepo 基础结构，且 `apps/api` 与 `apps/admin` 已进入真实业务迁移阶段。

实际代码现状如下：

- `apps/web` 当前仍是占位壳，仅有极简 `src/main.ts`
- 平级目录 `/Users/snow/Documents/Gaoge/gaoge-web` 才是现有真实前台项目
- 平级目录 `/Users/snow/Documents/Gaoge/gaoge-server` 仍保留旧服务端仓库
- 当前 monorepo 根目录已经存在 `.github/workflows/deploy-api.yml`

现有部署现状如下：

- `gaoge-web` 当前 workflow 是 GitHub Pages 发布，不是服务器静态部署
- `gaoge-server` 当前 workflow 是 SSH + rsync + PM2 的服务器部署
- 你已经确认未来 `web`、`admin`、`api` 都部署在同一台服务器
- 域名规划已确认：
  - `gaoge.cc` / `www.gaoge.cc` -> `apps/web`
  - `admin.gaoge.cc` -> `apps/admin`

因此当前真正要解决的问题不是“是否能迁”，而是“迁入后谁是唯一事实源，以及三类应用如何独立发布”。

## 范围

包含：

- `gaoge-web` 到 `apps/web` 的迁移边界定义
- 统一后的仓库与发布责任划分
- `web`、`admin`、`api` 的服务器部署拓扑
- 三条 GitHub Actions workflow 的职责与触发规则
- 旧仓库退役策略

不包含：

- 本次直接实施代码迁移
- 本次直接编写 workflow
- 本次直接修改服务器 Nginx 配置
- 本次直接调整 `apps/admin` 业务代码
- 本次直接调整 `apps/api` 业务模块结构

## 设计原则

### monorepo 作为唯一事实源

迁移完成后，`gaoge` 必须成为：

- 唯一开发仓库
- 唯一合并仓库
- 唯一正式发布仓库

原因：

- 避免 `gaoge-web`、`gaoge-server` 与 monorepo 长期代码漂移
- 避免 secrets、发布记录、回滚入口分散
- 避免未来 `admin` 接入后形成三套独立工程治理

### 应用统一开发，发布独立执行

代码统一进 monorepo，不等于发布必须绑定。

三个应用应保持：

- 同仓库开发
- 独立构建
- 独立部署
- 独立回滚

原因：

- 前台改动不应触发后台或 API 发布
- 后台改动不应影响主站
- API 发布频率、验证方式、回滚方式与静态站天然不同

### 迁移应用代码，不迁移旧仓库边界

本次迁入的是 `gaoge-web` 的业务实现，不是把它整个仓库原封不动搬进来。

因此：

- 迁源码、资源、配置、测试
- 不迁 `.git`
- 不迁旧 `.github/workflows`
- 不迁独立锁文件
- 不迁本地缓存和 AI 临时目录

这能避免在 monorepo 内叠第二套工程系统。

### 静态站点采用版本目录 + 软链接切换

`web` 与 `admin` 不采用直接覆盖目标目录的发布方式。

改为：

- 每次发布先上传到 release 目录
- 上传完成后切换 `current` 软链接
- Nginx 始终指向稳定软链接

原因：

- 避免 rsync 覆盖过程中的半更新状态
- 回滚时只需切回上一个 release
- 发布失败时不污染当前线上版本

## 目标架构

### 仓库结构目标

迁移后的职责如下：

- `apps/web`
  - 承接原 `gaoge-web`
  - 成为 `gaoge.cc` 与 `www.gaoge.cc` 的唯一前台代码来源
- `apps/admin`
  - 保持后台管理端应用
  - 成为 `admin.gaoge.cc` 的唯一代码来源
- `apps/api`
  - 保持服务端应用
  - 成为原 `gaoge-server` 的唯一服务端代码来源

平级旧仓库处理如下：

- `gaoge-web` 迁移完成后不再承担正式开发与发布职责
- `gaoge-server` 后续不再承担正式开发与发布职责

### 服务器结构目标

建议目录：

```text
/var/www/gaoge/
  releases/
    web/<git-sha>/
    admin/<git-sha>/
  current/
    web -> /var/www/gaoge/releases/web/<git-sha>
    admin -> /var/www/gaoge/releases/admin/<git-sha>

/var/www/gaoge/api/
  releases/
    api/<git-sha>/
  current -> /var/www/gaoge/api/releases/api/<git-sha>
  shared/
    api.env
```

职责说明：

- `releases/web/*` 保存 web 历史发布版本
- `releases/admin/*` 保存 admin 历史发布版本
- `releases/api/*` 保存 API 历史发布版本与对应依赖
- `current/web`、`current/admin` 和 `/var/www/gaoge/api/current` 都作为稳定入口
- `shared/api.env` 作为 API 发布版本共享的环境变量文件

### 域名与流量入口

Nginx 目标关系如下：

- `gaoge.cc` -> `/var/www/gaoge/current/web`
- `www.gaoge.cc` -> `/var/www/gaoge/current/web`
- `admin.gaoge.cc` -> `/var/www/gaoge/current/admin`

API 继续按现有服务器模式暴露，不在本设计中强制改域名结构。

## 迁移边界

### 从 `gaoge-web` 迁入的内容

应迁入 `apps/web` 的内容：

- `src/`
- `public/`
- `index.html`
- `vite.config.js` 对应的 Vite 构建配置
- 测试文件
- 项目运行所需静态资源

迁移后的 `apps/web` 不再保留当前占位脚手架，而是变成真实前台应用。

### 不迁入的内容

以下内容不应进入 monorepo：

- `gaoge-web/.git`
- `gaoge-web/.github/workflows/*`
- `gaoge-web/pnpm-lock.yaml`
- `gaoge-web/.pnpm-store`
- `gaoge-web/.claude`
- `gaoge-web/.superpowers`
- 其他本地缓存或 AI 临时产物

### `apps/web` 迁入后的工程要求

迁入后要服从当前 monorepo 规范：

- 包名保持 `@gaoge/app-web`
- 由根工作区统一安装依赖
- 构建和校验脚本接入根 `turbo`
- 后续允许逐步接入 `packages/shared/*`、`packages/sdk/*`、`packages/ui/*`

本阶段不要求一次性把所有业务代码抽到共享包，只要求先稳定落地为 monorepo 应用。

## 部署方案

### Web 与 Admin

两者都作为静态站点部署，发布步骤统一为：

1. 在 CI 中安装 monorepo 依赖
2. 仅构建目标应用
3. 将产物上传到服务器新 release 目录
4. 切换 `current/<app>` 软链接
5. 校验站点可访问

这种方式适合：

- `apps/web`
- `apps/admin`

不适合采用 PM2，也不应与 API 的 Node 进程发布混用。

### API

`apps/api` 采用“CI 生成 release artifact，服务器解压发布”的方式：

1. 校验和构建 API
2. 在 CI 中生成自包含的 API 发布包
3. 上传到服务器新 release 目录
4. 将共享 `.env` 链接到该 release
5. 执行 `prisma migrate deploy`
6. 切换 `current`
7. 删除旧 PM2 进程定义后重新启动

这条线仍与静态站分离，因为它保留了 PM2 和数据库迁移，但发布形态收敛为 release + symlink，避免每次把整套 monorepo 同步到服务器。

## Workflow 设计

### 总体原则

最终在 monorepo 根目录保留 3 条正式发布流水线：

- `.github/workflows/deploy-web.yml`
- `.github/workflows/deploy-admin.yml`
- `.github/workflows/deploy-api.yml`

三条流各自独立：

- 独立并发组
- 独立触发条件
- 独立 secrets
- 独立回滚目标

### `deploy-web.yml`

职责：

- 校验 `apps/web`
- 构建 `apps/web`
- 上传到 `/var/www/gaoge/releases/web/<git-sha>`
- 切换 `/var/www/gaoge/current/web`
- 校验 `gaoge.cc` 或 `www.gaoge.cc`

触发路径建议：

- `apps/web/**`
- `packages/shared/**`
- `packages/sdk/**`
- `packages/ui/**`
- `packages/configs/**`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `package.json`
- `turbo.json`

### `deploy-admin.yml`

职责：

- 校验 `apps/admin`
- 构建 `apps/admin`
- 上传到 `/var/www/gaoge/releases/admin/<git-sha>`
- 切换 `/var/www/gaoge/current/admin`
- 校验 `admin.gaoge.cc`

触发路径建议：

- `apps/admin/**`
- `packages/shared/**`
- `packages/sdk/**`
- `packages/ui/**`
- `packages/configs/**`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `package.json`
- `turbo.json`

### `deploy-api.yml`

职责：

- 校验 `apps/api`
- 构建 `apps/api`
- 打包 API release artifact
- 上传到 `/var/www/gaoge/api/releases/api/<git-sha>`
- 服务器端执行迁移、切换 `current`、删除旧 PM2 定义并重新启动

触发路径建议：

- `apps/api/**`
- `packages/shared/**`
- `packages/server/**`
- `packages/configs/**`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `package.json`
- `turbo.json`

## Secrets 规划

建议按应用维度命名，而不是复用一组模糊的全局变量。

公共 secrets：

- `SSH_PRIVATE_KEY`

Web secrets：

- `WEB_DEPLOY_HOST`
- `WEB_DEPLOY_USER`
- `WEB_DEPLOY_PATH`
- `WEB_HEALTH_URL`

Admin secrets：

- `ADMIN_DEPLOY_HOST`
- `ADMIN_DEPLOY_USER`
- `ADMIN_DEPLOY_PATH`
- `ADMIN_HEALTH_URL`

API secrets：

- `API_DEPLOY_HOST`
- `API_DEPLOY_USER`
- `API_DEPLOY_PATH`
- `API_HEALTH_URL`
- `DATABASE_URL`
- `DEPLOY_ENV_FILE_API`

即使三者当前部署在同一台服务器，也建议逻辑上按应用拆分 secrets，避免后续脚本耦合与误用。

## 旧仓库退役策略

### `gaoge-web`

迁移完成后建议：

- 停止旧仓库 workflow
- README 标注“已迁入 monorepo，不再继续开发”
- 保留仓库仅作历史参考

不建议继续在旧仓库发版，否则会产生双发布源。

### `gaoge-server`

建议后续同样处理：

- 停止旧仓库 workflow
- 明确 `apps/api` 为唯一服务端来源
- 保留旧仓库仅作历史参考

当前 monorepo 根目录 `deploy-api.yml` 已经具备接班条件，不需要继续维护两套 API 发布流。

## 实施顺序

建议按以下顺序推进：

1. 完成 `gaoge-web` 到 `apps/web` 的代码迁移
2. 让 `apps/web` 在 monorepo 内本地可运行、可构建
3. 新增 `deploy-web.yml`，发布到服务器 release 目录并切软链接
4. 验证 `gaoge.cc` 与 `www.gaoge.cc` 指向的新发布流
5. 为 `apps/admin` 新增 `deploy-admin.yml`
6. 验证 `admin.gaoge.cc` 的独立静态部署
7. 将旧 `gaoge-web` workflow 停用
8. 明确旧 `gaoge-server` 停止作为正式发布入口

## 风险与约束

### 风险 1：双发布源

如果迁移后旧 `gaoge-web` 或旧 `gaoge-server` 仍继续发版，线上状态会失去单一来源。

约束：

- 新 workflow 生效后，旧仓库必须尽快停用发布能力

### 风险 2：路径触发过宽

如果 workflow 不做 `paths` 限制，后续一次无关改动可能触发多应用发布。

约束：

- 三条 workflow 必须设置应用级触发路径

### 风险 3：静态站覆盖发布

如果直接把产物覆盖到线上目录，发布中断时可能出现半更新版本。

约束：

- `web` 与 `admin` 必须采用 release + symlink 模式
- `api` 应采用 release artifact + symlink 模式，避免在线覆盖源码目录

### 风险 4：过早共享化

迁入 `apps/web` 时若同时大规模抽共享包，容易把一次迁移扩展成重构项目。

约束：

- 本阶段优先迁入并跑通
- 共享抽象后置到独立任务

## 验收标准

当以下条件全部满足时，说明设计目标达成：

- `gaoge-web` 真实业务代码已迁入 `apps/web`
- monorepo 可以独立构建 `apps/web`
- `web`、`admin`、`api` 在 monorepo 中各有独立 workflow
- `gaoge.cc` / `www.gaoge.cc` 由 monorepo 的 `apps/web` 发布
- `admin.gaoge.cc` 由 monorepo 的 `apps/admin` 发布
- `apps/api` 继续由 monorepo workflow 发布
- `apps/api` 发布不再依赖整仓 rsync 到服务器
- 旧 `gaoge-web` 与旧 `gaoge-server` 不再承担正式发布职责
