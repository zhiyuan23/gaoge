# Gaoge 单一 PostgreSQL 收敛设计

## 背景

2026 年 7 月 28 日生产服务器重启后，`gaoge-api` 连接到
`127.0.0.1:5432/gaoge_db`。该数据库结构完整但业务表为空，因此健康检查和 HTTP
接口仍返回成功，球员、球队、比赛、资产和后台账号却表现为全部消失。

生产服务器实际同时运行两套 PostgreSQL：

- 宝塔 PostgreSQL：`/www/server/pgsql/data`，监听 `127.0.0.1:5432`
- Ubuntu PostgreSQL 16：`/var/lib/postgresql/16/main`，监听 `[::]:5432`

Ubuntu PostgreSQL 启动日志明确记录 IPv4 `5432` 已被占用，只能继续监听 IPv6。
真实 `gaoge_db` 位于 Ubuntu PostgreSQL 16，空的同名数据库位于宝塔 PostgreSQL。

事故恢复后，`gaoge-api` 已重新连接 `[::1]:5432/gaoge_db`。恢复时确认的生产基线为：

- 用户：7
- 球员：39
- 球队：3
- 比赛：14
- 资产记录：37

本设计用于从当前 `gaoge` 项目开始收敛数据库配置和部署流程，避免迁移、运行时和重启恢复再次落到不同实例。

## 目标

- 将 Ubuntu PostgreSQL 16 的 `[::1]:5432/gaoge_db` 定义为当前项目唯一生产数据库。
- 让 Prisma 迁移、PM2 运行时和发布后守卫读取同一份生产环境文件。
- 在生产迁移前验证数据库身份、关键业务数据和可恢复备份。
- 在切换 release 后验证真实数据库身份、关键接口数据和 Admin CORS。
- 在发布失败时自动恢复旧 release 和旧环境文件，不自动回滚数据库迁移。
- 通过测试和运维文档固化约束，使后续发布和服务器重启可重复验证。

## 非目标

- 本阶段不迁移 `gaoge-compass_db`。
- 本阶段不停止或卸载宝塔 PostgreSQL。
- 本阶段不修改 `gaoge-club` 或 `gaoge-compass` 仓库。
- 本阶段不主动重启生产服务器或 PostgreSQL 进行演练。
- 本阶段不自动执行数据库迁移的逆向回滚。

## 已选方案

采用单一运行时环境文件方案：

- GitHub Secret `DEPLOY_ENV_FILE_API` 是唯一生产配置源。
- 服务器 `/var/www/gaoge/api/shared/api.env` 是发布过程中的唯一运行时配置文件。
- 每个 API release 的 `.env` 继续软链接到 `shared/api.env`。
- Prisma 生产迁移在 release 内加载同一份 `.env`。
- PM2 从同一份 `.env` 启动。
- `.env` 只按 dotenv 语义解析，不得通过 Shell `source`/`.` 执行。
- 独立的 GitHub Secret `DATABASE_URL` 不再被构建或部署流程使用，并在上线稳定后移除。
- `EXPECTED_DATABASE_HOST` 与预期库名只用于断言，不保存第二份连接串。

保留双 Secret 并比较连接串的方案仍存在长期配置漂移风险；服务器级服务发现会引入当前阶段不需要的基础设施和权限体系，因此不采用。

## 架构

### 唯一配置流

```text
GitHub Secret DEPLOY_ENV_FILE_API
  -> 临时环境文件
  -> 配置目标校验
  -> 原子替换 shared/api.env
  -> release/.env 软链接
  -> Prisma migrate deploy
  -> PM2 gaoge-api
  -> 运行时数据库守卫
```

唯一允许的生产数据库目标为：

```text
host: [::1]
port: 5432
database: gaoge_db
service: postgresql@16-main
data directory: /var/lib/postgresql/16/main
```

CI 中的 Prisma Generate 不需要连接数据库，使用固定、无真实权限的占位连接串完成 Client 生成，不读取生产数据库 Secret。

### 生产数据库守卫

新增独立守卫脚本，使用 Node.js 内置模块完成以下职责：

1. 从指定环境文件读取且只读取一个 `DATABASE_URL`。
2. 使用标准 URL 解析校验协议、主机、端口和库名。
3. 要求连接串恰好包含一个 `schema=public`，探测固定使用并验证 public schema。
4. 通过环境变量向 PostgreSQL CLI 传递连接信息，避免密码出现在命令参数和日志中。
5. 调用 `psql` 查询：
   - `inet_server_addr()`
   - `inet_server_port()`
   - `current_database()`
   - 用户、球员、球队、比赛和资产记录数量
6. 要求实际地址为 `::1`、端口为 `5432`、库名为 `gaoge_db`。
7. 要求五类关键业务表的数量均大于零。
8. 输出只包含脱敏后的地址、端口、库名和计数，不输出用户名、密码或完整连接串。

守卫支持迁移前和启动后重复执行。迁移前防止写入错误数据库，启动后防止 PM2 使用错误运行时配置。

### PostgreSQL 自愈

`infra/deploy/postgres/check-postgres.sh` 继续只管理 `postgresql@16-main`，但不再依赖默认 socket 解析。脚本显式使用 Ubuntu PostgreSQL 的 socket 目录，并验证 `data_directory` 为 `/var/lib/postgresql/16/main`。

宝塔 PostgreSQL 不属于当前项目的自愈范围。Compass 完成后续迁移前，宝塔实例由其现有运维方式维持。

## 部署数据流

### 1. CI 构建

1. 安装依赖。
2. 使用固定占位 `DATABASE_URL` 生成 Prisma Client。
3. 完成 API 类型检查和构建。
4. 生成并上传 API release。

构建阶段不得引用 `${{ secrets.DATABASE_URL }}`。

### 2. 保存回滚状态

部署开始后，在服务器记录：

- 当前 `current` 软链接的真实 release 路径
- 当前 `shared/api.env` 的带时间戳备份路径
- 本次新 release 路径

回滚状态放在 `${API_DEPLOY_PATH}/tmp/deploy-state`，目录名包含 GitHub run ID 与 run attempt，避免同一 Git SHA 重跑时复用旧状态。

### 3. 写入环境文件

1. 将 `DEPLOY_ENV_FILE_API` 写入同目录临时文件。
2. 校验环境文件中只有一个 `DATABASE_URL`。
3. 校验目标为 `[::1]:5432/gaoge_db`。
4. 校验通过后使用原子重命名替换 `shared/api.env`。
5. 任一步失败时保留现有正式环境文件。

### 4. 迁移前探测与备份

1. 使用 `shared/api.env` 连接数据库。
2. 验证实际数据库身份和关键表非空。
3. 使用 `pg_dump --format=custom` 创建带时间戳备份。
4. 使用 `pg_restore --list` 验证备份可读取且清单非空。
5. 记录 SHA-256 和备份大小。
6. 只保留最近 14 份由部署流程创建的 Gaoge 生产备份。

只有探测与备份全部成功后才允许执行 Prisma 迁移。

### 5. Prisma 迁移

1. release 的 `.env` 软链接指向 `shared/api.env`。
2. release 加载该 `.env`。
3. 执行 `prisma migrate deploy`。

工作流不得在此步骤注入独立 `DATABASE_URL`。

### 6. Release 切换

1. 将 `current` 指向新 release。
2. 在新 `current` 下启动或重启 `gaoge-api`。
3. 暂不执行 `pm2 save`。

### 7. 发布后验收

发布后依次验证：

- `gaoge-api` 在线且工作目录指向本次 release。
- PM2 中不存在 `gaoge-server`。
- 运行时数据库身份为 `[::1]:5432/gaoge_db`。
- 五类关键业务表均非空。
- `/health` 与 `/health/db` 成功。
- 球员、球队、比赛和资产接口返回 `code=0` 且 `data.total > 0`。
- `https://admin.gaoge.cc` 对 `/auth/admin/login` 的 CORS 预检成功。

全部通过后执行 `pm2 save`。

## 异常处理与回滚

### 切换前失败

配置校验、数据库探测、备份或迁移任一步失败时：

- 不切换 `current`。
- 不重启当前 PM2 进程。
- 恢复部署开始前的 `shared/api.env`。
- 保留失败 release、备份和日志供排查。

### 切换后失败

PM2、数据库身份或公网验收失败时：

1. 恢复旧 `current` 软链接。
2. 恢复旧 `shared/api.env`。
3. 从旧 `current` 重启 `gaoge-api`。
4. 对旧 release 执行基础健康检查。
5. 健康检查通过后保存 PM2 状态。
6. 保留失败 release 和日志。

### 数据库迁移

发布流程不自动执行 Prisma migration 的逆向回滚，也不自动恢复 `pg_dump`。所有生产 migration 必须保持前后版本兼容，使旧 release 能在迁移后的数据库上短期运行。

如果 migration 破坏数据或无法兼容，只能停止自动发布并按迁移前备份执行人工恢复。

## 安全要求

- 日志不得输出完整 `DATABASE_URL`。
- PostgreSQL 密码不得出现在进程命令参数中。
- 环境文件、环境备份和数据库备份权限均为 `600`。
- 备份目录权限为 `700`。
- 回滚状态先明确记录旧环境存在或不存在；存在时通过临时文件复制、内容比对和原子重命名保存一份权限为 `600` 的旧环境文件，状态目录权限为 `700`。只有环境安装已经开始时才允许恢复旧环境；发布成功或回滚步骤退出时立即删除状态，后续发布还会清理超过 7 天的异常残留目录。
- 守卫失败信息只包含脱敏数据库身份和计数。

## 测试设计

### 数据库守卫测试

使用 Node.js 内置测试框架和临时目录测试：

- 接受 `[::1]:5432/gaoge_db`。
- 拒绝 `127.0.0.1`、`localhost`、错误端口和错误库名。
- 拒绝缺失、重复和格式错误的 `DATABASE_URL`。
- 拒绝实际数据库地址、端口或库名不一致。
- 拒绝任一关键表计数为零。
- 接受所有关键表非空。
- 确认错误输出不包含密码或完整连接串。
- 确认备份清单为空或 `pg_restore` 失败时阻止迁移。
- 确认备份保留策略只保留最近 14 份匹配文件。

测试通过可注入的 CLI 路径或临时 `PATH` 使用伪造 `psql`、`pg_dump` 和 `pg_restore`，不连接真实数据库。

### 工作流测试

更新现有 `scripts/verify-production-runtime-guard.test.mjs`，断言：

- API workflow 不包含 `${{ secrets.DATABASE_URL }}`。
- CI Prisma Generate 使用固定占位 URL。
- 环境文件先写临时文件、校验后原子替换。
- Prisma migration 加载 release `.env`。
- 切换前执行身份探测和备份。
- 切换后验证数据库身份、关键数据、API 数据和 CORS。
- 验收失败存在 release 与环境回滚。
- `pm2 save` 位于最终验收之后。

### PostgreSQL 自愈测试

验证健康检查脚本：

- 只管理 `postgresql@16-main`。
- 显式连接 Ubuntu PostgreSQL socket。
- 验证预期 `data_directory`。
- 连续三次失败后才重启目标服务。
- 日志包含诊断信息但不包含凭据。

## 生产发布与验收

实现合并并通过本地测试后执行一次生产发布：

1. 发布前记录真实库身份、五类业务计数和现有备份。
2. 运行完整 API production workflow。
3. 确认 workflow 的迁移和运行时均使用 `[::1]:5432/gaoge_db`。
4. 确认发布后生产基线不低于发布前记录值。
5. 确认 `Lautaro` 账号保持 `active`、具有 `super_admin` 且可登录。
6. 确认 `pm2-deploy.service` 为 enabled/active，dump 只包含 `gaoge-api`。
7. 确认 `DATABASE_URL` 不再被 workflow 使用。
8. 确认 `DEPLOY_ENV_FILE_API` 和 `EXPECTED_DATABASE_HOST` 的更新时间及配置有效。

本阶段不通过重启整台服务器或 PostgreSQL 制造故障。重启后的行为由显式实例身份守卫、PM2 自启动状态和后续计划内演练验证。

## 文档更新

实现时同步更新：

- `docs/conventions/env-and-config.md`
- `docs/conventions/testing-and-verification.md`
- `docs/ops/production-runtime-guard.md`
- `docs/ops/postgres-monitoring-and-self-healing.md`

规则变化包括生产数据库唯一配置源、目标实例身份、迁移前备份、回滚边界和生产验收命令。当前目录职责和应用列表不变，因此无需修改 `AGENTS.md`。

## 成功标准

- 当前项目的生产部署只存在一份数据库连接配置。
- Prisma migration 与 PM2 运行时从同一份 `api.env` 获取连接。
- 错误主机、端口、库名、空业务库或无效备份均能在切换 release 前阻止发布。
- 发布后错误数据库或空数据接口能触发自动 release/environment 回滚。
- 生产 API 保持连接 Ubuntu PostgreSQL 16 的 `[::1]:5432/gaoge_db`。
- 生产业务计数和 `Lautaro` 登录在正式发布后保持正常。
- 所有新增和既有部署守卫测试通过。
