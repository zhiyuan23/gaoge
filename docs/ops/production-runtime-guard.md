# 生产运行时守卫

本文档记录 `admin.gaoge.cc` 与 `api.gaoge.cc` 的发布后运行时校验，目标是避免服务器重启或发布后恢复到旧进程、旧 release 或错误数据库。

## 守卫脚本

仓库脚本：

```bash
scripts/deployment/verify-remote-runtime.sh
scripts/deployment/production-database-guard.mjs
```

数据库守卫负责解析唯一的 `DATABASE_URL`、验证实际 PostgreSQL 身份和关键表计数，并在迁移前创建可恢复备份。运行时守卫检查 PM2、`current` 软链、数据库身份、业务接口和 CORS。守卫本身不修改数据库内容。

## GitHub Actions 集成

API workflow 在发布后执行：

- 上传两份守卫脚本到 `${{ secrets.API_DEPLOY_PATH }}/tmp/`
- 保存旧 `current` 与旧 `shared/api.env`
- 校验临时环境文件后原子替换 `shared/api.env`
- 使用同一环境文件探测数据库、生成已验证备份并执行 Prisma migration
- 使用 `github.run_id` 与 `github.run_attempt` 隔离每次回滚状态，并通过同目录临时软链和 `mv -Tf` 原子切换 `current`
- `pm2 start ecosystem.config.cjs --only gaoge-api --update-env`
- 运行守卫脚本
- 全部验收通过后执行 `pm2 save`

Admin 与 API production workflow 共用 `gaoge-production-deployment` 并发队列，避免同一次 push 并行打到同一台服务器。API PM2 默认 1 个实例；如确认服务器内存容量足够，可通过生产环境变量 `PM2_INSTANCES` 设置为正整数或 `max`。

探测、备份、migration 或发布后验收失败时，workflow 自动恢复旧 release 和旧环境文件。数据库 migration 不自动逆向回滚，数据库备份也不自动恢复。

生产 dotenv 只按 dotenv 语义解析，绝不能由 Shell 执行。包含 `$`、空格、引号或命令替换样式文本的值必须保持字面含义。

Admin workflow 在切换 `current` 前执行 API 合约探针。默认探针：

```text
https://api.gaoge.cc/health
https://api.gaoge.cc/health/db
https://api.gaoge.cc/football/teams?page=1&pageSize=1
```

如果本次 Admin 发布依赖新的只读接口，应在 GitHub Variable `ADMIN_API_CONTRACT_URLS` 中追加对应 URL，避免前端先上线但后端路由尚未发布。

## 必需配置

GitHub Secrets：

- `EXPECTED_DATABASE_HOST`：固定为 `::1`，只用于数据库身份断言。
- `DEPLOY_ENV_FILE_API`：唯一生产配置源，包含服务器运行时 `.env` 的完整内容。

workflow 不使用独立的 `DATABASE_URL` Secret。`DATABASE_URL` 只存在于 `DEPLOY_ENV_FILE_API` 生成的 `/var/www/gaoge/api/shared/api.env` 中。

GitHub Variables：

- `ADMIN_API_CONTRACT_URLS`：可选；覆盖 Admin 发布前探测的 API URL 列表。

## 关键检查项

守卫脚本至少检查：

- `EXPECTED_PM2_NAME=gaoge-api` 在线。
- `FORBIDDEN_PM2_NAMES=gaoge-server` 不存在。
- `${API_DEPLOY_PATH}/current` 指向 `${API_DEPLOY_PATH}/releases/api/<git-sha>`。
- 配置目标与 PostgreSQL 实际身份均为 `::1:5432/gaoge_db`。
- User、Player、Team、MatchRound、FootballAssetRecord 均非空。
- `/health`、`/health/db` 返回成功响应。
- 球员、球队、比赛和资产接口返回 `code=0` 且 `data.total > 0`。
- `https://admin.gaoge.cc` 发起的 `/auth/admin/login` CORS 预检通过。

## 手工运行示例

在生产服务器上：

```bash
EXPECTED_PM2_NAME=gaoge-api \
FORBIDDEN_PM2_NAMES=gaoge-server \
EXPECTED_DEPLOY_PATH=/var/www/gaoge/api \
EXPECTED_RELEASE_PATH=/var/www/gaoge/api/releases/api/<git-sha> \
EXPECTED_DB_HOST='::1' \
EXPECTED_DB_PORT='5432' \
EXPECTED_DB_NAME='gaoge_db' \
DATABASE_GUARD_PATH=/var/www/gaoge/api/tmp/production-database-guard.mjs \
API_BASE_URL=https://api.gaoge.cc \
CRITICAL_PATHS='/health /health/db' \
NON_EMPTY_PATHS='/football/players?page=1&pageSize=1 /football/teams?page=1&pageSize=1 /football/match-rounds?page=1&pageSize=1 /football/asset-records?page=1&pageSize=1' \
CORS_ORIGIN=https://admin.gaoge.cc \
CORS_PATH=/auth/admin/login \
/var/www/gaoge/api/tmp/verify-remote-runtime.sh
```

迁移前备份位于 `/var/www/gaoge/api/backups/gaoge-db-pre-migration-*.dump`，权限为 `600`，部署流程保留最新 14 份。可使用 `pg_restore --list <dump>` 手工验证清单。

生产服务器可通过 `@reboot` cron 在重启后自动执行运行时守卫，并将结果写入受控日志。
