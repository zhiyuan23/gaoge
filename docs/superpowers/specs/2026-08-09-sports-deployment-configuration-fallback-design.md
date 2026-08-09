# Sports 部署配置兼容修复设计

## 背景

`apps/web` 调整为 `apps/sports` 后，Sports 自动部署工作流改为读取 `SPORTS_DEPLOY_HOST`、`SPORTS_DEPLOY_USER`、`SPORTS_DEPLOY_PATH` 和 `SPORTS_HEALTH_URL`。仓库实际仍只配置了原有 `WEB_*` Secrets，导致校验和构建成功后，上传、版本切换与健康检查全部跳过。工作流最终仍显示成功，使部署状态具有误导性。

## 目标

- 让 `apps/sports` 的现有构建产物继续发布到 Nginx 已使用的原 Web 发布目录。
- 保留未来切换到独立 `SPORTS_*` Secrets 的能力。
- 缺少有效部署配置时明确失败，避免再次出现“流水线成功但线上未更新”。
- 修复完成后重新部署当前 `main`，并验证 `/`、`/hero`、`/assets` 三个线上路径。
- 避免 Vue 页面路径 `/assets` 与 Vite 默认构建目录 `dist/assets/` 冲突。

## 方案

仅修改 `.github/workflows/deploy-sports.yml`：

1. `DEPLOY_HOST` 优先使用 `SPORTS_DEPLOY_HOST`，为空时回退到 `WEB_DEPLOY_HOST`。
2. `DEPLOY_USER` 优先使用 `SPORTS_DEPLOY_USER`，为空时回退到 `WEB_DEPLOY_USER`。
3. `DEPLOY_PATH` 优先使用 `SPORTS_DEPLOY_PATH`，为空时回退到 `WEB_DEPLOY_PATH`。
4. `HEALTH_URL` 优先使用 `SPORTS_HEALTH_URL`，为空时回退到 `WEB_HEALTH_URL`。
5. 部署配置检查使用 shell 参数校验；任一最终值为空时退出失败，不再输出 `ready=false` 并跳过后续步骤。
6. 配置检查通过后，部署步骤直接执行，不再为每一步重复声明条件。

首次部署验证发现，Nginx 的 `try_files $uri $uri/ /index.html` 会将页面路径 `/assets` 识别为 Vite 的真实构建目录 `dist/assets/`，重定向到 `/assets/` 后返回 403。因此 `apps/sports/vite.config.js` 将构建资源目录调整为 `static/`。部署使用 `rsync --delete`，切换到新 release 后不再存在物理 `assets/` 目录，`/assets` 会按预期回落到 SPA 的 `index.html`。该方案无需修改共享 Nginx 配置。

选择兼容回退而不是立即复制 GitHub Secrets，是因为 GitHub 不允许读取现有 Secret 值，而当前 `sports.gaoge.cc` 的 Nginx 配置和域名运维工作流仍明确使用 `WEB_DEPLOY_PATH/current`。复用现有配置与当前生产结构一致，也不会移动或覆盖其他应用目录。

## 验证

- 检查工作流 YAML 可被解析，且最终环境变量都包含 `SPORTS_* || WEB_*` 回退。
- 运行 Sports 测试、类型检查和生产构建。
- 确认生产构建生成 `dist/static/`，且不生成 `dist/assets/`。
- 推送修复后监控 `deploy-sports.yml`，确认上传、版本切换和健康检查步骤实际成功，而非 skipped。
- 请求 `https://sports.gaoge.cc/`、`https://sports.gaoge.cc/hero`、`https://sports.gaoge.cc/assets`，确认均返回成功。
- 对比线上 JavaScript 构建内容或实际路由行为，确认根路径加载球队页、`/hero` 加载原首页、`/assets` 加载资产页。

## 非目标

- 不修改 Sports 页面或 Vue Router 代码。
- 不迁移服务器目录，不调整 Nginx，不重新签发证书。
- 不删除现有 `WEB_*` 或新增不可读取的 Secret 副本。
