# 高歌线上项目发布版本生命周期治理设计

## 背景

当前阿里云轻量应用服务器采用不可变 release 目录、`current` 软链接和 PM2/Nginx 的发布模式。该模式便于原子切换和回滚，但现有 GitHub Actions 与部署脚本只负责创建新版本，没有统一的历史版本回收机制。

2026-08-12 的线上盘点发现，历史 release 一度占用约 16 GB。人工清理 138 个旧目录后，根分区从高水位回落到约 35%，但如果不改变发布流程，后续每次上线仍会继续累积。一次性执行大量目录删除或 `pnpm store prune` 还会造成明显 I/O 压力，低配服务器甚至可能暂时失去 SSH 与 HTTPS 响应。

本设计把 release 清理从临时运维动作升级为所有线上项目共同遵守的发布生命周期能力，使磁盘占用有明确上限，同时保留可靠回滚能力。

## 目标

- 所有采用 release 目录发布的线上项目使用同一套生命周期规则。
- 每个 release 根目录最多保留 3 个成功版本，磁盘不再随发布次数无限增长。
- 永远保护当前运行版本、上一可回滚版本、PM2 实际工作目录和部署中的版本。
- 磁盘不足时在创建新版本前阻止发布，而不是等服务器被写满后补救。
- 清理与部署互斥，删除限量、低优先级执行，避免再次造成 I/O 峰值。
- 发布后的清理失败不影响已经健康的新版本，由定时巡检补偿。
- 主仓库维护唯一实现，其他仓库调用同一服务器工具，避免规则复制和漂移。

## 非目标

- 不替换现有 GitHub Actions、Nginx、PM2 或 PostgreSQL 技术栈。
- 不在本期迁移 Compass、Club 当前使用的 root 部署账号。
- 不把数据库备份混入应用 release 的保留规则；数据库备份继续采用独立的 14 天策略。
- 不自动执行 `pnpm store prune`、全量 Docker prune 或其他高 I/O、难以精确界定影响范围的操作。
- 不要求独立发布的 Admin、API、Brand、Web 使用同一个 Git SHA。
- 不在第一阶段强依赖新的外部监控平台或付费服务。

## 线上现状与治理范围

盘点时共有 10 个已上线 release 根目录，未来 Finance 上线后增加为 11 个：

| 项目               | 组件       | Release 根目录                          | 发布用户     | 盘点版本数 |
| ------------------ | ---------- | --------------------------------------- | ------------ | ---------: |
| Gaoge              | Admin      | `/var/www/gaoge/admin/releases`         | `deploy`     |          3 |
| Gaoge              | API        | `/var/www/gaoge/api/releases/api`       | `deploy`     |          2 |
| Gaoge              | Brand      | `/var/www/gaoge/brand/releases`         | `deploy`     |          9 |
| Gaoge              | Sports/Web | `/var/www/gaoge/web/releases`           | `deploy`     |         33 |
| Gaoge Compass      | Admin      | `/var/www/gaoge-compass/admin/releases` | `root`       |          2 |
| Gaoge Compass      | API        | `/var/www/gaoge-compass/api/releases`   | `root`       |          3 |
| Gaoge Club         | Admin      | `/var/www/gaoge-club/admin/releases`    | `root`       |          2 |
| Gaoge Club         | API        | `/var/www/gaoge-club/api/releases/api`  | `root`       |          2 |
| Gaoge CRM          | Admin      | `/var/www/gaoge-crm/admin/releases`     | `deploy`     |          3 |
| Gaoge CRM          | API        | `/var/www/gaoge-crm/api/releases`       | `deploy`     |          3 |
| Gaoge Finance News | 统一发布包 | `/var/www/gaoge-finance-news/releases`  | 待部署时确定 |          0 |

盘点总数为 62 个目录，目标稳定上限为 30 个现有项目版本；Finance 上线后的完整上限为 33 个。Brand 与 Sports/Web 的旧静态版本数量最多，但体积较小，因此首次治理无需冒险集中删除。

固定目录 `/var/www/h5` 与 Docker 运行的 Uptime Kuma 不采用该 release 模型，不由本管理器删除。它们只进入磁盘巡检和独立日志、Docker 缓存治理范围。

## 方案选择

### 方案 A：每个工作流自行清理

每条 GitHub Actions 工作流在健康检查后直接实现保留和删除逻辑。它能感知当前部署结果，但 5 个仓库、11 个发布入口会复制大量危险的路径与删除代码，长期容易出现规则漂移。

### 方案 B：只使用服务器夜间定时清理

由单个定时任务遍历所有目录。维护点少，但定时任务不了解发布是否成功、哪个版本正在回滚，也容易与正在执行的部署竞争。

### 方案 C：统一管理器、部署后调用、定时补偿

主 `gaoge` 仓库维护唯一的服务器端 release 管理器。各项目在发布前调用磁盘预检，在部署健康后登记成功版本并触发限量回收；systemd 定时任务使用同一工具和锁进行补偿巡检。

采用方案 C。它兼顾发布上下文、统一安全边界和长期维护成本。

## 所有权与部署结构

主 `gaoge` 仓库是该基础设施能力的权威源码位置，建议包含：

```text
ops/release-manager/
├── gaoge-release-manager
├── release-roots.conf.example
├── gaoge-release-audit.service
├── gaoge-release-audit.timer
├── install.sh
└── tests/
```

服务器安装位置：

```text
/usr/local/sbin/gaoge-release-manager
/etc/gaoge/release-roots.conf
/etc/systemd/system/gaoge-release-audit.service
/etc/systemd/system/gaoge-release-audit.timer
/run/lock/gaoge-release-manager/
/var/lib/gaoge-release-manager/
```

工具和配置由 root 安装并拥有，普通 `deploy` 用户可执行工具，但只能操作配置白名单中且自身有权限的目录，不新增通用 sudo 权限。Compass 与 Club 暂时沿用现有 root 发布方式。

其他仓库不复制实现，只在工作流或部署脚本中调用稳定的命令接口。工具提供语义化版本号和 `--version`，部署入口检查服务器安装版本是否满足最低要求。

## Release 状态模型

每个 release 目录可处于以下状态：

- `in-progress`：目录已创建，但尚未完成外部健康检查。
- `successful`：外部健康检查通过，存在 `.release-success` 标记。
- `failed`：发布失败或回滚，存在 `.release-failed` 标记。
- `legacy`：治理接管前创建，没有状态标记。

成功标记至少记录 release ID、项目、组件、Git SHA、完成时间和工作流运行标识。失败标记记录失败时间和可公开的阶段名称，不写入密钥、数据库连接串等敏感信息。

新 release 只有通过真实域名或明确配置的外部 HTTPS 健康检查后才能标记成功。仅 PM2 显示 online 不足以成为成功依据。

## 保留规则

每个 release 根目录最多保留 3 个成功版本：

1. `current` 指向的当前运行版本。
2. `previous` 指向的直接上一成功版本。
3. 除前两者外时间最近的一个成功版本，作为额外应急回滚点。

以下目录不受数量上限删除：

- `current` 或 `previous` 的解析目标。
- 任一 PM2 进程实际 `cwd` 指向的目录。
- 创建时间不足 24 小时的目录。
- 当前工作流登记为部署中的目录。
- 工具无法确认路径安全、状态或引用关系的目录。

失败和未完成版本保留 24 小时用于排障，之后可回收。数据库备份继续保留 14 天，不计入应用版本数量。

Admin、API、Brand、Sports/Web 按各自 release 根目录独立保留。它们的工作流有路径过滤且可能分别发布，因此不能通过跨组件 Git SHA 一致性决定是否删除。Finance 使用统一发布包，但仍遵守同一个 3 版本上限。

## `current` 与 `previous` 语义

所有项目统一采用持久化的两个软链接：

- `current`：当前对外提供服务的成功版本。
- `previous`：切换前的上一成功版本，可用于人工或自动回滚。

标准切换过程：

1. 验证新目录完整，准备 `current-next` 和 `previous-next` 临时链接。
2. 将旧 `current` 原子更新为 `previous`。
3. 将新 release 原子更新为 `current`。
4. 重启或 reload 对应进程。
5. 执行内部与外部健康检查。
6. 成功则写入 `.release-success`；失败则恢复 `current` 到 `previous`，重启并再次验证。

回滚失败必须停止清理并返回明确错误。成功部署后的回收失败只记录告警，不回滚已经健康的新版本。

## 命令接口

统一管理器至少提供以下稳定接口：

```text
gaoge-release-manager preflight --target <id>
gaoge-release-manager register-start --target <id> --release <id>
gaoge-release-manager mark-success --target <id> --release <id> [metadata]
gaoge-release-manager mark-failed --target <id> --release <id> --stage <name>
gaoge-release-manager plan --target <id|all>
gaoge-release-manager prune --target <id|all> --max-delete <n>
gaoge-release-manager audit --target <id|all>
gaoge-release-manager rollback --target <id>
gaoge-release-manager --version
```

`plan` 只输出保留集合、候选删除集合、原因和预计释放空间，不写磁盘。`prune` 必须复用 `plan` 的验证逻辑，并在每次实际删除前重新读取所有保护引用。

机器可读输出采用 JSON Lines 或稳定 JSON，便于 GitHub Actions、systemd 和后续监控接入；终端同时提供简洁的人类可读摘要。

## 配置模型与路径安全

`/etc/gaoge/release-roots.conf` 明确登记每个目标：

- 稳定 target ID。
- release 根目录的绝对路径。
- `current` 与可选 `previous` 链接路径。
- 运行时类型和 PM2 应用名，或静态站点标识。
- 发布用户和目录属主。
- 健康检查 URL。
- 成功版本上限，默认 3。
- 失败版本保留时长，默认 24 小时。

管理器必须拒绝：

- 未出现在白名单中的 target 或路径。
- `/`、`/var`、`/var/www` 等过宽目录。
- release 根目录本身是软链接。
- `current`、`previous` 或候选目录解析后逃逸 release 根目录。
- 空变量、`.`、`..`、通配符或不符合 release ID 规则的目录名。
- 目标目录与已登记根目录 inode 不一致的竞态情况。

删除只能针对已解析并逐个确认的具体目录，不拼接未校验的 `rm -rf` 通配符。

## 并发与锁

采用两级 `flock`：

- 全局审计锁避免两次全机巡检重叠。
- 每个 target 独立锁避免该组件的部署、回滚和清理并发。

不同 target 可在确认不会制造明显磁盘压力时独立发布，但所有实际删除还要经过全机删除配额。GitHub Actions 继续保留各仓库现有 concurrency group，服务器锁作为跨仓库和定时任务的最终防线。

锁等待有明确超时。部署前预检拿不到锁时应失败退出；部署后的补偿清理拿不到锁时记录告警并交给下一次定时巡检。

## 磁盘与 inode 门禁

发布前必须同时检查根分区空间和 inode：

- 使用率低于 70%：正常发布。
- 使用率 70% 至 79%：记录告警，先运行安全回收计划；回收后满足硬门限才能继续。
- 使用率达到 80%：阻止创建新 release。
- 可用空间不足 5 GiB：无论百分比多少都阻止创建新 release。
- inode 使用率达到 80%：阻止创建新 release。

所有数值作为有默认值的配置项，便于服务器扩容后调整。硬门限必须在上传和依赖安装前执行，避免先写入大文件再发现磁盘不足。

## 删除限速与资源保护

- 每次部署后的 `prune` 对单个 target 最多删除 1 个目录。
- 夜间全机巡检每次最多删除 3 个目录。
- 删除使用 `nice -n 19` 与 `ionice -c3` 的空闲优先级。
- 每删除一个目录后重新检查磁盘、负载、锁和保护引用。
- 若系统负载、I/O 等待或关键健康检查异常，立即停止本轮后续删除。
- 工具不在一次命令中批量删除未逐个验证的路径。

第一次接管当前 62 个目录时先运行纯预览，再按每晚最多 3 个逐步收敛到 30 个。现有超额目录主要是小体积静态版本，没有立即集中删除的必要。

## GitHub Actions 接入

需要修改 11 个发布入口：

- `gaoge`：API、Admin、Brand、Sports/Web。
- `gaoge-compass`：API、Admin。
- `gaoge-club`：API、Admin。
- `gaoge-crm`：API、Admin。
- `gaoge-finance-news`：统一发布脚本。

标准流程为：

```text
版本管理器版本检查
→ preflight
→ register-start
→ 上传并构建 release
→ 数据库迁移（如适用）
→ previous/current 原子切换
→ PM2 重启或静态站点切换
→ 内部健康检查
→ 外部 HTTPS 健康检查
→ mark-success
→ prune --max-delete 1
```

失败路径执行 `mark-failed`，并复用各项目已有回滚逻辑。若失败发生在切换之后，必须先完成回滚和回滚后的健康检查，再允许工作流结束。

`preflight`、路径验证、切换和健康检查属于发布成败的一部分。`mark-success` 后的清理属于维护阶段：失败时让工作流明显告警，但不能把已健康版本切回旧版。具体工作流应避免使用一个覆盖全流程的 failure trap，防止清理失败误触发应用回滚。

## 定时巡检与告警

systemd timer 每晚执行一次：

1. 审计 11 个配置目标及软链接完整性。
2. 检查磁盘、inode、版本数、失败目录和遗留临时目录。
3. 在安全条件满足时全机最多回收 3 个目录。
4. 写入结构化结果和最近成功状态。

每周生成一次版本数量、目录体积、磁盘趋势和异常 target 摘要。第一阶段使用 systemd 状态、journal 和本地状态文件；连续失败或磁盘超过 70% 时保留非零健康状态。后续可把该状态接入 Uptime Kuma Push Monitor，但上线不依赖该集成。

## 日志与非 Release 空间治理

历史 release 受控后，还需避免其他增长源取代它：

- PM2 启用日志轮转，限制单文件大小、保留文件数和压缩策略。
- systemd journal 建议设置 `SystemMaxUse=200M`，并保留合理的最短时间窗口。
- 保持发行版现有 logrotate timer 正常运行。
- Docker 只允许清理未使用的悬空层；不自动删除运行镜像、具名卷或 Uptime Kuma 数据。
- `pnpm store prune` 不进入部署或定时任务。若未来确需执行，只允许维护窗口手动运行，并使用全局锁、低 I/O 优先级和前后健康检查。

## 首次接管与迁移

现有目录没有统一状态标记，首次接管采用保守迁移：

1. 读取并验证所有 `current` 目标和 PM2 实际工作目录。
2. 为当前运行版本补写 bootstrap 成功状态。
3. 若不存在 `previous`，从剩余 legacy 目录中按时间选择最近候选，并先进行组件级完整性检查后建立链接。
4. 每个 target 暂保留当前版本与最近两个 legacy/成功版本。
5. 输出全机 dry-run 报告，由实施者逐项核对路径、属主、体积和保护原因。
6. 启用定时任务，以每晚最多 3 个目录逐步收敛。

任何无法验证的 legacy 目录保持不动并报告，不为了达到数量目标绕过安全检查。

## 实施顺序

1. 在 `gaoge` 仓库实现管理器、配置模板、systemd 单元和测试。
2. 在临时目录模拟软链接逃逸、空路径、并发、回滚、失败标记和保留策略。
3. 安装到服务器但不启用删除，只运行 `audit` 与 `plan`。
4. 核对全机预览输出，完成 legacy bootstrap。
5. 先接入 `gaoge` 四个工作流并逐个发布验证。
6. 依次接入 Compass、Club、CRM。
7. Finance 上线时直接使用完整标准流程。
8. 启用夜间 systemd timer 和日志容量限制。
9. 更新各仓库部署说明以及知识库中的 GitHub Actions 发布规范和源码映射。

## 测试与验证

### 管理器自动化测试

- 仅保留最新 3 个成功版本。
- `current`、`previous`、PM2 `cwd` 永不进入删除集合。
- 24 小时内版本和正在部署版本受到保护。
- 失败版本在 24 小时内保留，超过窗口后可回收。
- 路径逃逸、根目录、空值、通配符、恶意 release ID 被拒绝。
- dry-run 不产生文件系统写入。
- 两个进程竞争同一 target 时只有一个能进入临界区。
- 全机和单 target 删除数量上限生效。
- 磁盘、可用空间和 inode 硬门限均能阻止预检。
- 清理失败不会触发已成功发布版本的回滚。

### 工作流验证

- 校验所有 YAML 和 shell 脚本语法。
- 核对每条工作流先 preflight、后上传，且仅在外部健康检查后 mark-success。
- 核对 failure trap 不会把维护阶段失败误判为应用发布失败。
- 核对每个仓库现有 concurrency group 与服务器锁共同生效。

### 线上验证

- 验证 Nginx 配置、PM2 进程和全部现有 HTTPS 域名。
- 验证每个 target 的 `current`、`previous` 均解析到白名单根目录内。
- 在非生产临时树完成一次成功发布、一次失败回滚和一次并发锁演练。
- 记录启用前后的 `df -h`、`df -i`、版本数量和目录体积。
- 观察至少一次部署后回收和一次夜间巡检。

## 验收标准

- 连续发布 10 次后，每个 release 根目录仍不超过 3 个成功版本。
- 当前运行版本、上一回滚版本和 PM2 实际工作目录不会被删除。
- 并发部署、回滚与夜间巡检不会同时修改同一 target。
- 达到磁盘硬门限时不会创建新 release。
- 清理失败不影响已经通过健康检查的线上版本。
- 所有现有域名、PM2 服务、Nginx 路由和数据库迁移流程保持正常。
- 线上版本目录从当前 62 个逐步收敛到最多 30 个；Finance 上线后全机稳定上限为 33 个。
- 工具、配置、运行手册与知识库对同一规则描述一致。

## 风险与回退

- **误删风险**：通过白名单、路径解析、引用保护、dry-run、逐个删除和测试降低；任何不确定状态默认不删除。
- **部署误回滚风险**：把应用发布阶段与成功后的维护阶段明确分开。
- **跨仓库依赖风险**：工具提供版本接口，各工作流声明最低版本；升级先向后兼容再更新调用方。
- **首次接管风险**：legacy 目录分批收敛，不集中删除。
- **服务器资源风险**：删除限量并使用空闲 I/O 优先级；禁止自动运行 `pnpm store prune`。

若管理器上线后出现异常，可禁用 systemd timer 并让工作流暂时跳过发布后 `prune`；`current`、`previous` 和原有发布流程仍可继续工作。预检只有在确认工具自身故障时才临时绕过，并必须由人工先核对磁盘空间。

## 已确认决策

- 采用统一管理器、部署后调用、定时补偿的混合架构。
- 主 `gaoge` 仓库维护唯一权威实现。
- 每个 release 根目录保留 3 个成功版本。
- 失败和未完成版本保留 24 小时。
- 磁盘 70% 告警，80% 或可用空间不足 5 GiB 时阻止发布。
- 部署后单 target 最多删除 1 个，夜间全机最多删除 3 个。
- 首次接管先 dry-run，再分批收敛。
- `pnpm store prune` 不自动化。
- 实施覆盖 5 个仓库、10 个现有发布组件和 Finance 的未来统一发布入口。
