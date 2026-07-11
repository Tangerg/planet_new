# Planet 非架构代码质量优化路线图

> **文档角色：本轮深度质量重构的执行基线。**
>
> 本轮只改善既有架构内部的正确性、可读性、可测试性、类型安全和经测量证明的构建/运行质量。不得新增或移动架构层级，不改变既有 Context、端口边界、依赖方向和 UI 状态机。

## 1. 目标与完成定义

### 1.1 目标

1. 降低高风险函数的分支复杂度，让业务判断和渲染编排可以独立测试。
2. 删除脆弱的 Hook、异步生命周期和浏览器副作用写法，不依赖 lint 抑制维持正确性。
3. 提升 Provider mapper、远端适配器和 Go I/O 错误路径的测试强度。
4. 收紧生产代码类型安全，禁止用 `any`、双重断言或静默 catch 绕过契约。
5. 只处理有测量证据的性能问题；不凭代码外观改算法、加缓存或并行化。
6. 保持现有行为、视觉状态机、Context 公开面和依赖规则不变。

### 1.2 完成定义

- [x] Q0～Q6 全部完成，或记录明确的不做理由和证据。
- [x] 高复杂度 UI 编排已拆为命名清晰、可独立测试的同层纯逻辑；没有新增架构层。
- [x] 生产代码不存在新增 `any`、`as unknown as`、空 catch 或无依据的 lint 抑制。
- [x] Provider/mapper 和 Go 错误路径的关键分支具有回归测试。
- [x] 所有性能改动均有改动前后测量；没有数据支持的优化被明确拒绝。
- [x] `make check`、分层规则、核心 E2E 和生产构建通过。
- [x] 本文进度、证据和实际代码一致。

## 2. 不变量与范围边界

- 不新增、删除或重命名 bounded context。
- 不移动 `domain/core/contexts/providers/infrastructure/ui/app` 或 Go 各层的职责。
- 不更改 Context 公开 API，除非修复明确缺陷且先补兼容性测试。
- 不改变 Shell 单页导航、morph transition、共享音频元素和队列来源语义。
- 不引入全局状态容器、通用 Repository、事件总线 DTO 或依赖注入框架。
- 不以“降低行数”为目标机械拆文件；只拆能够命名并独立验证的职责。
- 不追求全局覆盖率数字；优先覆盖高复杂度、外部边界和失败路径。
- 不做无测量依据的缓存、并行化、算法替换或微优化。

## 3. 起始基线（2026-07-12）

### 3.1 自动化与覆盖率

| 范围           | 起始证据                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| 前端测试       | 111 个测试文件、481 个测试，类型检查通过                                 |
| 前端整体覆盖率 | statements 48.16%、branches 44.77%、functions 47.42%、lines 48.25%       |
| 前端关键层阈值 | Domain/Application/Local Provider/Local Library/Web Audio 已进入默认门禁 |
| Go backend     | 55.4% statements                                                         |
| Go application | 64.8% statements                                                         |
| Go domain      | 87.5% statements                                                         |
| Go media       | 80.3% statements                                                         |
| Go scan        | 68.2% statements                                                         |
| Go sqlite      | 72.4% statements                                                         |

### 3.2 复杂度热点

以下数字来自 TypeScript AST 的近似分支计数，只用于排序，不作为机械 KPI：

| 函数                        | 近似分支 | 函数跨度 | 风险                                    |
| --------------------------- | -------: | -------: | --------------------------------------- |
| `ShellScreenRouter`         |       25 |   314 行 | 屏幕选择、数据投影、回调装配与 JSX 混合 |
| `TrackRow`                  |       23 |   222 行 | 交互语义、菜单、播放态和多布局分支混合  |
| `XmbItem`                   |       22 |   112 行 | 类型分派与表现分支集中                  |
| `ArtistScreen`              |       18 |   266 行 | 页面状态和多个内容区编排混合            |
| `useShellXmbModel` callback |       16 |    54 行 | 导航目标分类集中                        |
| `topoSort`                  |       16 |    52 行 | 核心生命周期算法，但已有高价值测试      |

### 3.3 已确认质量信号

- 生产源码未发现 `any`、`as unknown as`、空 catch 或 `@ts-ignore`；双重断言主要集中在测试夹具。
- Hook 依赖和可访问性存在局部 lint 抑制，需要区分真实限制与可修复写法。
- `LyricLines` 用自赋值触发 style flush，意图隐晦且依赖 lint 抑制。
- QQMusic、Spotify、NCM 顶层适配器覆盖率较低；共享 Provider contract 不能覆盖各自错误映射。
- Go 没有 benchmark/pprof 数据；前端仅 UI/morph/visualizer 有性能探针，因此不进行无证据算法优化。
- 生产构建存在 LightningCSS `@reference` 警告和约 578 KB 主 chunk；必须先定位来源和测量拆分收益。

## 4. 实施阶段

### Q0 — 基线与防漂移

- [x] **Q0-01 质量基线**：记录测试、覆盖率、复杂度和构建警告。
- [x] **Q0-02 测量能力审计**：确认性能探针范围，禁止无数据调优。
- [x] **Q0-03 工作树安全审计**：确认上一轮大规模未提交变更、忽略文件和敏感特征扫描状态。

### Q1 — 正确性与副作用收口

- [x] **Q1-01 Hook 依赖审计**：逐项消除可修复的 exhaustive-deps 抑制，验证一次性动作和监听清理。
- [x] **Q1-02 浏览器副作用显式化**：以命名 helper 替代自赋值/reflow 技巧，补行为测试。
- [x] **Q1-03 异步竞态审计**：检查搜索、详情、歌词、媒体探针和登录的 supersede/dispose 语义。

### Q2 — Provider 与 mapper 质量

- [x] **Q2-01 Mapper 不变量**：为 QQ/Spotify/NCM 的 id、来源、时长、图片、播放键和缺失字段补表驱动测试。
- [x] **Q2-02 错误语义**：覆盖超时、非预期响应、部分成功和 unsupported/notFound/failed 投影。
- [x] **Q2-03 重复归一化清理**：只在同层提取真实重复 helper，不改变 Provider 端口或 Context。

### Q3 — UI 高复杂度实现重构

- [x] **Q3-01 ShellScreenRouter**：把 screen selection、view props 和回调装配拆为同层纯逻辑并测试。
- [x] **Q3-02 TrackRow/XMB**：拆分交互状态与表现分支，保持 DOM 语义、键盘行为和 morph 几何不变。
- [x] **Q3-03 页面编排**：按测量顺序处理 Artist/Library/NowPlaying 等高跨度组件，避免机械拆分。

### Q4 — Go 实现质量

- [x] **Q4-01 application/scanner 错误路径**：补目录变化、局部解析失败、取消边界和错误 cause 测试。
- [x] **Q4-02 SQLite/media 资源语义**：审计 rows/body/transaction 关闭路径和重复错误包装。
- [x] **Q4-03 数据转换清理**：减少 wire/domain 投影重复，但不移动 adapter 边界。

### Q5 — 经测量的构建与性能质量

- [x] **Q5-01 CSS 构建警告**：定位 `@reference` 来源并在不改变视觉结果的前提下消除。
- [x] **Q5-02 Bundle 基线**：记录 chunk 构成；仅在能降低首屏载荷且不破坏 resident shell 时拆分。
- [x] **Q5-03 运行时热点**：只处理 UI perf probe 或 profile 明确证明的主导热点，并记录前后数据。

### Q6 — 最终审计

- [x] **Q6-01 回归与门禁**：完整 `make check`。
- [x] **Q6-02 架构不变审计**：Context、目录职责、依赖图和公开面无层级变化。
- [x] **Q6-03 质量证据**：更新复杂度、覆盖率、警告和性能测量对比。

## 5. 当前队列

| 顺序 | 任务               | 状态 | 当前说明                                                                |
| ---: | ------------------ | ---- | ----------------------------------------------------------------------- |
|    1 | Q0 基线与防漂移    | DONE | AST 复杂度、覆盖率、性能探针、工作树安全已审计                          |
|    2 | Q1 正确性与副作用  | DONE | 登录轮询、歌词滚动、虚拟列表依赖与异步 guard 已收口                     |
|    3 | Q2 Provider/mapper | DONE | 三个网络 Provider 的不变量、部分成功和全失败语义已验证                  |
|    4 | Q3 UI 高复杂度实现 | DONE | 路由矩阵、TrackRow 子渲染器与 XMB 视觉模型完成；拒绝机械拆长页面        |
|    5 | Q4 Go 实现质量     | DONE | 歌词失败/取消、扫描依赖、rows/transaction 关闭和 wire 集合映射已收口    |
|    6 | Q5 构建/性能       | DONE | CSS warning 已消除；主 chunk 已量化并基于 resident shell 约束拒绝伪拆分 |
|    7 | Q6 最终审计        | DONE | 全量门禁、静态审计、覆盖率与构建证据均通过                              |

## 6. 进度记录

| 日期       | 任务 | 结果                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 证据                                                                                                                                                                                                      |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-12 | Q0   | 建立非架构质量优化基线，确认真实复杂度、覆盖率、测量能力和工作树风险；明确不以性能猜测或机械拆文件驱动重构                                                                                                                                                                                                                                                                                                                                                                            | TypeScript AST 分支统计、Istanbul 报告、`go test -cover ./backend/...`、instrumentation 搜索、Git 忽略/敏感特征审计                                                                                       |
| 2026-07-12 | Q1   | 稳定 `beginLogin`/关闭回调并移除 Hook 依赖抑制；登录开始/轮询失败显式呈现且卸载后不回写；歌词 smooth-scroll 中断改为命名副作用和纯位置计算；虚拟列表补齐显式依赖；确认 navigation ticket、歌词/播放/分析 generation 和搜索 alive guard 覆盖主要异步路径                                                                                                                                                                                                                               | 新增 LoginSheet/LyricLines 2 个测试文件、6 个测试；113 个测试文件/487 个测试；整体 lines 48.25%→49.45%；全量 `make check` 通过                                                                            |
| 2026-07-12 | Q2   | 为 Spotify mapper/adapter、QQ mapper/adapter 和 NCM catalog/search/details/tracks/library 建立边界测试；修复空 image DTO、数值 0 ID、epoch 日期、alternate singer 字段；缺失 QQ detail 返回 notFound；主请求失败不再伪装为空成功；多分区读取保留部分成功但全部失败抛含 cause 的 AggregateError；远端退出失败时本地凭据、UI 状态和 Query cache 仍一致清理                                                                                                                              | 120 个测试文件/517 个测试；整体 lines 49.45%→52.19%、branches 45.52%→49.17%；NCM/QQ/Spotify lines 分别 78.5%/77.19%/70.42%；全量 `make check` 通过                                                        |
| 2026-07-12 | Q3   | 新增穷举 `ShellScreenRoute` resolver，集中 unknown/missing-payload fallback；TrackRow 将 render 内定义的 Trend 与 leading/badge 多分支提为稳定模块级组件，主函数跨度 222→154 行；XMB offset→视觉状态成为纯模型；审计 Artist/Library/NowPlaying 后确认其剩余分支为声明式布局，继续拆分只会增加 props 耦合，因此明确不做机械切片                                                                                                                                                        | 新增 shell-screen/xmb-item 路由与视觉矩阵测试；122 个测试文件/522 个测试；整体 branches 50.18%、lines 52.51%；交互边界测试、架构规则与全量 `make check` 通过                                              |
| 2026-07-12 | Q4   | 修复歌词目录查询把 catalog 故障/取消误判为“无歌词”的语义泄漏，并由 SQLite 将 missing row 显式映射为空结果；扫描缺失必要依赖时返回 unavailable 而非 panic；统一传播 rows close 与 transaction rollback 错误；wire/domain 集合投影收敛为保持非 nil 数组契约的泛型 helper；修复测试夹具未检查 binary write 的静态分析问题                                                                                                                                                                | Go 总 statements 69.3%→69.6%，application 65.7%→67.8%，sqlite 72.4%→73.4%；`go test ./backend/...`、Staticcheck、golangci-lint 均通过；未改 package 边界、端口或 Wails DTO                                |
| 2026-07-12 | Q5   | 删除不含 `@apply` 的 `base.css` 残留 `@reference`，LightningCSS warning 清零；用临时 sourcemap 量化入口组成，确认 entry 580.11 kB minified/172.44 kB gzip，初始 JS preload 合计约 324.3 kB gzip；最大来源为 resident UI、Motion、Material color、i18n 和 provider 实现。屏幕 lazy split 会丢失常驻状态并破坏 morph 目标，单纯 vendor 分块仍会被 preload，不降低首屏载荷，因此拒绝无收益拆分；将告警预算收紧记录为 600 kB。UI perf probe 没有提供热点样本，所以未做运行时算法/缓存调整 | 两次生产构建前后对比、sourcemap source-content 分组、HTML modulepreload 图；最终构建无 warning，CSS 66.19→66.16 kB，JS 行为与 preload 图不变                                                              |
| 2026-07-12 | Q6   | 复核类型逃逸、静默 catch、lint 抑制、Go panic/TODO/context、格式与空白；确认唯一双重断言位于仅被测试导入的 fake ky fixture，剩余 lint 抑制均为既有且带理由的 morph/a11y 约束，本轮未新增；目录职责、Context/端口、依赖方向和 Wails DTO 未发生层级变化                                                                                                                                                                                                                                 | 122 个测试文件/522 个测试；前端 lines 48.25%→52.54%、branches 44.77%→50.21%；Go 总 statements 69.6%；`make check` 完整通过，生产构建 0 warning，`check-layers` 0 violation，3 个既有 cycle 均在 allowlist |

## 7. 下一步

本轮 Q0～Q6 已全部完成。后续若要继续做运行时性能优化，应先在目标设备用现有 `?perf`/`planet.uiPerf` 探针采集 XMB 滚动、morph、搜索输入和可视化帧间隔样本；在出现可复现主导热点前，不调整算法、缓存或 resident screen 策略。
