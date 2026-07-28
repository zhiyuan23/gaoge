# 生产运行时守卫

本文档记录 `admin.gaoge.cc` 与 `api.gaoge.cc` 的发布后运行时校验，目标是避免服务器重启或发布后恢复到旧进程、旧 release 或错误数据库。

## 守卫脚本

仓库脚本：

```bash
scripts/deployment/verify-remote-runtime.sh
```

脚本只做检查，不自动修改线上服务。失败时应先保存输出，再按 PM2、`current` 软链、数据库 host、反向代理和接口响应逐项排查。

## GitHub Actions 集成

API workflow 在发布后执行：

- 上传 `scripts/deployment/verify-remote-runtime.sh` 到 `${{ secrets.API_DEPLOY_PATH }}/tmp/verify-remote-runtime.sh`
- `pm2 start ecosystem.config.cjs --only gaoge-api --update-env`
- `pm2 save`
- 运行守卫脚本

Admin 与 API production workflow 共用 `gaoge-production-deployment` 并发队列，避免同一次 push 并行打到同一台服务器。API PM2 默认 1 个实例；如确认服务器内存容量足够，可通过生产环境变量 `PM2_INSTANCES` 设置为正整数或 `max`。

Admin workflow 在切换 `current` 前执行 API 合约探针。默认探针：

```text
https://api.gaoge.cc/health
https://api.gaoge.cc/health/db
https://api.gaoge.cc/football/teams?page=1&pageSize=1
```

如果本次 Admin 发布依赖新的只读接口，应在 GitHub Variable `ADMIN_API_CONTRACT_URLS` 中追加对应 URL，避免前端先上线但后端路由尚未发布。

## 必需配置

GitHub Secrets：

- `EXPECTED_DATABASE_HOST`：生产 API 允许使用的数据库 host，例如 `[::1]:5432`。不要填写完整连接串。
- `DATABASE_URL`：Prisma migrate 使用的生产数据库连接串。
- `DEPLOY_ENV_FILE_API`：服务器运行时 `.env` 完整内容，由受控 Secret 保存。

GitHub Variables：

- `ADMIN_API_CONTRACT_URLS`：可选；覆盖 Admin 发布前探测的 API URL 列表。

## 关键检查项

守卫脚本至少检查：

- `EXPECTED_PM2_NAME=gaoge-api` 在线。
- `FORBIDDEN_PM2_NAMES=gaoge-server` 不存在。
- `${API_DEPLOY_PATH}/current` 指向 `${API_DEPLOY_PATH}/releases/api/<git-sha>`。
- `.env` 中 `DATABASE_URL` 不指向含义不明确的 `127.0.0.1:5432` 或 `localhost:5432`。
- `.env` 中数据库 host 与 `EXPECTED_DATABASE_HOST` 一致。
- `/health`、`/health/db`、关键只读业务接口返回成功响应。
- `https://admin.gaoge.cc` 发起的 `/auth/admin/login` CORS 预检通过。

## 手工运行示例

在生产服务器上：

```bash
EXPECTED_PM2_NAME=gaoge-api \
FORBIDDEN_PM2_NAMES=gaoge-server \
EXPECTED_DEPLOY_PATH=/var/www/gaoge/api \
EXPECTED_RELEASE_PATH=/var/www/gaoge/api/releases/api/<git-sha> \
EXPECTED_DB_HOST='[::1]:5432' \
API_BASE_URL=https://api.gaoge.cc \
CRITICAL_PATHS='/health /health/db /football/teams?page=1&pageSize=1' \
CORS_ORIGIN=https://admin.gaoge.cc \
CORS_PATH=/auth/admin/login \
/var/www/gaoge/api/tmp/verify-remote-runtime.sh
```

生产服务器可通过 `@reboot` cron 在重启后自动执行该脚本，并将结果写入受控日志。
