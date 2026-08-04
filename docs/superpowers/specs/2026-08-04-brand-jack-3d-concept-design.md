# Brand Jack 3D Creator 概念首页设计

## 1. 背景

`apps/brand` 用于承载高歌品牌展示首页。后续会并行制作多个视觉版本，因此本次不直接占用唯一首页实现，而是先建立一个可独立访问、可继续迭代的概念页面。

本版以用户提供的 “Jack -- 3D Creator” 页面提示词为唯一视觉与内容基准。第一阶段优先验证完整效果，不提前替换为高歌品牌文案或原创素材。

## 2. 已确认方向

- 在当前 `main` 上从零建立独立的 `apps/brand`
- 使用 React 18、TypeScript、Vite、Tailwind CSS、Framer Motion 和 Lucide React
- `apps/brand` 作为独立部署的品牌展示站，不需要迁就仓库内其他前端应用的 Vue 技术栈
- 不恢复或迁移历史分支中的 Vue、Three.js 或剪纸旅程实现
- 严格保留提示词的 Jack 文案、指定外部图片、五段结构、颜色、尺寸与核心动效
- 本版通过 `/concepts/jack-3d` 独立访问
- 根路径 `/` 在只有一个版本时跳转到 `/concepts/jack-3d`
- 本阶段只提供本地开发和构建能力，不修改线上域名或部署流程

## 3. 目标

1. 创建可运行、可测试、可生产构建的 `@gaoge/app-brand`
2. 在 `/concepts/jack-3d` 高保真实现附件中的 3D Creator portfolio landing page
3. 保留后续并行增加多个品牌概念版本的目录和路由空间
4. 在桌面端与移动端保持提示词要求的视觉层级、滚动叙事与响应式体验
5. 对远程素材失败、减少动态效果偏好和组件卸载提供必要容错

## 4. 非目标

- 本次不把 Jack 文案改写为高歌品牌内容
- 本次不重新制作或本地化提示词中的第三方图片和 GIF
- 本次不恢复历史 `feat/brand-papercut-journey` 或归档分支的页面
- 本次不建设正式的多版本概念索引页
- 本次不抽取跨应用共享组件或共享动画框架
- 本次不修改 `apps/sports`、`apps/admin`、`apps/api` 等其他应用
- 本次不调整 DNS、Nginx、GitHub Actions 或生产发布配置

## 5. 应用与路由设计

### 5.1 应用边界

`apps/brand` 是独立 React/Vite 单页应用，包名为 `@gaoge/app-brand`。应用只依赖 `packages/*` 中确有必要的稳定共享能力；本次页面组件全部保留在应用内部。

建议目录：

```text
apps/brand/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ public/
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ styles.css
   └─ concepts/
      └─ jack-3d/
         ├─ Jack3DCreatorPage.tsx
         ├─ components/
         ├─ sections/
         └─ data.ts
```

### 5.2 路由行为

- `/concepts/jack-3d` 渲染本次 Jack 3D Creator 页面
- `/` 跳转到 `/concepts/jack-3d`
- 未匹配路径也回到 `/concepts/jack-3d`，避免本地预览出现空白页面
- 路由层保持轻量；只为当前概念页面和后续并行版本提供明确入口

后续出现第二个概念版本时，再把 `/` 改为版本索引页。本次不提前制作空壳索引。

## 6. 页面结构

页面 title 为 `Jack -- 3D Creator`，主容器背景为 `#0C0C0C`，并设置 `overflow-x: clip`。

页面 section 顺序固定为：

1. `HeroSection`
2. `MarqueeSection`
3. `AboutSection`
4. `ServicesSection`
5. `ProjectsSection`

导航锚点映射：

| 导航文字 | 目标                                  |
| -------- | ------------------------------------- |
| About    | AboutSection                          |
| Price    | ServicesSection                       |
| Projects | ProjectsSection                       |
| Contact  | AboutSection 内的 Contact Me 按钮区域 |

导航使用平滑滚动。按钮在提示词未提供真实联系地址或项目地址时保持展示交互，不伪造外部业务链接。

## 7. 全局视觉系统

### 7.1 基础样式

- `html`、`body`、`#root` 和页面主容器背景统一为 `#0C0C0C`
- 使用全局 `box-sizing: border-box`、`margin: 0`、`padding: 0`
- 字体使用 Google Fonts 的 `Kanit`，覆盖 `300–900` 字重
- `.hero-heading` 使用从 `#646973` 到 `#BBCCD7` 的纵向文字渐变
- 正文浅色统一以 `#D7E2EA` 为主
- 白色服务面板使用 `#FFFFFF`

### 7.2 响应式原则

- 使用 Tailwind 默认 `sm`、`md`、`lg` 断点
- 字体优先使用提示词给出的 `vw` 和 `clamp()` 数值
- 所有 section 在移动端保留，不通过删除内容换取适配
- 项目卡片在窄屏下可从横向信息布局调整为垂直布局，但保留编号、分类、名称、按钮和三张图片
- 页面不得产生水平滚动条

## 8. Section 设计

### 8.1 HeroSection

Hero 为全屏高度的纵向布局。

包含：

- 四项横向导航
- 巨型 `HI, I'M JACK` 渐变标题
- 绝对居中的人物图片
- 左下角 3D Creator 自述
- 右下角渐变 `CONTACT ME` 按钮

人物图片由 `Magnet` 包裹，使用提示词规定的 `padding: 150`、`strength: 3` 和进入、离开过渡。移动端人物垂直居中，`sm` 以上贴近 Hero 底部。

入场顺序与延迟严格采用提示词数值：

- Navbar：`0`
- Heading：`0.15`
- 左侧文字：`0.35`
- 联系按钮：`0.5`
- 人物：`0.6`

### 8.2 MarqueeSection

使用提示词给出的 21 个 motionsites.ai GIF：

- 第一排使用前 11 张，向右移动
- 第二排使用后 10 张，向左移动
- 两排数据各复制三份形成连续轨道
- 单个 tile 为 `420px × 270px`
- tile 间距和行间距均为 `12px`

滚动偏移保持提示词公式：

```text
(window.scrollY - sectionTop + window.innerHeight) * 0.3
```

第一排使用 `translateX(offset - 200)`，第二排使用 `translateX(-(offset - 200))`。

实现使用 passive scroll listener，并通过 `requestAnimationFrame` 合并 DOM 更新。轨道设置 `will-change: transform`。组件卸载时移除监听器并取消未完成动画帧。

### 8.3 AboutSection

About 为至少一屏高度的居中内容区，保留提示词指定的四张 3D 装饰图、位置、宽度和进入方向。

核心内容：

- 巨型 `ABOUT ME` 渐变标题
- 字符级滚动点亮段落
- `CONTACT ME` 按钮

`AnimatedText` 使用 Framer Motion `useScroll`，目标 offset 为 `['start 0.8', 'end 0.2']`。每个字符从 `0.2` opacity 过渡到 `1`，并通过不可见占位字符稳定文本换行。

### 8.4 ServicesSection

Services 使用白色背景和提示词给出的响应式顶部圆角，与暗色 About 形成明显转场。

内容包括 `SERVICES` 标题和五项服务：

1. 3D Modeling
2. Rendering
3. Motion Design
4. Branding
5. Web Design

服务文案逐字使用提示词原文。每项保持左侧超大编号、右侧名称与描述的布局，并按 `index * 0.1` 进行交错进入。

### 8.5 ProjectsSection

Projects 使用暗色背景、顶部圆角和负 margin 覆盖 Services 底部。

包含提示词给出的三个项目：

1. Nextlevel Studio
2. Aura Brand Identity
3. Solaris Digital

每个项目使用三张指定 CloudFront/Higgs 图片和 sticky 堆叠动画：

- 外层高度为 `85vh`
- 卡片 sticky 位置为移动端 `top-24`、桌面端 `top-32`
- 每张卡片增加 `index * 28px` 顶部偏移
- 目标缩放为 `1 - (totalCards - 1 - index) * 0.03`

卡片上部保留编号、分类、名称和 `LIVE PROJECT` 按钮，下部为 40% 双图列与 60% 单图列。

## 9. 私有组件设计

### 9.1 FadeIn

- 基于 Framer Motion
- 支持 `delay`、`duration`、`x`、`y`
- 默认 `duration: 0.7`、`x: 0`、`y: 30`
- easing 为 `[0.25, 0.1, 0.25, 1]`
- `viewport` 为 `{ once: true, margin: '50px', amount: 0 }`
- 支持提示词需要的动态 HTML 元素类型

### 9.2 ContactButton

严格使用提示词中的多色渐变、内阴影、白色 outline、响应式间距和大写字距。

### 9.3 LiveProjectButton

使用浅色 2px 描边、透明背景、圆角胶囊和半透明 hover 背景。

### 9.4 Magnet

- 以元素中心计算鼠标偏移
- 只有指针进入扩展了 `padding` 的有效区域后才激活
- 位移为指针相对中心距离除以 `strength`
- 使用 `translate3d`
- 激活和复位使用提示词规定的 transition
- 离开、卸载和 reduced-motion 模式下复位

### 9.5 AnimatedText

- 以字符为最小动画单位
- 保持原始空格和换行行为
- 每个字符拥有依据索引划分的滚动进度区间
- 使用不可见占位和绝对定位动画字形避免布局跳动

### 9.6 ProjectCard

- 接收项目数据、index 和 total 参数
- 自己负责 sticky 容器、滚动进度与 scale transform
- 不在组件内部硬编码具体项目文案和 URL

## 10. 数据设计

`data.ts` 维护：

- `marqueeRowOne`
- `marqueeRowTwo`
- `services`
- `projects`
- section 和导航元数据

所有数据使用 TypeScript 只读类型。组件不得在渲染期间修改或重新复制原始数组；无缝 Marquee 轨道的三倍数据在模块级生成或通过稳定 memo 生成。

## 11. 动画性能

- 高频滚动逻辑不写入 React state
- Marquee 位移优先直接更新 motion value 或 transform style
- passive scroll listener 只负责记录滚动位置
- 每帧最多执行一次位移计算
- 图片设置明确尺寸，避免加载后布局抖动
- 非首屏图片使用 `loading="lazy"` 和 `decoding="async"`
- transform 动画只使用 `transform` 和 `opacity`
- 组件卸载时清理 scroll、pointer 和 animation frame 资源

## 12. 可访问性与减少动态效果

- 导航和按钮使用真实 `a` 或 `button`
- 交互元素具有清晰 focus-visible 样式
- 装饰图片使用空 `alt`
- 作品图片使用包含项目名和位置的描述性 `alt`
- 正文与背景保持提示词指定的高对比度
- `prefers-reduced-motion: reduce` 时：
  - `FadeIn` 直接显示最终状态
  - `Magnet` 不跟随鼠标
  - Marquee 保持静止但仍展示两排内容
  - 字符段落直接完整点亮
  - sticky 卡片不执行缩放
  - 平滑滚动改为即时跳转

减少动态效果只作为可访问性降级，不改变普通模式的提示词效果。

## 13. 容错

- 远程图片失败时隐藏破图图标并显示与所在区块一致的占位背景
- 单张远程图片失败不得阻断其他 section 渲染
- 不为提示词未提供的联系地址和 Live Project 地址编造外部链接
- 浏览器不支持特定动画能力时保留完整静态内容顺序
- 路由未匹配时回退到当前 concept，而不是空白页

## 14. 测试与验证

### 14.1 自动验证

至少覆盖：

- `/concepts/jack-3d` 能渲染页面
- `/` 跳转到 concept 路径
- 五个 section 顺序正确
- Hero、About、Services、Project 核心文案存在
- Services 恰好包含五项
- Projects 恰好包含三项
- 两排 Marquee 使用 11 和 10 个基础资源
- 导航锚点映射正确
- reduced-motion 时动效组件使用静态最终状态

运行：

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
```

如根级配置发生变化，再补充：

```bash
pnpm typecheck
pnpm lint
```

### 14.2 视觉检查

启动本地应用后检查：

- 桌面宽屏首屏层级和人物遮挡关系
- 移动端 Hero 人物位置与标题裁切
- 两排 GIF 是否连续且方向相反
- 字符滚动点亮是否与段落滚动同步
- Services 白色面板与 Projects 暗色面板的圆角衔接
- 三张项目卡片的 sticky 层叠、顶部偏移和缩放
- 页面是否出现意外水平滚动
- 外部图片失败时布局是否稳定
- reduced-motion 模式下内容是否完整可读

## 15. 后续多版本扩展

后续新版本放入 `src/concepts/<concept-slug>/`，增加独立路径，不直接修改 Jack 版本。出现第二个版本时再建设根路径版本索引，并决定默认对外展示的正式品牌首页。

Jack 版本在后续高歌品牌化改造前保持为附件提示词的高保真基准，便于对比不同视觉方案。
