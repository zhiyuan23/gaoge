# 高歌品牌站与体育官网域名、目录重构设计

## 1. 背景

当前 `apps/web` 实际承载高歌体育官网，并通过现有 Web 发布流程对外提供服务。随着高歌从单一体育官网向母品牌体系发展，根域名和应用目录需要从“通用 Web 前台”调整为清晰的产品角色：

- `gaoge.cc` 承载高歌母品牌官网
- `sports.gaoge.cc` 承载高歌体育官网
- `www.gaoge.cc` 继续永久跳转到 `gaoge.cc`

本设计先完成域名、应用目录和发布边界重构，再以品牌封面页占位，为后续独立开发完整品牌官网建立基础。

## 2. 目标

本阶段需要实现以下结果：

1. 将现有 `apps/web` 重命名并收敛为 `apps/sports`
2. 将包名从 `@gaoge/app-web` 调整为 `@gaoge/app-sports`
3. 新建独立的 `apps/brand` 品牌官网应用
4. 让 `gaoge.cc` 展示高歌品牌封面页
5. 让 `sports.gaoge.cc` 完整承接现有高歌体育官网
6. 保留现有 `www.gaoge.cc` 到 `gaoge.cc` 的 301 跳转
7. 对旧体育页面路径建立永久跳转，避免已有链接失效
8. 将两个官网的构建、发布、健康检查和回滚完全拆分
9. 同步仓库级应用矩阵、命令、工程规范与验证文档

## 3. 非目标

本阶段不包含：

- 开发完整的高歌品牌官网栏目
- 重构现有体育官网页面或体育业务逻辑
- 为两个官网提前抽取共享品牌组件
- 调整 `admin.gaoge.cc` 或 `api.gaoge.cc` 的产品职责
- 修改现有 `www.gaoge.cc` 到 `gaoge.cc` 的规范地址策略
- 将品牌站和体育官网合并为按 Host 判断的单一应用

## 4. 品牌体系

### 4.1 对外品牌

- 中文母品牌：高歌
- 英文标识：GAOGE
- 企业与技术主体表达：高歌数字
- 品牌理念与长期内容主题：高歌路

官网统一以“高歌 / GAOGE”为主标识。“高歌数字”用于解释企业和数字能力，不与母品牌并列。“高歌路”保留为后续品牌理念、故事或内容栏目的名称。

### 4.2 第一阶段品牌主张

品牌封面页使用以下主张：

> 向热爱而行，让创造持续高歌

辅助说明为：

> 高歌数字，以数字技术连接体育、内容与未来体验。

## 5. 域名规划

| 域名              | 应用          | 职责              | 规范地址策略                         |
| ----------------- | ------------- | ----------------- | ------------------------------------ |
| `gaoge.cc`        | `apps/brand`  | 高歌母品牌官网    | 品牌站唯一规范地址                   |
| `www.gaoge.cc`    | 无独立应用    | 兼容传统 www 入口 | 301 到 `https://gaoge.cc` 并保留路径 |
| `sports.gaoge.cc` | `apps/sports` | 高歌体育官网      | 体育内容唯一规范地址                 |
| `admin.gaoge.cc`  | `apps/admin`  | 内部管理后台      | 保持不变                             |
| `api.gaoge.cc`    | `apps/api`    | 统一业务 API      | 保持不变                             |

后续如增加新的独立业务，应继续采用语义明确的子域名，不复用 `www` 或通用 `web` 名称承载具体产品。

## 6. 应用与目录规划

```text
apps/
├─ admin/     # 内部管理后台
├─ api/       # 统一业务 API
├─ brand/     # 高歌母品牌官网
├─ sports/    # 高歌体育官网
├─ desktop/
├─ ios/
├─ miniapp/
└─ uniapp/
```

### 6.1 `apps/sports`

`apps/sports` 由现有 `apps/web` 原样迁移：

- 包名改为 `@gaoge/app-sports`
- 页面、路由、接口调用和现有测试保持功能等价
- `public/CNAME` 改为 `sports.gaoge.cc`
- HTML 标题与描述继续表达“高歌体育”
- 不在本阶段做视觉或业务重构

### 6.2 `apps/brand`

`apps/brand` 是独立的 Vue 3、Vite、Tailwind CSS 应用：

- 包名为 `@gaoge/app-brand`
- 拥有独立入口、样式、构建和测试配置
- 第一阶段只提供品牌封面页
- 后续在该应用内逐步增加品牌介绍、业务版图、品牌故事与联系入口
- 不直接依赖 `apps/sports`

### 6.3 共享边界

第一阶段不把品牌标识、页面组件或样式抽入 `packages/*`。只有当多个应用形成稳定、真实的复用需求后，才评估进入共享 UI 或共享常量包。

## 7. 品牌封面页设计

### 7.1 内容结构

品牌封面页包含：

1. `GAOGE / 高歌` 主标识
2. 品牌主张“向热爱而行，让创造持续高歌”
3. “高歌数字”主体说明
4. “进入高歌体育”主入口，链接到 `https://sports.gaoge.cc`
5. 品牌版权与 `gaoge.cc` 标识

### 7.2 视觉方向

- 整体克制、现代、有长期品牌感
- 主色为黑色与暖白色，以高歌红作为单一强调色
- 强调字型、留白和轻量动效，不复用体育官网的大图赛事表达
- 同时适配桌面端和移动端
- 页面应满足基本的键盘操作、可读对比度和减少动态效果偏好

### 7.3 页面边界

封面页不是“建设中”提示，也不伪造尚未存在的业务版图、客户案例或公司数据。它只建立真实的品牌身份和进入现有体育业务的入口。

## 8. 旧链接迁移

切换根域名后，现有体育深链不能由品牌 SPA 接管。Nginx 在品牌站路由之前处理已存在的体育路径：

- `https://gaoge.cc/teams` → `https://sports.gaoge.cc/teams`
- `https://gaoge.cc/teams/football` → `https://sports.gaoge.cc/teams/football`
- `https://gaoge.cc/teams/football/assets` → `https://sports.gaoge.cc/teams/football/assets`
- 上述路径携带的查询参数应保留

跳转状态码使用 301。`gaoge.cc/` 不跳转，直接展示品牌封面页。

`www.gaoge.cc/*` 继续先归一到 `gaoge.cc/*`。若服务器配置支持针对体育路径直接跳到 `sports.gaoge.cc`，可减少一次跳转，但不能改变最终规范地址。

## 9. 开发与发布命名

### 9.1 根命令

- 删除 `dev:web`
- 新增 `dev:sports`
- 新增 `dev:brand`
- 应用过滤器分别使用 `@gaoge/app-sports` 和 `@gaoge/app-brand`

### 9.2 GitHub Actions

- `deploy-web.yml` 重命名为 `deploy-sports.yml`
- 新增 `deploy-brand.yml`
- 两个工作流只监听自身应用以及实际依赖的共享目录
- 两个工作流分别执行测试、类型检查、构建、上传、软链接切换和健康检查

### 9.3 部署配置命名

体育站使用：

- `SPORTS_DEPLOY_HOST`
- `SPORTS_DEPLOY_USER`
- `SPORTS_DEPLOY_PATH`
- `SPORTS_HEALTH_URL`

品牌站使用：

- `BRAND_DEPLOY_HOST`
- `BRAND_DEPLOY_USER`
- `BRAND_DEPLOY_PATH`
- `BRAND_HEALTH_URL`

如两个站点部署到同一服务器，Host 和 User 的值可以相同，但变量名称仍按应用拆分，避免发布边界再次含糊。

## 10. 服务器发布结构

目标结构：

```text
/var/www/gaoge/
├─ brand/
│  ├─ releases/<commit>
│  └─ current -> releases/<commit>
└─ sports/
   ├─ releases/<commit>
   └─ current -> releases/<commit>
```

每次发布先上传到不可变的 commit release 目录，完成后再原子切换 `current`。品牌站与体育官网分别保留历史 release，可独立回滚。

实际落地前需要只读确认服务器现有 `WEB_DEPLOY_PATH` 与 Nginx root，避免覆盖当前线上目录。若现有路径与目标结构不同，先复制或复用现有 release，再切换软链接，不直接删除原部署目录。

## 11. DNS、TLS 与 Nginx

### 11.1 DNS

为 `sports.gaoge.cc` 增加指向现有 Web 服务器的 DNS 记录。记录类型根据现有服务器和 DNS 供应商确定，优先复用根域名当前的目标。

### 11.2 TLS

证书必须覆盖 `sports.gaoge.cc`。在证书生效前，不把现有体育官网从根域名切走。

### 11.3 Nginx

服务器包含三个独立行为：

1. `www.gaoge.cc` 永久跳转到 `gaoge.cc`
2. `gaoge.cc` 提供品牌站，并优先处理旧体育路径跳转
3. `sports.gaoge.cc` 提供体育官网及 SPA history fallback

Nginx 配置修改前保留原配置副本，并在 reload 前执行语法校验。

## 12. API 与微信分享

### 12.1 CORS

`apps/api` 的生产 Origin 白名单增加：

```text
https://sports.gaoge.cc
```

现有 `gaoge.cc`、`www.gaoge.cc`、`admin.gaoge.cc` 和 `api.gaoge.cc` 暂时保留，避免无关兼容性变化。品牌封面页第一阶段不调用业务 API。

### 12.2 微信分享

体育官网继续使用现有动态页面 URL 生成签名，代码不应写死根域名。上线前需要在微信公众平台将 `sports.gaoge.cc` 配置为 JS 接口安全域名，并验证：

- 首页分享
- 球队页分享
- 球队资产页分享
- 分享标题、描述和图片配置

历史分享链接通过服务器 301 到新的体育域名。

## 13. 上线顺序

上线采用先承接、后切换的顺序：

1. 只读确认服务器现有 Web 路径、Nginx 站点和证书状态
2. 建立品牌站与体育官网的独立 release 目录
3. 配置 `sports.gaoge.cc` DNS
4. 签发或扩展 TLS 证书
5. 发布体育官网到 `sports/current`
6. 配置并验证 `sports.gaoge.cc`
7. 将 `sports.gaoge.cc` 加入 API CORS 与微信 JS 安全域名
8. 验证体育官网关键页面、API 和微信分享
9. 发布品牌封面到 `brand/current`
10. 将 `gaoge.cc` 切换到品牌站
11. 启用旧体育路径 301
12. 验证所有域名、跳转与关键页面

只有步骤 8 验证通过后，才能执行根域名的品牌站切换。

## 14. 错误处理与回滚

- 应用构建或上传失败时，不切换 `current`
- `sports.gaoge.cc` 验证失败时，`gaoge.cc` 继续提供原体育官网
- 品牌站切换失败时，将 `gaoge.cc` 的 Nginx root 恢复到原体育 release
- 两个应用的 release 和软链接独立回滚
- Nginx reload 失败时保留当前进程配置，不继续域名切换
- DNS 或 TLS 尚未生效时暂停后续步骤，不使用临时不安全地址替代正式域名

## 15. 验证标准

### 15.1 仓库验证

体育官网：

```bash
pnpm --filter @gaoge/app-sports typecheck
pnpm --filter @gaoge/app-sports test
pnpm --filter @gaoge/app-sports build
```

品牌站：

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
```

API CORS：

```bash
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-api test
```

根配置和文档同步后：

```bash
pnpm typecheck
pnpm lint
```

### 15.2 线上 smoke test

- `https://gaoge.cc/` 返回 200 并展示品牌封面
- `https://www.gaoge.cc/` 返回 301，Location 指向 `https://gaoge.cc/`
- `https://sports.gaoge.cc/` 返回 200 并展示高歌体育官网
- `https://sports.gaoge.cc/teams/football` 可直接刷新
- `https://sports.gaoge.cc/teams/football/assets` 可直接刷新
- `https://gaoge.cc/teams/football` 返回 301 到体育子域名
- 体育官网访问 `https://api.gaoge.cc` 不产生 CORS 错误
- 微信内关键页面签名和分享配置正常
- `admin.gaoge.cc` 与 `api.gaoge.cc` 不受影响

## 16. 文档同步

由于真实应用目录、命名、常用命令和发布流程发生变化，实施时必须同步：

- `AGENTS.md`
- `README.md`
- `docs/architecture/monorepo-structure.md`
- `docs/architecture/shared-contracts-and-ai-migration.md`
- `docs/conventions/env-and-config.md`
- `docs/conventions/frontend-styling.md`
- `docs/conventions/testing-and-verification.md`

历史设计文档和历史实施计划保留原始记录，不批量改写其中的 `apps/web`。

## 17. 完成定义

满足以下条件后，本阶段才算完成：

1. 仓库中存在职责明确、可独立运行的 `apps/brand` 与 `apps/sports`
2. 现有体育官网功能在 `sports.gaoge.cc` 保持可用
3. `gaoge.cc` 展示经过确认的品牌封面
4. 现有 `www` 301 行为保持正确
5. 已知体育深链迁移到体育子域名
6. 两个官网可以独立发布和回滚
7. API CORS 与微信分享完成域名适配
8. 受影响测试、类型检查、构建和线上 smoke test 通过
9. 仓库级架构与开发规范文档已同步
