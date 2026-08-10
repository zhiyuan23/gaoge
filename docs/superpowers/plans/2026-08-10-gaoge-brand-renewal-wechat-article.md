# 高歌品牌焕新公众号图文执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成高歌品牌焕新公众号文章的文案、封面与正文视觉物料，并在用户已登录的 Chrome 微信公众平台中装配为可审核草稿。

**Architecture:** 采用“本地内容包 → 本地视觉物料 → Chrome 公众号编辑器装配 → 手机预览 → 用户确认后发布”的顺序。文案与图像先在工作区外部依赖最少的目录中定稿，浏览器只负责平台规格校验、上传、排版、预览与保存草稿；发布是独立授权门，不与草稿装配合并。

**Tech Stack:** Markdown、现有 Brand 品牌资产、AI 图像生成、确定性文字排版导出、Chrome 浏览器控制、微信公众平台图文编辑器

## Global Constraints

- 以 `docs/superpowers/specs/2026-08-10-gaoge-brand-renewal-wechat-article-design.md` 为唯一设计依据。
- 长期品牌主张必须是“连接热爱，奔赴所爱。”
- 启幕信息必须是“高歌，全新启幕。”并保持次级层级。
- 行动宣言必须是“将热爱，坚决贯彻到底。”
- 全文不发布“高歌集团正式成立”，不从高歌 FC 发展为集团的方向叙述。
- 高歌得名于高歌路；高歌路和高歌 FC 章节只使用真实照片。
- 高歌数字、高歌内容、高歌影视与高歌体育只作为四种品牌表达出现，不展开服务清单。
- 浏览器阶段可以创建并保存草稿；不得在没有用户最终明确确认的情况下点击“群发”“发布”或对外发送预览。
- 不读取或导出 Chrome Cookie、密码、本地存储、公众号密钥或其他认证数据。

---

## 文件结构

执行阶段创建以下发布包：

```text
docs/brand-campaigns/2026-gaoge-renewal/
├── article.md
├── asset-inventory.md
├── publish-checklist.md
├── sources/
│   ├── gaoge-road-original.jpg
│   └── gaoge-fc-original.jpg
└── exports/
    ├── 01-cover-landscape.png
    ├── 02-cover-share-safe.png
    ├── 03-gaoge-road.png
    ├── 04-manifesto.png
    ├── 05-brand-values.png
    ├── 06-four-expressions.png
    ├── 07-gaoge-fc.png
    ├── 08-ending.png
    └── contact-sheet.png
```

- `article.md`：公众号最终标题、摘要、正文与图片插入点。
- `asset-inventory.md`：每张素材的来源、真实性、处理方式、导出尺寸与用途。
- `publish-checklist.md`：编辑器装配、预览、草稿保存和发布门清单。
- `sources/`：只放用户提供或已确认可用的真实原图；导入时统一转存为上述两个 JPEG 文件名，原文件名与来源记录在 `asset-inventory.md`。
- `exports/`：只放最终上传版本和一张总览联系表。

### Task 1: 建立发布内容包并锁定真实素材

**Files:**

- Create: `docs/brand-campaigns/2026-gaoge-renewal/article.md`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/asset-inventory.md`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/publish-checklist.md`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/sources/`
- Reference: `apps/brand/public/assets/brand/group-architecture.webp`
- Reference: `apps/brand/public/assets/brand/content-league-atmosphere.jpg`

**Interfaces:**

- Consumes: 已确认设计 spec、用户提供的高歌路真实照片、高歌 FC 真实照片。
- Produces: 后续视觉制作和公众号装配使用的唯一内容清单与素材来源表。

- [ ] **Step 1: 创建发布包目录与三个 Markdown 文件**

`article.md` 顶部固定写入：

```markdown
# 连接热爱，奔赴所爱｜高歌，全新启幕

摘要：高歌以全新的品牌面貌，与大家见面。连接热爱，奔赴所爱；将热爱，坚决贯彻到底。
```

- [ ] **Step 2: 登记现有可复用品牌资产**

在 `asset-inventory.md` 中记录：

```markdown
| 素材           | 来源                                                         | 用途                                     | 状态         |
| -------------- | ------------------------------------------------------------ | ---------------------------------------- | ------------ |
| 集团建筑抽象图 | apps/brand/public/assets/brand/group-architecture.webp       | 封面氛围参考，不直接表达集团             | 已确认       |
| 赛事现场图     | apps/brand/public/assets/brand/content-league-atmosphere.jpg | 高歌 FC 候选图，需确认画面真实性与使用权 | 待人工确认   |
| 高歌路照片     | 用户提供                                                     | 名称故事                                 | 待提供       |
| 高歌 FC 照片   | 用户提供或确认现有图                                         | 足球章节                                 | 待提供或确认 |
```

- [ ] **Step 3: 核对两个真实素材门**

高歌路照片与高歌 FC 照片缺失时，继续制作封面、宣言、价值观、四种表达和结尾图，但不得用生成图替代这两张真实素材，也不得进入公众号最终装配。

- [ ] **Step 4: 验证内容包结构**

Run:

```bash
find docs/brand-campaigns/2026-gaoge-renewal -maxdepth 2 -type f | sort
```

Expected: 显示 3 个 Markdown 文件，以及已提供的真实素材；没有来源不明的图片。

### Task 2: 完成可直接粘贴的公众号正文

**Files:**

- Modify: `docs/brand-campaigns/2026-gaoge-renewal/article.md`
- Reference: `docs/superpowers/specs/2026-08-10-gaoge-brand-renewal-wechat-article-design.md`

**Interfaces:**

- Consumes: 设计 spec 中的七段式正文。
- Produces: 公众号编辑器中使用的标题、摘要、正文和 8 个图片插入标记。

- [ ] **Step 1: 写入完整正文并标记图片位置**

使用以下标记，不在正文中写本地路径：

```markdown
<!-- IMAGE: 01-cover-landscape.png -->
<!-- IMAGE: 03-gaoge-road.png -->
<!-- IMAGE: 04-manifesto.png -->
<!-- IMAGE: 05-brand-values.png -->
<!-- IMAGE: 06-four-expressions.png -->
<!-- IMAGE: 07-gaoge-fc.png -->
<!-- IMAGE: 08-ending.png -->
```

- [ ] **Step 2: 执行真实性用词扫描**

Run:

```bash
rg -n "集团正式成立|集团公司|全资子公司|旗下公司|团队规模|组织扩张|从球队到集团" docs/brand-campaigns/2026-gaoge-renewal/article.md
```

Expected: 无匹配。

- [ ] **Step 3: 执行品牌语精确检查**

Run:

```bash
rg -n "连接热爱，奔赴所爱。|高歌，全新启幕。|将热爱，坚决贯彻到底。|让每一份热爱，都有持续生长的可能。" docs/brand-campaigns/2026-gaoge-renewal/article.md
```

Expected: 四句均存在，文字与标点完全一致。

- [ ] **Step 4: 人工通读手机阅读节奏**

检查每个正文段落为 1–3 句；名称故事、行动宣言、四种表达、高歌 FC 与结尾之间均有图片停顿；正文不展开事业部能力。

### Task 3: 制作封面与纯品牌视觉物料

**Files:**

- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/01-cover-landscape.png`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/02-cover-share-safe.png`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/04-manifesto.png`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/05-brand-values.png`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/06-four-expressions.png`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/08-ending.png`
- Modify: `docs/brand-campaigns/2026-gaoge-renewal/asset-inventory.md`

**Interfaces:**

- Consumes: Brand 官网暗色、银灰与鼠尾草绿视觉，四层品牌语言。
- Produces: 6 张不依赖真实照片的确定性文字视觉。

- [ ] **Step 1: 生成或选取无文字的封面氛围底图**

底图使用冷黑、深色弧形结构或道路/轨道语言与少量鼠尾草绿，不包含人物、Logo、可读文字、庆典金或企业蓝。若使用 AI 生成，只生成无文字底图。

- [ ] **Step 2: 确定性叠加封面文字**

封面主层级：

```text
连接热爱，
奔赴所爱。
```

辅助层级：

```text
GAOGE · A NEW CHAPTER
高歌，全新启幕。
DIGITAL · CONTENT · FILM · SPORTS
```

所有中文由排版工具确定性渲染，不依赖图像模型生成文字。

- [ ] **Step 3: 制作行动宣言图**

使用纯暗色背景与大字：

```text
将热爱，
坚决贯彻到底。
```

- [ ] **Step 4: 制作品牌愿景与三条价值表达图**

必须完整包含“让每一份热爱，都有持续生长的可能。”以及“因热爱出发、让想法发生、与伙伴同行”。

- [ ] **Step 5: 制作四种表达关系图**

只包含：

```text
DIGITAL / 高歌数字
CONTENT / 高歌内容
FILM / 高歌影视
SPORTS / 高歌体育
```

不添加能力清单、组织关系或集团中心节点。

- [ ] **Step 6: 制作结尾图**

只保留高歌标识、足量留白和“连接热爱，奔赴所爱。”，不叠加二维码。

- [ ] **Step 7: 检查导出文件**

Run:

```bash
file docs/brand-campaigns/2026-gaoge-renewal/exports/*.png
```

Expected: 6 个目标 PNG 均可识别且尺寸大于 0。

### Task 4: 处理高歌路与高歌 FC 真实照片

**Files:**

- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/03-gaoge-road.png`
- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/07-gaoge-fc.png`
- Modify: `docs/brand-campaigns/2026-gaoge-renewal/asset-inventory.md`

**Interfaces:**

- Consumes: Task 1 中登记并确认的真实照片。
- Produces: 两张经过统一色调、裁切和文字安全区处理的真实影像。

- [ ] **Step 1: 核对素材真实性与使用权**

在 `asset-inventory.md` 把两张素材状态改为“已确认”，并记录原文件名与提供者。未确认时停止本任务。

- [ ] **Step 2: 处理高歌路图片**

保留可辨认的真实道路或路牌信息，调整为冷黑、银灰与轻微鼠尾草绿体系；不得生成、替换或修改地名文字。

- [ ] **Step 3: 处理高歌 FC 图片**

保留真实人物、球衣与现场，不改变人物身份、人数或比赛事实；只做裁切、曝光、色调、颗粒和轻量遮罩。

- [ ] **Step 4: 视觉检查**

确认两张图片在手机宽度下主体可识别、暗部不糊成纯黑、没有误导性文字或 AI 改造痕迹。

### Task 5: 完成发布包 QA

**Files:**

- Create: `docs/brand-campaigns/2026-gaoge-renewal/exports/contact-sheet.png`
- Modify: `docs/brand-campaigns/2026-gaoge-renewal/publish-checklist.md`

**Interfaces:**

- Consumes: Task 2–4 的完整正文与 8 组物料。
- Produces: 可一次性审阅的总览图和通过检查的发布包。

- [ ] **Step 1: 生成联系表**

按照文章顺序排列 01–08 物料，每张图附文件名，不改变原图内容。

- [ ] **Step 2: 检查文件完整性**

Run:

```bash
for file in 01-cover-landscape.png 02-cover-share-safe.png 03-gaoge-road.png 04-manifesto.png 05-brand-values.png 06-four-expressions.png 07-gaoge-fc.png 08-ending.png contact-sheet.png; do test -s "docs/brand-campaigns/2026-gaoge-renewal/exports/$file" || exit 1; done
```

Expected: Exit 0。

- [ ] **Step 3: 检查文字与安全区**

逐张查看 01、02、04、05、06、08，确认中文无错字，主标题未贴边，分享裁切不会截断“连接热爱，奔赴所爱。”。

- [ ] **Step 4: 用户审核联系表**

向用户展示 `contact-sheet.png`，获得视觉确认后才能进入公众号装配。

### Task 6: 使用已登录 Chrome 装配公众号草稿

**Files:**

- Read: `docs/brand-campaigns/2026-gaoge-renewal/article.md`
- Read: `docs/brand-campaigns/2026-gaoge-renewal/exports/*.png`
- Modify external draft: 微信公众平台图文草稿
- Modify: `docs/brand-campaigns/2026-gaoge-renewal/publish-checklist.md`

**Interfaces:**

- Consumes: 用户确认的正文与完整视觉发布包，以及用户已登录的 Chrome 公众号后台。
- Produces: 微信公众平台中未发布的完整图文草稿。

- [ ] **Step 1: 连接用户指定的 Chrome**

使用 Chrome 浏览器控制，打开或复用微信公众平台标签页。若未登录，停止并请用户在 Chrome 中自行登录；不读取认证信息。

- [ ] **Step 2: 创建新的图文草稿**

进入图文编辑器，新建单篇文章。不得覆盖已有草稿；如果编辑器默认打开现有内容，返回草稿列表后新建。

- [ ] **Step 3: 写入标题与摘要**

标题：

```text
连接热爱，奔赴所爱｜高歌，全新启幕
```

摘要：

```text
高歌以全新的品牌面貌，与大家见面。连接热爱，奔赴所爱；将热爱，坚决贯彻到底。
```

- [ ] **Step 4: 按 `article.md` 顺序写入正文与图片**

每次插入图片后核对相邻段落，防止编辑器焦点跳转导致图片顺序错误。正文只使用标题、普通正文、引用与留白四种层级，不套用第三方花哨模板。

- [ ] **Step 5: 设置封面**

优先上传 `01-cover-landscape.png`，使用编辑器实时裁切检查；分享卡片裁切不理想时改用 `02-cover-share-safe.png`。

- [ ] **Step 6: 保存草稿**

点击“保存为草稿”或当前平台等价操作。保存后回到草稿列表确认标题和封面存在。不得点击“群发”或“发布”。

### Task 7: 平台预览与发布门

**Files:**

- Modify: `docs/brand-campaigns/2026-gaoge-renewal/publish-checklist.md`
- Read external draft: 微信公众平台图文草稿

**Interfaces:**

- Consumes: Task 6 保存的公众号草稿。
- Produces: 通过手机与分享卡片检查、等待最终发布授权的草稿。

- [ ] **Step 1: 使用编辑器内置手机预览检查全文**

检查标题、摘要、封面、段落间距、图片清晰度、暗部层次和最后一屏。不得仅依赖桌面编辑区判断。

- [ ] **Step 2: 检查分享卡片**

确认分享裁切完整保留“连接热爱，奔赴所爱。”；若裁切不正确，返回 Task 3 调整 `02-cover-share-safe.png` 后重新上传。

- [ ] **Step 3: 检查外链与 CTA**

只保留一个已验证的“了解高歌”官网链接；没有稳定公开地址时删除 CTA，不留下占位链接。

- [ ] **Step 4: 保存最终草稿并停止**

向用户报告草稿已准备完成，提供标题与最后保存状态。等待用户明确说“发布”后，才可另行执行群发或发布操作。

## 验证命令

文案与文件验证：

```bash
rg -n "连接热爱，奔赴所爱。|高歌，全新启幕。|将热爱，坚决贯彻到底。|让每一份热爱，都有持续生长的可能。" docs/brand-campaigns/2026-gaoge-renewal/article.md
rg -n "集团正式成立|集团公司|全资子公司|旗下公司|团队规模|组织扩张|从球队到集团" docs/brand-campaigns/2026-gaoge-renewal/article.md
find docs/brand-campaigns/2026-gaoge-renewal -maxdepth 2 -type f | sort
file docs/brand-campaigns/2026-gaoge-renewal/exports/*.png
git diff --check
```

浏览器人工验证：

- Chrome 中公众号账号已由用户登录。
- 草稿为新建内容，没有覆盖原有草稿。
- 标题、摘要、正文、图片顺序与 `article.md` 一致。
- 横版封面与分享卡片裁切均通过。
- 手机预览无错字、孤行、图片模糊或暗部丢失。
- 草稿已保存，但没有发布、群发或发送外部预览。
