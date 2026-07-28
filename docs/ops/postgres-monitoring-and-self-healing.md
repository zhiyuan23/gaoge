# PostgreSQL 监控与自动自愈

本文档用于在生产机上为 PostgreSQL 和 API 添加两层保护：

- 外部探测：检查 `https://api.gaoge.cc/health` 和 `https://api.gaoge.cc/health/db`
- 本机自愈：Ubuntu PostgreSQL 16 连续 3 次身份查询失败时，自动重启 `postgresql@16-main`

发布后和服务器重启后的 PM2、release、数据库 host、CORS 和关键业务接口校验见 [生产运行时守卫](./production-runtime-guard.md)。

当前服务器仍临时保留宝塔 PostgreSQL 供 Compass 使用。Gaoge 唯一数据库为 `[::1]:5432/gaoge_db`，对应服务 `postgresql@16-main` 和数据目录 `/var/lib/postgresql/16/main`；宝塔实例不是本脚本的探测或重启对象。

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
sudo -u postgres psql \
  -h /var/run/postgresql \
  -p 5432 \
  -d postgres \
  -Atqc "select inet_server_addr(), inet_server_port(), current_setting('data_directory');"
```

预期端口为 `5432`，数据目录为 `/var/lib/postgresql/16/main`。Unix socket 查询可能不返回 IP 地址；Gaoge API 的 TCP 身份由生产数据库守卫另行验证为 `::1`。

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
- 当前脚本显式使用 `/var/run/postgresql`、端口 `5432`、`postgres` 数据库和 `/var/lib/postgresql/16/main`，连续失败 3 次后只重启 `postgresql@16-main`。
- 不要把探测改回无 `-h`/`-p` 的默认 `psql`，也不要将服务名放宽为整个 `postgresql`；这会重新引入双实例歧义。
- Compass 完成迁移并停用宝塔 PostgreSQL 属于后续独立工作，不在当前收敛范围。
