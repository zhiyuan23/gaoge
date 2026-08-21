# 高歌生产服务器资源耗尽防复发设计

## 背景

2026-08-21 生产服务器发生全域名、HTTPS 与 SSH 同时不可用。只读取证确认：

- `apt-daily-upgrade.service` 于 06:59 启动后未正常结束。
- 07:17 系统盘读取约 108 MiB/s，磁盘利用率 96%，平均等待约 128 ms，50 个进程阻塞；控制台接近 100% 的 CPU 主要是 I/O 等待。
- 服务器为 2 vCPU、2 GiB，系统实际可用内存约 1.6 GiB；稳定运行多个 Node、PostgreSQL、Nginx、Docker 与运维代理后余量有限。
- 服务器已有 1 GiB Swap，但 `vm.swappiness=0`，故障期间和此前 OOM 时均未使用。
- 2026-08-19 内核两次触发 OOM，分别终止 `fwupd` 和一个 Node 进程。现有证据不足以认定单个 Node 应用存在内存泄漏。

## 目标

1. 让 Swap 在内存告急时承担有限的缓冲作用，避免直接 OOM。
2. 避免自动升级和云主机无价值的固件刷新在无人值守时抢占生产机资源。
3. 保留可逆操作、当前服务结构和人工安全更新能力。
4. 把可复用的诊断证据、恢复顺序和新基线写入现有故障排查知识页。

## 方案比较

### 方案 A：最小运维基线调整（采用）

- 持久化设置 `vm.swappiness=10`。
- 禁用但不 mask `apt-daily.timer`、`apt-daily-upgrade.timer`、`fwupd-refresh.timer`。
- 系统安全更新改为有观察窗口的人工维护。

优点是直接消除两条已确认的触发链，且所有变更均可恢复。代价是必须建立人工更新责任，Swap 只提供缓冲，不能替代扩容。

### 方案 B：保留自动升级并限制资源

为自动升级增加 systemd I/O 权重、内存和运行时间限制。它保留自动补丁，但超时中止可能打断 `dpkg`，且不能保证当前小规格机器在升级 Nginx/PostgreSQL 时保持稳定，本次不采用。

### 方案 C：仅扩容

升级到至少 4 GiB 可显著增加余量，但不能消除无人值守升级生产基础设施的重启和兼容风险。作为后续容量治理，不替代本次最小修复。

## 实施范围

### 服务器变更

1. 记录当前 `swappiness`、Swap、timer 启用状态并备份持久化 sysctl 文件。
2. 将唯一生效的 `vm.swappiness` 配置改为 `10`，立即加载并验证。
3. 执行 `systemctl disable --now`：
   - `apt-daily.timer`
   - `apt-daily-upgrade.timer`
   - `fwupd-refresh.timer`
4. 不删除软件包，不修改 PostgreSQL、Nginx、PM2、Docker 或应用配置，不调整防火墙。

### 知识库变更

仅更新：

`20-Projects/高歌数字/apps/gaoge/operations/高歌数字主工程-故障排查.md`

新增“整机高负载、OOM 与全域名不可用”小节，记录指标判读、OOM 证据、恢复顺序、新运维基线和人工更新责任。`11-Guides/高歌数字/高歌数字导览.md` 分类为 `guide-no-op`：它已经把读者引导到项目运维与跨仓库故障入口，不需要为单次事故改变导航。

## 验证

- `sysctl vm.swappiness` 返回 `10`，持久化配置不存在冲突值。
- 三个 timer 均为 disabled，且不再出现在下一次触发列表中。
- `dpkg --audit` 与 `apt-get check` 无错误。
- PostgreSQL TCP 就绪；Nginx、Docker、root/deploy 两套 PM2 正常。
- `vmstat` 无持续阻塞或高 I/O wait；当前启动无新 OOM。
- 主站、后台、体育、CRM、Compass、Club、Finance 与 API/数据库健康接口通过公网验证。
- 知识库修改保持最小 diff，并通过知识库 validator、检索就绪检查、audit 与 `git diff --check`。

## 回滚

- 从备份恢复 sysctl 文件并重新加载，或将 `vm.swappiness` 改回原值 `0`。
- 对三个 timer 执行 `systemctl enable --now` 即可恢复自动任务。
- 知识库只修改一个既有页面，可通过单文件反向补丁恢复。

## 本次不做

- 不升级实例规格，不迁移应用，不新增监控系统。
- 不为 Node 进程设置未经证据支持的内存上限。
- 不自动执行下一轮系统升级；后续升级必须在人工维护窗口单独确认。
