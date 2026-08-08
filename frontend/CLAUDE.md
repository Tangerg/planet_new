# CLAUDE.md — project context for Claude Code

> **PLANET** — Wails 桌面音乐播放器（Go 壳 + React/TS 前端）。**单包 + 文件夹分层(整洁架构 / DDD 方向)**,`src/` 按层划分,别名即层:
> - `@shared`(`src/shared`)框架无关纯工具 —— 零依赖,最内。
> - `@domain`(`src/domain`)领域层:实体/值对象(`model/`)+ 端口契约(`ports/`,如 MusicProvider 能力)—— 只依赖 `@shared`。
> - `@core`(`src/core`)应用/运行时:planet 内核(插件系统/事件总线/manager)+ 播放插件(control/playqueue/progress/volume/lyric/analyser)—— 依赖 domain。
> - `@providers`(`src/providers`)基础设施:QQ/Netease/Spotify 网络适配器 + 本地库 Local(经 `@bindings`(Wails v3 生成)桥接 Go `backend/` 包:整洁架构 domain/application/sqlite/scan/media,扫盘 / SQLite / 回环媒体流)+ mappers,实现 domain 端口 —— 依赖 core+domain。
> - `@/`(`src/ui`)表现层:逐字移植自示例 **Sonance Vibe**(XMB 启动器 + 共享元素切换)的播放器界面。
> - `src/app`(组合根 `planet.ts`)+ `src/main.tsx`(入口)在最外,装配具体 provider + 插件进内核。
>
> 依赖规则(单向):`@shared ← @domain ← @core ← @providers ← @/(ui) ← app`。先单包文件夹分层;待规模/团队增长再升级 workspace monorepo。
>
> 本文件只放**法则 —— 只宏观、不写具体**（具体文件名 / 符号 / 行数会随演化漂移,活在代码 / git 里,不进本则）。产品能力边界与 provider 职责见 `../doc/product-scope.md`;新增音乐能力前先确认它属于核心流媒体范围。读法:先「两条法则」→ §1 架构心智 → §2-§4 技术栈 / 判断 / 硬约定 → §5 别走的方向 → §6 怎么干活。

---

## 第一法则 —— 绝不为一时方便留历史债务

> **最高优先级,凌驾于本文件其余所有约定之上。**

项目处于快速开发阶段,没有外部兼容包袱 —— store shape / 暴露类型 / 命名 / provider 契约,全可调整。正因如此:

- ❌ **绝不为「少改几处 / 赶进度」留债** —— 兼容字段、推测性 shim、"以后再清"的 TODO,一律不留。
- ✅ **发现设计不对,在源头改对**,不在错的设计上叠补丁。**现在改成本最低,往后只会更贵。**
- 命名 / shape 按**本质第一性**决定;参考业界只取思想,不作命名锚。

## 第二法则 —— 修理问题必须治本,绝不治标

> **与第一法则并列的最高优先级。**

修任何 bug,都在它的**根因和正确的层**上修,绝不在症状点打补丁、绝不 hacky。判据一句话:问「根因消除了吗,还是只是这个现象不出现了?」—— 只让现象消失的是治标,打回重修。根因常在更底层(组件 / store / provider mapper / 内核事件),治本往往要动公开形状 —— 先算爆炸半径再动,但默认倾向治本。

---

## 1 · 架构心智模型

- **一句话定位**:**内核与 UI 严格分层,数据只经 provider,导航就是一台单页状态机。**
- **四大支柱**:
  1. **内核 / UI 分层(硬边界)**:`@core/*` 永不 import React;UI 只通过三条通道碰内核 ——
     ① `engine.events`(事件总线,收状态事实);
     ② `Engine` services + provider 插件(发命令 / 取数据);
     ③ zustand store(`StoreBridge` 把内核事件固化进 `usePlayQueueStore`,任何时刻 mount 的组件都读得到当前播放态)。
     **绝不在 UI 里复制一份播放态**(current / playing / queue / progress 全来自内核 store + hooks)。
  2. **Provider 抽象(取数唯一入口)**:所有数据源实现 `MusicProvider`(`src/providers/`),**只取渲染必要字段**,字段映射全在 `mappers/` 里(参考已有的 `mapQQ*`)。新增一类数据 = 在 `domain/ports` 加 capability / 方法 + 基类 `provider.ts` 给空默认实现(让其余 provider 仍编译)+ 具体 provider 覆写 + 写 mapper。**组件 / 屏幕绝不直接 fetch**,一律走 provider + React Query。
  3. **导航 = 单页状态机 + 共享元素切换引擎**(`ui/Shell.tsx`,逐字移植自示例)。屏幕在**同一个常驻 `.view` 容器**里挂载 / 卸载,切换相位机(`trans` / `startForward` / `startReverse` / morph 飞行图块)靠在该容器内**测量起点与目标 Hero 的矩形**做容器形变。**这是这套丝滑切换的根因,载荷极重 —— 不要破坏它。**
  4. **设计系统主体 = `ui/Shell.css` + `ui/styles/*` + 组件级 CSS**(逐字搬自示例并逐步组件化):class + 内联样式驱动,自带字体 / token / 玻璃 / 动画 keyframes —— 仍是「切换效果原样」的根因,**不机械全量改写、不破坏 morph**。在此之上 **Tailwind v4 已启用(无 Preflight,只引 theme+utilities 层)**作为工具类补充,复用型交互件(Base UI + Tailwind,经 `ui/lib/cn`)放 `ui/components/`(已落地 `Slider`、`VirtualList`)。详见 §2 / §5。

---

## 2 · 技术栈(选择已定,别轻易换 —— 反向不变量见 §5)

- **UI**:React 19 + TypeScript。**桌面壳**:Wails v3(Go),无边框窗口 + 页面伪装红绿灯(`main.go` `Frameless: true`,红绿灯走 `@wailsio/runtime` 的 `Application`/`Window`,统一收在 `ui/infra/wails.ts`)。Go 侧绑定用 **Service**(`application.NewService`)而非 v2 的 `Bind`,构建由根 `Taskfile.yml` 编排。
- **样式**:`vibe.css`(class-based,逐字移植,设计系统主体)+ **Tailwind v4(无 Preflight,工具类补充)**。**不引 CSS-in-JS / 大型 UI Kit**;动态值(accent / 渐变 / 计算量)留内联 style,静态/重复模式可用 Tailwind 工具类(如 `truncate`)。
- **交互件**:优先 **Base UI**(`@base-ui/react`,headless)替换手写;新组件放 `ui/components/`,用 `cn()`(clsx + tailwind-merge)。**大列表用 `@tanstack/react-virtual` 虚拟化**(行高恒定时定值 estimateSize,见 `VirtualList`)。
- **状态 / 数据**:Zustand(多小 store)+ TanStack React Query(目录 / 详情 / 搜索 / 榜单缓存)。**无路由**(导航是 `Shell` 的 `view` 状态,见 §1.3)。
- **HTTP**:ky。**动画**:CSS(vibe.css)为主。**测试**:Vitest。**工程化**:Prettier / oxlint(`--deny-warnings`)/ knip / madge / `check-layers` / `check-circular`,husky + lint-staged 预提交(见 §6)。
- **数据源**:provider 插件(NeteaseCloudMusic / QQMusic / Spotify / Local),由 `VITE_PROVIDER` 选(默认 / 兜底为 NCM)或运行时在 Settings「音乐来源」切换;QQ 对接本机 `Rain120/qq-music-api`(:3200);Local 是桌面自带的本地库(Go 侧扫盘 + SQLite + 回环媒体流,无需外部服务),扫描经 Settings 原生目录选择器触发。桌面壳动作(原生对话框 / 窗口控制)走 `ui/infra` 薄 shim,不进 Engine facade。

---

## 3 · 设计原则(怎么判断)

- **KISS / SOLID / YAGNI / DRY**;**抽象只在 3+ 重复时引入**;模块经最小接口(provider / store selector / `planet.hooks`)通信。
- **用户体验细节是一等公民**。功能正确只是底线;拉开观感的是不影响功能、却天天硌用户的细节。做 UI 按**打磨后的终态**交付:尺寸稳定(不随内容跳动,长文本截断兜底)、间距 / 字号 / 字重层级一致、对齐、空态 / hover、**动画流畅不卡顿**(热路径别放大量重排 / 大图重复 decode)。改完自己当用户走一遍。
- **morph 与数据解耦**:详情屏的 **Hero 容器必须立即渲染骨架**(尺寸 / 位置与最终一致),不要把整屏 gate 在 `isLoading` 后面 —— 否则切换引擎量不到目标矩形。数据(<1s)到了只填封面 / 标题。
- **封面**:有真实 `image` 就渲 `<img>`,无则 seed 派生的渐变兜底(示例本就是渐变美学)。morph 飞行图块也带 `image`,避免渐变→真图的颜色跳变。
- **零 legacy**:store shape 变了直接改,不留迁移 / 兼容字段;注释不写 "Legacy …"。
- **注释纪律**:只写 _why_ 与_约束_,不写 _what_ / _how_;公开契约 / 特殊约定 / 反直觉实现才写;改代码同步改注释,宁删不留过期。

---

## 4 · 硬约定(违反 = 回归)

- **取数走 provider**:任何外部数据都经 `MusicProvider` + mapper + React Query;**组件不 fetch、不直连后端**。
- **产品范围先行**:新增 provider/API 能力先看 `../doc/product-scope.md`;只接核心流媒体能力,不因为平台接口存在就把签到、任务、社交、播客、广播等能力带进产品。
- **播放态唯一源是内核**:控制 `planet.hooks.emit(...)`,读 `usePlayQueueStore` / `on(...)`;不在 UI 另存一份。
- **导航走 `view` 状态机**:屏幕切换调 `Shell` 的 `setView` / `openDetail` / `window.__MORPH`;**不引路由库**(见 §5)。
- **设计系统主体仍是 `vibe.css`,不重做、不机械全量 Tailwind 化**:可用 Tailwind 工具类增量补充,但 token 来自 `@theme`(镜像 vibe.css)、动态值留内联、视觉零回归;新 .css 不写,玻璃/morph keyframes 等复杂视觉留 vibe.css(见 §5)。
- **vibe 屏幕保持纯展示**:数据 / 真实接线在 `Shell` / `ui/hooks/` / `ui/model/adapters/` 完成,屏幕只吃 props(保持与示例一致的 prop 形状,便于比对保真)。
- **无后端能力的屏幕走诚实空态**:Browse 分类 / Comments / Radio 等还没有对应 provider capability,**直接显示空态(如 "No comments yet"),绝不伪造数据、绝不用假数据冒充真数据**。**不维护任何 mock 目录 / mock provider**(早期的 `providers/Mock.ts` 与 `ui/model/mock.ts` 均已删)。想要有数据的 dev 体验就起真实后端(NCM / QQ);等 provider 有了对应 capability 再接真。
- **显示文案只有一处来源**:用户可见文案一律进 `ui/i18n/messages/*`;纯模型层(`ui/model/*`)**产出 message key(`LocalizedText`),不产出英文串**,由组件端 `localize()` 解析。**绝不允许**「模型给英文 → 组件再查表翻回 key」或「模型给 label → 组件按 key 重算一遍」这两种补丁形态(两者都曾存在,都让模型输出变成切语言够不到的死代码)。
- **同一事实只留一个 tag**:`kind` / `view` / `tab` 这类判别标签用**收敛的字面量联合**(见 `CollectionKind` / `CollectionViewMode` / `LibrarySectionTab`),不要用裸 `string`,更不要为同一事实并存两个 tag —— `kind` 与 `variant` 曾并存并漂移,直接让榜单排名整体失效。
- **加文档先问**:不主动建 `*.md`,除非用户明确要。

---

## 5 · 强反向不变量(已知错的方向,别再提)

- ❌ **重新引入 TanStack Router / 任何「一屏一路由」**:会破坏共享元素 morph(新旧屏需在同一常驻容器共存测量),这正是当初去掉路由的原因。
- ❌ **机械全量把 `vibe.css` / vibe 屏内联样式改写成 Tailwind、或重做设计系统**:逐字保真是「切换效果原样」的前提,大改必漂移。✅ 允许的是:Tailwind 工具类**增量**补充(token 走 `@theme`、动态值留内联、逐 token 还原、视觉零回归)、Base UI 替换手写交互件、虚拟滚动 —— 没有可视化回归比对手段时尤其**逐屏小步、在 `wails3 dev` 里核对**,不盲目大面积重写。
- ❌ **在组件 / 屏幕里直接 fetch 或 import provider 实例**:一律走 `MusicProvider` 抽象 + mapper + React Query。
- ❌ **在 UI 里复制播放态**(本地 `useState` 存 current / queue / progress):唯一源是内核 store + hooks。
- ❌ **加回原生窗口标题栏 / 系统红绿灯**:窗口无边框,装饰由页面 `.win` + 伪装红绿灯承担。
- ❌ **换栈**(Zustand→Redux、React Query→SWR、Wails→Tauri、引 UI Kit / CSS-in-JS)—— 无收益。

---

## 6 · 工作流

- **开发**:在仓库根 `wails3 dev`(自动起 vite + Go;需 `PATH` 含 `/usr/local/go/bin` 与 `~/go/bin`)。配套 NCM API(`VITE_NETEASE_HOST`,默认 provider)/ QQ API(`~/Desktop/qq-music-api` 跑 `yarn dev`,:3200);后端没起时 provider 取数失败,相关屏显示诚实空态(无 mock 兜底,起真实后端才有数据)。
- **Go↔JS 绑定**:`frontend/bindings/` 由 `wails3 generate bindings` 生成并**入库**(前端门禁因此不需要 Go 工具链)。改了 `backend` 的绑定方法签名或 wire DTO,跑 `make bindings` 并把结果一起提交(CI 有 drift job 兜底,漏了会红)。别手改生成物。Go 侧绑定方法**第一个参数是 `context.Context`**——Wails 认这个形状、不会生成到 TS 里,前端调用签名不变;错误经 service 的 MarshalError 挂在 rejection 的 `cause` 上,前端读结构化 payload,**不解析 message 文本**。
- **质量门禁**:仓库根目录统一跑 `make check`(Go vet/race + 前端聚合检查 + production build)。只验证前端时在 `frontend/` 跑 `yarn run check`;必须带 `run`,因为 `yarn check` 是 Yarn Classic 自带命令。前端聚合包含 typecheck / lint / format / test / knip / layer / circular。全绿才往下走。会漂的数字直接跑命令查,不硬编码。**husky + lint-staged 预提交**会对暂存的 `.ts/.tsx` 跑 prettier + oxlint `--deny-warnings` —— 所以**碰任何一屏(哪怕只改一行)都会触发该文件全量 lint**,需连带消化它的告警;vibe 屏(尤以 `Shell.tsx` morph 引擎、`XMB.tsx` 方向键导航)仍有成片 jsx-a11y / exhaustive-deps 旧债,逐屏迁移时一并清(exhaustive-deps 用带说明的局部 disable,不盲改依赖)。
- **沟通约定**:中文回复(用户偏好),代码 / 注释保持英文;破坏性 / 结构性改动前先算爆炸半径(grep 消费方)+ 给方案 + 权衡,等确认再动;commit message 写清 _why_,commit trailer 用 `Co-Authored-By: Claude <当前实际模型名> <noreply@anthropic.com>`(署名以实际生成该 commit 的模型为准)。
