# AI 协作规范

本文件用于约束 AI 在当前仓库中的协作方式。

当前仓库已经进入 monorepo 基座加首批真实应用迁移阶段，重点是持续把旧单仓库能力迁入，并收敛到统一目录、依赖和工程规范。

## 当前阶段

- 当前仓库已具备 monorepo 基础结构与工具链
- `apps/api` 与 `apps/admin` 已完成首轮迁入，并保持球员信息 CRUD 可运行
- `apps/web` 已完成从平级 `gaoge-web` 的首轮迁入，当前为真实 Vite/Vue 前台项目
- `apps/miniapp` 仍处于后续迁入阶段
- `packages/*` 目前仍以第一阶段共享层骨架为主
- 根目录工作流已按应用拆分为独立部署入口，`api`、`web`、`admin` 应分别维护自己的发布流程

后续继续引入 `miniapp` 等真实项目，或显著调整 `web/admin/api` 的目录职责时，必须同步更新本文件，确保 AI 协作规则与真实代码结构一致。

## 核心原则

1. 先理解，再修改
   在动代码前先确认当前目录职责、依赖关系和已有模式，不要凭空补全架构细节。

2. 优先简单方案
   不为了“更灵活”“更通用”而提前抽象，不增加未被明确需要的扩展点。

3. 只做必要改动
   变更范围应直接服务当前需求，不顺手重构无关代码，不清理与本任务无关的旧问题。

4. 结果可验证
   完成修改后，优先运行仓库已有校验命令，而不是只凭主观判断说明“应该可以”。

## 目录职责

### `apps/`

放可独立运行、构建、部署的应用。

当前应用包括：

- `apps/admin`
- `apps/web`
- `apps/miniapp`
- `apps/api`

规则：

- 应用之间不能互相直接依赖
- 应用只能依赖 `packages/*`
- 应用内部私有实现不要反向沉淀到共享包，除非已形成稳定复用能力

### `packages/`

放共享能力，不放半个应用。

当前规划中的共享层包括：

- `packages/shared/*`
- `packages/sdk/*`
- `packages/ui/*`
- `packages/server/*`
- `packages/configs/*`

规则：

- `packages/*` 不能依赖 `apps/*`
- `shared/*` 保持运行时无关
- UI 按框架拆分，不强行做跨框架组件复用

### `docs/`

放架构说明、规范和协作约定。

当仓库结构、流程或命名规则发生明显变化时，应同步更新文档，而不是仅修改代码。

## 依赖方向

遵循单向依赖：

```text
apps -> sdk/ui/server/shared/configs
sdk/ui/server -> shared/configs
shared -> configs
```

禁止行为：

- `packages/*` 依赖 `apps/*`
- `apps/*` 横向依赖别的应用
- 在 `shared/*` 中写 Vue / React / Nest / uni-app 运行时耦合代码

## 命名约定

- 应用目录名表达产品角色，不表达技术名
- 共享包统一使用 `@gaoge/*`
- 应用内部使用 `@/`
- 跨包引用统一使用工作区包名，不直接引用其他包内部路径

## 代码风格

当前仓库默认规则：

- `Prettier` 负责格式化
- `ESLint` 负责代码质量和可自动修复规则
- `Stylelint` 负责样式规范
- 风格参考 `gaoge-admin`
  - 无分号
  - 单引号
  - 最多一个空行
  - `import` 排序
  - 稳定的 Vue 区块顺序

AI 修改代码时应遵循现有配置，不要手写另一套格式风格。

## 常用命令

- `pnpm dev:admin`
- `pnpm dev:web`
- `pnpm dev:miniapp`
- `pnpm dev:api`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm lint:style`
- `pnpm lint:style:fix`
- `pnpm typecheck`

## 提交约定

- 提交前应确保当前修改能通过必要校验
- 优先使用 `pnpm cz` 走交互式提交
- 提交信息遵循 conventional commits

## AI 修改限制

1. 不要删除用户未要求删除的文件
2. 不要改动无关目录来“顺手统一”
3. 不要把临时假设写死成长期架构
4. 不要在未引入真实业务项目之前，伪造完整业务结构
5. 迁移旧仓库代码时，优先服从当前 monorepo 规范，而不是机械保留旧仓库配置

## 文档更新规则

以下情况发生时，必须同步更新 `AGENTS.md`：

- 新增真实应用接入，例如正式迁入 `admin`、`server`、`miniapp`、`web`
- 共享层目录职责变化
- 命名规则变化
- 提交、校验、格式化流程变化
- AI 协作流程变化
