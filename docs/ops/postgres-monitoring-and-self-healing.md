# PostgreSQL 监控与自动自愈

本文档用于在生产机上为 PostgreSQL 和 API 添加两层保护：

- 外部探测：检查 `https://api.gaoge.cc/health` 和 `https://api.gaoge.cc/health/db`
- 本机自愈：数据库连续 3 次查询失败时，自动重启 `postgresql@16-main`

## 1. 安装 Uptime Kuma

要求：服务器已安装 Docker 和 Docker Compose Plugin。

```bash
mkdir -p /opt/gaoge/uptime-kuma
cp infra/deploy/uptime-kuma/compose.yml /opt/gaoge/uptime-kuma/compose.yml
cd /opt/gaoge/uptime-kuma
docker compose up -d
```

打开：

```text
http://<server-ip>:3001
```

首次进入后添加两个 HTTP(s) 监控：

- `https://api.gaoge.cc/health`
- `https://api.gaoge.cc/health/db`

建议配置：

- 检查间隔：`60s`
- 重试次数：`3`
- 超时：`10s`

通知渠道可后续补配。

## 2. 打开 PostgreSQL 进程自动拉起

```bash
mkdir -p /etc/systemd/system/postgresql@16-main.service.d
cp infra/deploy/postgres/postgresql@16-main.override.conf /etc/systemd/system/postgresql@16-main.service.d/override.conf
systemctl daemon-reload
systemctl restart postgresql@16-main
systemctl status postgresql@16-main
```

## 3. 安装 PostgreSQL 本机健康检查

```bash
cp infra/deploy/postgres/check-postgres.sh /usr/local/bin/check-postgres.sh
chmod +x /usr/local/bin/check-postgres.sh

cp infra/deploy/postgres/postgres-healthcheck.service /etc/systemd/system/postgres-healthcheck.service
cp infra/deploy/postgres/postgres-healthcheck.timer /etc/systemd/system/postgres-healthcheck.timer

systemctl daemon-reload
systemctl enable --now postgres-healthcheck.timer
systemctl list-timers | grep postgres-healthcheck
```

## 4. 手工验证

验证脚本本身：

```bash
/usr/local/bin/check-postgres.sh
echo $?
```

验证定时器：

```bash
systemctl status postgres-healthcheck.timer
systemctl status postgres-healthcheck.service
```

验证数据库：

```bash
sudo -u postgres psql -c "select now();"
```

验证接口：

```bash
curl -i https://api.gaoge.cc/health
curl -i https://api.gaoge.cc/health/db
```

## 5. 故障时看哪里

健康检查脚本日志：

```bash
tail -n 200 /var/log/postgres-healthcheck.log
```

PostgreSQL 日志：

```bash
journalctl -u postgresql@16-main -n 200 --no-pager
tail -n 200 /var/log/postgresql/postgresql-16-main.log
```

## 6. 注意事项

- `Restart=on-failure` 只覆盖“进程退出”的情况，不能覆盖“进程活着但查询失败”的情况，所以必须同时保留本机健康检查。
- `Uptime Kuma` 最好部署在另一台机器上；如果暂时没有第二台机器，先部署在当前机也比没有强。
- 当前脚本使用 `postgresql@16-main` 和 `postgres` 数据库名，后续如果实例名变更，需要同步修改脚本。
