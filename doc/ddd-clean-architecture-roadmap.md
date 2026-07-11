# Planet DDD / 整洁架构演进路线图

> **文档角色：下一阶段架构演进的唯一执行基线（Single Source of Truth）。**
>
> 本文记录目标、边界、实施顺序、验收标准、决策和实时进度。后续每个架构批次必须先对应到本文中的任务编号，完成后同步更新状态与验证证据，避免重构退化为搬目录、堆抽象或偏离产品目标。
>
> 当前架构事实见 [`architecture.md`](architecture.md)；上一轮已经完成的微内核重构设计见 [`../frontend/docs/core-architecture.md`](../frontend/docs/core-architecture.md)。旧文档是历史设计记录，不再承担本轮进度管理职责。

---

## 1. 目标与完成定义

### 1.1 总目标

在不重写产品、不破坏现有播放体验和 UI 状态机的前提下，把 Planet 从“按技术层组织、具有整洁架构雏形的模块化单体”，演进为：

1. **以限界上下文组织业务**，上下文拥有自己的模型、用例和端口。
2. **领域身份稳定且来源明确**，跨 Provider 不再依赖裸字符串 id。
3. **业务规则集中在领域模型**，应用层负责编排，基础设施负责外部系统细节。
4. **依赖始终指向内层**，Provider、Wails、SQLite、DOM Audio、React 都是可替换适配器。
5. **失败、空结果、不支持是不同语义**，应用边界能够明确表达并被测试。
6. **本地音乐库具备可靠的一致性边界**，不完整扫描不能错误删除索引。
7. **架构规则可自动验证**，而不是只依赖文档和代码评审记忆。

### 1.2 本轮完成定义

只有同时满足以下条件，本路线图才可以标记为完成：

- [ ] 下文 Phase 0～5 的必做任务全部完成，或明确记录经批准的删减决策。
- [x] Track / Album / Artist 等跨源实体使用来源限定身份，队列、历史、缓存和播放解析不再只比较裸 id。
- [x] 应用用例不再依赖全能 `MusicProvider`；按用例依赖最小端口。
- [x] Playback、Catalog、Local Library、Identity 至少形成清晰的限界上下文边界。
- [x] Provider 成为上下文端口的基础设施适配器，而不是中心领域抽象。
- [x] Go 本地库扫描、持久化和媒体服务支持取消、正确关闭与明确错误语义。
- [ ] 前端、Go、架构规则和关键桌面流程的质量门禁在 CI 中稳定通过。
- [x] `doc/architecture.md` 已更新为最终真实架构，本文进度与代码一致。

P5-06 审计证据：

| ID     | 状态        | 证据                                                                                                                                                                 |
| ------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DoD-01 | WAIT_REMOTE | Phase 1～5 与 P0-01～P0-06/P0-08 已完成；P0-07 workflow 已实现但尚未提交/推送，首次远程运行证据缺失。                                                                |
| DoD-02 | DONE        | `ProviderId` + Track/Album/Artist key；PlayQueue、PlaybackIntent、Lyrics、Likes、History、Query keys 的跨源测试；源码消费使用 `TrackKey`。                           |
| DoD-03 | DONE        | `MusicProvider`/Capability API 搜索归零；Media/Playback/Identity/Library/Engagement 用例依赖最小端口；架构守卫只允许 `Engine` 组合 `MusicSource`。                   |
| DoD-04 | DONE        | `src/contexts/{playback,catalog,identity,local-library}` 公开面与负类型测试；跨 context 深层 import 由 `check-layers` 拒绝。                                         |
| DoD-05 | DONE        | NCM/QQ/Spotify/Local 只在组合根以端口适配器注册；UI 不导入具体 Provider；真实来源共享契约测试通过。                                                                  |
| DoD-06 | DONE        | Wails lifecycle Context 贯通 scanner/SQLite/HTTP；不完整扫描禁止 prune；事务取消回滚；错误 code/operation 投影；启动回滚与逆序幂等 shutdown 测试。                   |
| DoD-07 | WAIT_REMOTE | 本地 `make check` 已覆盖 Go vet/race、111 个前端测试文件/481 个测试、分层覆盖率、Knip、循环/分层规则、前后端 E2E 和生产构建；CI 使用同一命令，但未取得远程运行结果。 |
| DoD-08 | DONE        | `doc/architecture.md` 已核对 contexts、组合根、前后端数据流、错误/资源边界、迁移和门禁；本路线图台账与实现同步。                                                     |

---

## 2. 不做什么

本轮明确不做以下事情，除非出现新的真实需求并先更新本文的决策记录：

- 不拆微服务；Planet 继续是适合当前规模的模块化单体。
- 不为目录整齐而一次性重写或全量移动文件。
- 不机械地给每个实体增加 Repository、Factory、Domain Service。
- 不把所有 TypeScript `type` 改成 class；只有需要维护不变量和行为的模型才使用类/值对象。
- 不引入事件溯源、分布式 CQRS、消息中间件或通用命令总线。
- 不把 React 导航、morph 动画、画布效果等表现层状态伪装成领域模型。
- 不改变既定技术栈，也不破坏现有单页状态机和共享元素切换机制。
- 不为未来可能出现的第三方插件提前建设完整 SDK、沙箱或动态加载框架。

---

## 3. 当前基线（2026-07-11）

### 3.1 已有优势

- 前端已有 `shared ← domain ← core ← providers ← app` 的单向依赖规则，并由脚本检查。
- Go 本地库已有 `domain ← application ← sqlite/scan/media ← backend` 的端口与适配器结构。
- `PlayQueue`、`RepeatMode`、`Volume` 等核心播放规则已经进入纯领域模型。
- 命令通过 application service 直调，状态事实通过事件广播。
- Provider mapper 承担了外部协议到内部模型的防腐层职责。
- 当前质量验证结果：
  - `yarn run check`：85 个测试文件、402 个测试通过；类型、lint、格式、knip、循环和分层检查通过。
  - `go vet ./backend/...` 通过。
  - `go test -race ./backend/...` 通过。

### 3.2 已确认的问题

| ID      | 问题                                                                                | 影响                                           | 优先级 |
| ------- | ----------------------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| BASE-01 | 本地扫描忽略目录读取错误，随后仍执行 prune                                          | 暂时断盘/权限错误可能被误判为文件删除          | P0     |
| BASE-02 | Track 等实体只有裸字符串 id，没有稳定 ProviderId                                    | 跨源 id 碰撞、切源后用错误 Provider 解析旧队列 | P0     |
| BASE-03 | `ProviderRegistry.setActive` 的“未知来源 no-op”契约与实现不一致                     | 可能广播不存在的来源，实际 active 又回退到首项 | P0     |
| BASE-04 | Go 没有完整 shutdown；SQLite 和 HTTP server 生命周期未收口                          | 资源泄漏、测试和退出语义不完整                 | P0     |
| BASE-05 | `/stream` 是无会话保护的通用 HTTP/HTTPS 代理，且缺少明确超时                        | SSRF、本机端口访问、请求长期占用               | P0     |
| BASE-06 | 读取失败、无数据、不支持在部分应用查询中被压成同一空结果                            | UI 无法可靠表达错误，故障只留在控制台          | P1     |
| BASE-07 | `MusicProvider` 最终仍是大接口，能力字符串与方法实现可漂移                          | 用例依赖过宽，空默认实现掩盖错误接线           | P1     |
| BASE-08 | 前端 `domain/model` 是全局模型池，大量 `Partial<T>` 允许非法状态传播                | 聚合边界和完整性不清晰                         | P1     |
| BASE-09 | Kernel 直接创建 `Audio` / `AudioContext`                                            | 核心运行时与浏览器基础设施耦合，组合测试困难   | P1     |
| BASE-10 | 缺少 CI、覆盖率阈值和核心桌面 E2E                                                   | 本地门禁无法证明主分支持续健康                 | P1     |
| BASE-11 | README 的 `yarn check` 会触发 Yarn 内置命令；双 lockfile；Go module 仍为 `changeme` | 构建入口不唯一，工程身份不完整                 | P1     |

### 3.3 当前质量基线

这些数字只用于观察趋势，不作为追求覆盖率数字本身的目标：

| 范围                  | 当前证据                    |
| --------------------- | --------------------------- |
| 前端整体行覆盖率      | 约 40.6%                    |
| 前端 domain 行覆盖率  | 约 95.1%                    |
| 前端 shared 行覆盖率  | 100%（当前报告口径）        |
| Go domain 覆盖率      | 约 87.1%                    |
| Go application 覆盖率 | 约 42.0%                    |
| Go sqlite 覆盖率      | 约 65.1%                    |
| UI / composition root | 覆盖薄弱，部分关键文件为 0% |

---

## 4. 目标架构

### 4.1 限界上下文

| 上下文        | 核心职责                     | 主要模型/用例                                                   | 不拥有的职责                    |
| ------------- | ---------------------------- | --------------------------------------------------------------- | ------------------------------- |
| Catalog       | 发现和浏览音乐内容           | Track、Album、Artist、Playlist、Search、详情查询                | 播放设备、登录、HTTP 协议       |
| Playback      | 决定播放什么、以什么顺序播放 | PlayQueue、QueueItem、PlaybackSession、Repeat、Volume、播放解析 | Provider HTTP 字段、React 状态  |
| Local Library | 扫描、索引和读取设备本地音乐 | Scan、ScanResult、Folder、LocalCatalog、Lyrics                  | 网络 Provider、UI 空态          |
| Identity      | 当前用户与凭据生命周期       | Account、Session、Authenticate、Logout                          | 播放队列、具体 localStorage API |
| Engagement    | 用户与内容的关系             | Likes、Comments、PlayHistory                                    | Provider 认证实现、页面布局     |

`Engagement` 在规模不足时可以先保持为清晰模块，不强制立即成为独立包；其余四个上下文是本轮必做边界。

### 4.2 依赖与数据流

```text
React UI / Wails handlers
        │
        ▼
Application use cases / commands / queries
        │
        ├── domain aggregates + value objects
        └── context-owned ports
                  ▲
                  │ implements
NCM / QQ / Spotify / Local / SQLite / Filesystem / Web Audio / Wails
```

依赖规则：

- Domain 不依赖 React、Wails、DOM、HTTP、SQLite、Provider 实现或事件总线。
- Application 只依赖本上下文 Domain、端口和少量跨上下文公开契约。
- Infrastructure 实现端口并完成 DTO/协议映射。
- UI 只调用应用用例并消费稳定的 read model，不直接选择具体适配器。
- Composition root 是唯一知道具体实现并完成装配的位置。

### 4.3 目标目录形态

目录会按业务切片渐进形成，不做一次性搬迁：

```text
frontend/src/
  contexts/
    catalog/
      domain/
      application/
      ports/
    playback/
      domain/
      application/
      ports/
    identity/
      domain/
      application/
      ports/
    engagement/
  infrastructure/
    providers/{ncm,qqmusic,spotify,local}/
    audio/
    credentials/
  platform/wails/
  ui/
  app/                       # composition root

backend/
  library/
    domain/
    application/
  adapters/
    sqlite/
    scanner/
    lyrics/
    media/
  app/                       # Wails adapter + composition root
```

目标目录只是边界的结果，不是先决条件。一个模块只有在模型、用例、端口和测试边界已经明确时才移动。

---

## 5. 核心架构决策

### 5.1 来源限定身份

Provider 显示名不能再充当稳定身份。目标模型至少包含：

```ts
type ProviderId = string;
type TrackId = string;

type TrackKey = Readonly<{
  providerId: ProviderId;
  trackId: TrackId;
}>;
```

约束：

- `ProviderId` 是稳定机器标识；显示名称允许本地化和修改。
- Queue、History、Likes、缓存键、当前项比较统一使用来源限定 key。
- `playbackId` 是外部解析键，不等于领域实体身份。
- 播放某个队列项时按该项的 `providerId` 找解析器，不按当前浏览来源找解析器。
- 本地已解析 URL 仍保留来源身份，不能因无需请求 Provider 而省略。

### 5.2 Provider 是适配器集合，不是中心领域

逐步用最小端口替代应用层对全能 `MusicProvider` 的依赖，例如：

- `CatalogReader`
- `TrackDetailsReader`
- `PlaybackResolver`
- `LyricsReader`
- `AuthenticationGateway`
- `UserLibraryGateway`
- `CommentsReader`

一个具体 Provider 可以实现多个端口。Capability Registry 注册的是可验证的能力实现，不再依靠“字符串声明能力 + 大接口空实现”维持一致性。

### 5.3 明确查询结果语义

不把 `Result` 传遍领域实体，只在应用查询边界明确区分：

- `success(data)`：读取成功，数据可以为空。
- `unsupported`：当前来源没有该能力。
- `failed(error)`：来源宣称支持，但调用失败。
- `notFound`：查询成功，目标不存在。

UI 决定如何展示空态、不可用和错误；Provider 与应用服务不能替 UI 静默抹掉语义。

### 5.4 扫描是有一致性等级的用例

扫描结果必须表达完整性：

- `complete`：根目录和所有需要遍历的目录均完成，可执行 prune。
- `partial`：允许保存成功读取的元数据，禁止根据缺失项执行删除。
- `failed`：根目录不可访问或用例被取消，不写入权威结果。

数据库 prune 与扫描完成状态必须处于同一个应用用例和事务决策中。

### 5.5 命令、事件和状态

- 命令：由外向内直接调用一个明确用例，有返回值或明确错误。
- 领域事件：已经发生的领域事实，只有存在真实多订阅者或跨模块解耦价值时使用。
- UI 状态：由事件/read model 投影，不反向成为领域事实。
- 不为了“DDD”给每个 setter 创建事件，也不建设通用命令总线。

### 5.6 应用用例—端口消费矩阵（P2-01）

该矩阵以当前真实调用点为准，是 Phase 2 拆端口的约束：一个用例只能获得表中列出的最小能力；“当前语义”记录迁移前事实，“目标语义”是 P2-02～P2-06 的验收依据。Provider 身份/选择由独立的 `SourceRegistry` 概念承担，不重复塞进每个业务端口。

#### Catalog / Engagement 查询

| 应用用例      | 当前消费                                              | 最小目标端口              | 当前失败语义                                                  | 目标结果语义                                                   |
| ------------- | ----------------------------------------------------- | ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| 首页推荐      | `personalized()`                                      | `CatalogHomePort`         | 异常向 UI 抛出；空数据与无推荐相同                            | `success(data)` / `failed(error)`                              |
| 歌单详情      | `playlistDetail(id)`                                  | `PlaylistReader`          | not-found 常由空壳 Playlist 表示；异常抛出                    | `success` / `notFound` / `failed`                              |
| 专辑详情      | `albumDetail(id)`                                     | `AlbumReader`             | not-found 与空专辑不稳定；异常抛出                            | `success` / `notFound` / `failed`                              |
| 艺术家详情    | `artistDetail(id)`                                    | `ArtistReader`            | not-found 与空 Artist 不稳定；异常抛出                        | `success` / `notFound` / `failed`                              |
| 单曲/批量详情 | `supports(trackDetail)` + `trackDetail(s)`            | `TrackReader`             | unsupported/failed/not-found 都可能退化为空                   | `success` / `unsupported` / `notFound` / `failed`              |
| 搜索          | `supports(search)` + `search(query)`                  | `CatalogSearchPort`       | 空查询、unsupported、failed、零结果都返回空集合（失败仅日志） | `success(results)` / `unsupported` / `failed`                  |
| 榜单列表/详情 | `supports(toplist)` + `toplists/toplistDetail`        | `ChartReader`             | unsupported/failed 均返回空列表或空壳                         | `success` / `unsupported` / `notFound` / `failed`              |
| MV 详情       | `supports(musicVideoDetail)` + `musicVideoDetail`     | `MusicVideoReader`        | unsupported/failed/not-found 均为 `undefined`                 | `success` / `unsupported` / `notFound` / `failed`              |
| 艺术家 MV     | `supports(artistMusicVideos)` + `artistMusicVideos`   | `ArtistMusicVideoReader`  | unsupported/failed 均为空列表                                 | `success` / `unsupported` / `failed`                           |
| MV 发现       | `ArtistMusicVideoReader` 多次调用                     | 同上（应用层编排）        | 单个 seed 失败被记录并保留部分结果                            | `success` / `partial(data, errors)` / `unsupported` / `failed` |
| 歌曲评论      | `supports(comments)` + `comments`                     | `TrackCommentReader`      | unsupported/failed/零评论均为空列表                           | `success` / `unsupported` / `failed`                           |
| MV 评论       | `supports(musicVideoComments)` + `musicVideoComments` | `MusicVideoCommentReader` | unsupported/failed/零评论均为空列表                           | `success` / `unsupported` / `failed`                           |

#### Playback / reactive runtime

| 应用用例      | 当前消费                                                              | 最小目标端口                                    | 当前失败语义                                          | 目标结果语义                                                                 |
| ------------- | --------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| 播放 URL 解析 | `ProviderRegistry.get(id)`、`supports(full/preview)`、`playUrls(ids)` | `PlaybackResolverRegistry` + `PlaybackResolver` | 来源缺失或解析失败记录日志，仍以未解析 Track 切队列   | `resolved` / `unsupported` / `sourceUnavailable` / `failed`                  |
| 队列命令      | `PLAY_QUEUE` capability                                               | `QueueCommandPort`                              | capability 缺失抛出组合错误                           | 命令成功；装配缺失 fail-fast                                                 |
| 音频传输      | `TRANSPORT` capability                                                | `AudioOutputPort`                               | capability 缺失抛出组合错误；浏览器播放失败由插件处理 | `started` / `blocked` / `failed`                                             |
| 进度/音量     | `PROGRESS`、`VOLUME_CONTROL`                                          | `ProgressPort`、`VolumePort`                    | capability 缺失抛出组合错误                           | 命令成功；装配缺失 fail-fast                                                 |
| 当前曲目歌词  | `SourceRegistry.get(track.providerId)` + `lyric(id)`                  | `LyricReaderRegistry` + `LyricReader`           | 来源缺失/unsupported/failed 均广播空歌词              | `success` / `unsupported` / `sourceUnavailable` / `failed`（事件投影可为空） |

#### Identity / User Library

| 应用用例           | 当前消费                                      | 最小目标端口                                      | 当前失败语义                                   | 目标结果语义                                       |
| ------------------ | --------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| 登录能力判断       | `isAuthProvider(active)`                      | `AuthPort?` 解析                                  | 无实现即 unsupported                           | `supported` / `unsupported`                        |
| 开始登录/账户/退出 | `AuthProvider` + `CredentialStore`            | `AuthPort` + `CredentialPort`                     | unsupported 同步抛错；远端错误透传             | `success` / `unsupported` / `cancelled` / `failed` |
| 登录状态           | `CredentialStore.get(providerId)`             | `SessionReader`                                   | 无 session 返回 false                          | `authenticated` / `anonymous`                      |
| 喜欢列表/切换喜欢  | `UserLibrary.likedTrackIds/setLiked`          | `LikesPort`                                       | unsupported 同步抛错；远端错误透传给 hook 回滚 | `success` / `unsupported` / `failed`               |
| 用户歌单           | `UserLibrary.userPlaylists`                   | `UserPlaylistReader`                              | unsupported 同步抛错；远端错误透传             | `success` / `unsupported` / `failed`               |
| 播放记录/每日推荐  | `UserLibrary.playRecord/dailyRecommendations` | `ListeningHistoryReader` / `RecommendationReader` | unsupported 同步抛错；远端错误透传             | `success` / `unsupported` / `failed`               |

拆分顺序固定为：先定义只读最小端口并让 `MediaService` 依赖组合后的 Catalog source；再拆 Playback resolver；随后迁移 Identity/User Library；能力是否存在最终由“端口能否解析”证明。P2-06 引入稳定结果类型后，才删除当前 fallback 兼容语义和 capability 字符串。

---

## 6. 分阶段实施计划

### Phase 0 — 安全与工程基线

目标：先消除可能造成数据错误或资源风险的问题，并确保后续结构性改造有稳定门禁。

- [x] **P0-01 扫描完整性**：根目录失败必须报错；子树错误产生 partial；只有 complete 扫描可以 prune。
- [x] **P0-02 扫描一致性测试**：覆盖目录消失、无权限/模拟遍历错误、取消、完整删除四类场景。
- [x] **P0-03 Go 生命周期**：`App` 持有并关闭 catalog、media server；初始化失败释放已打开资源；接入 Wails shutdown。
- [x] **P0-04 媒体代理收口**：增加会话保护、HTTP 超时、redirect 策略和目标地址限制；补安全测试。
- [x] **P0-05 ProviderRegistry 契约修复**：稳定 `ProviderId`；未知来源不改变状态、不广播事件。
- [x] **P0-06 统一质量入口**：根目录提供唯一 `make check`/等价入口，包含 Go、前端 `build`、测试和架构检查。
- [ ] **P0-07 CI**：workflow 已创建并复用 `make check`；首次 GitHub 远程运行证据待代码推送后补齐。
- [x] **P0-08 工程身份清理**：使用正式 Go module 路径；只保留一个前端 lockfile；修正文档中的质量命令和过期 Mock 说明。

退出条件：P0 测试全绿；不完整扫描不会 prune；应用退出后端口和数据库被正确关闭；CI 可重复执行。

### Phase 1 — 来源限定身份

目标：先修正最关键的领域身份，再进行目录和端口重组。

- [x] **P1-01 ProviderId 值对象/品牌类型**：机器 id 与显示名分离。（作为 P0-05 地基提前完成）
- [x] **P1-02 TrackKey / AlbumKey / ArtistKey**：定义比较、序列化和边界构造规则。
- [x] **P1-03 Mapper 接入**：所有 Provider mapper 在边界生成来源限定身份。
- [x] **P1-04 Queue 聚合迁移**：去重、选择、插队、删除、up-next 全部按 TrackKey 工作。
- [x] **P1-05 播放解析迁移**：队列项保留来源，按来源选择 PlaybackResolver。
- [x] **P1-06 Read model 迁移**：History、Likes、当前播放判断、React Query key 使用稳定 key。
- [x] **P1-07 切源测试**：覆盖旧队列继续播放、不同来源相同裸 id、快速切源和异步解析竞争。

退出条件：代码中不存在用裸 `track.id` 表达跨来源身份的关键路径；切换浏览来源不会改变已有队列项的解析来源。

### Phase 2 — 拆分端口与应用用例

目标：让每个用例只依赖真正需要的能力，逐步退出全能 `MusicProvider`。

- [x] **P2-01 端口消费矩阵**：列出每个应用用例实际需要的方法和失败语义。
- [x] **P2-02 Catalog 端口**：抽出浏览、详情、搜索等最小读端口。
- [x] **P2-03 Playback 端口**：抽出 URL/SDK 解析与音频输出端口。
- [x] **P2-04 Identity/Library 端口**：认证、凭据、用户库能力分离。
- [x] **P2-05 Capability 注册重构**：能力由端口实现本身证明，消除字符串与空方法的双重真相源。
- [x] **P2-06 查询结果语义**：应用边界区分 success/unsupported/failed/notFound。
- [x] **P2-07 Provider 契约测试**：同一端口的所有 Provider 适配器运行共享契约测试。
- [x] **P2-08 删除旧大接口**：消费方归零后删除 `MusicProvider` 和无意义空默认实现。（随 P2-05 无兼容层迁移提前完成）

退出条件：核心应用服务不再接收全能 Provider；新增 Provider 能力不需要修改无关适配器。

### Phase 3 — 限界上下文落地

目标：将已经稳定的业务边界体现在代码组织和公开 API 上。

- [x] **P3-01 Playback Context**：聚合、用例、端口和运行时适配器形成独立公开面。
- [x] **P3-02 Catalog Context**：区分实体/reference/detail snapshot，减少跨边界 `Partial<T>`。
- [x] **P3-03 Identity Context**：Account、Session、CredentialPort 与具体存储解耦。
- [x] **P3-04 Local Library Context**：Go 与前端 Local adapter 使用明确的应用契约和错误码。
- [x] **P3-05 Engagement 模块**：Likes、Comments、History 明确归属；是否独立上下文按实际规则复杂度决定。
- [x] **P3-06 跨上下文契约**：只导出稳定 key、reference、command/query DTO 或事件，不共享可变聚合。
- [x] **P3-07 目录迁移**：在边界稳定后迁移目录、别名和分层检查规则。

退出条件：新增一个 Catalog 能力无需触碰 Playback 内部；各上下文存在明确入口，跨上下文不能任意深层 import。

### Phase 4 — 基础设施与运行时解耦

目标：让外部系统真正成为可替换适配器，并提升桌面端可靠性。

- [x] **P4-01 AudioPort**：Kernel 不直接 `new Audio()` / `new AudioContext()`，由 Web Audio adapter 注入。
- [x] **P4-02 可控依赖**：时间、随机数等影响领域测试确定性的依赖按需注入，不做全局容器。
- [x] **P4-03 Go Context**：扫描、数据库和 HTTP 路径传递 `context.Context`，支持取消和超时。
- [x] **P4-04 错误体系**：Go 定义 not-found/unavailable/incomplete/cancelled 等应用错误，Wails adapter 统一投影。
- [x] **P4-05 Schema migration**：SQLite schema 使用可追踪版本迁移，禁止只靠 `CREATE TABLE IF NOT EXISTS` 假定兼容。
- [x] **P4-06 组合根测试**：验证插件/端口装配、启动失败回滚和 shutdown。

退出条件：Domain/Application 单测不需要真实 DOM/Wails/SQLite；运行时资源均有所有者和对称释放路径。

### Phase 5 — 质量收口与文档归一

目标：用自动化证据证明架构已经落地，删除过渡结构。

- [x] **P5-01 架构规则升级**：检查上下文公开面、禁止跨上下文深层 import、禁止内层依赖基础设施。
- [x] **P5-02 覆盖率阈值**：为 domain/application/critical adapters 分层设置合理阈值，不用全局数字掩盖关键空白。
- [x] **P5-03 核心 E2E**：启动、浏览并播放、切换来源后继续旧队列、本地扫描、退出清理。
- [x] **P5-04 删除过渡代码**：旧目录、兼容类型、旧 Provider API、重复 DTO 和废弃事件全部归零。
- [x] **P5-05 更新架构总览**：`doc/architecture.md` 反映最终结构、依赖和运行时数据流。
- [x] **P5-06 完成审计**：逐项核对本文完成定义，并附命令与测试证据。

退出条件：本文完成定义全部有代码和自动化证据支持；文档、测试、脚本与真实架构一致。

---

## 7. 实施纪律

每个任务遵循以下固定流程：

1. 在本文领取一个任务编号，写清当前问题和本批不变量。
2. 先补能证明问题的测试，或记录为什么无法先写测试。
3. 计算爆炸半径：类型、Provider、UI、Wails DTO、数据库和文档消费方。
4. 在问题所属的正确层修复，不在调用点增加长期兼容 shim。
5. 运行与改动范围相匹配的测试；批次结束运行统一全量门禁。
6. 更新本文任务状态、验证证据、决策和剩余风险。
7. 每个 commit 保持可独立解释、可独立回滚；行为修复与纯移动尽量分开。

### 7.1 状态定义

| 状态      | 含义                                   |
| --------- | -------------------------------------- |
| `TODO`    | 尚未开始                               |
| `DOING`   | 当前正在实施，必须注明分支/批次        |
| `BLOCKED` | 存在明确外部阻塞，必须记录解除条件     |
| `DONE`    | 实现、测试、全量门禁和文档同步均已完成 |
| `DROPPED` | 经决策明确不做，必须写原因和影响       |

### 7.2 架构不变量

- 不允许以“保持兼容”为理由长期并存两套身份或两套 Provider API。
- 不允许把 Provider DTO 直接暴露给 Domain 或 UI。
- 不允许用空数组掩盖宣称支持却调用失败的能力。
- 不允许 `Partial<T>` 穿过多个层级后再由 UI 猜测完整性。
- 不允许基础设施错误改变领域事实；例如读取失败不能等价为文件已经删除。
- 不允许用新目录名掩盖旧依赖方向；边界必须由导入规则和测试证明。
- 不允许为了覆盖率编写不验证行为的测试。

---

## 8. 进度台账

### 8.1 总体进度

| 阶段                   | 状态    | 完成度 | 当前说明                                                           |
| ---------------------- | ------- | -----: | ------------------------------------------------------------------ |
| Roadmap                | DONE    |   100% | 已建立目标、任务、验收和进度基线                                   |
| Phase 0 安全与工程基线 | BLOCKED |    88% | 实现全部落地；P0-07 首次远程 CI 证据需要提交并推送后取得           |
| Phase 1 来源限定身份   | DONE    |   100% | P1-01～P1-07 全部完成；身份、队列、解析和 UI read model 均来源限定 |
| Phase 2 端口与用例     | DONE    |   100% | P2-01～P2-08 全部完成；最小端口、结果语义和共享契约均有自动化证据  |
| Phase 3 限界上下文     | DONE    |   100% | P3-01～P3-07 全部完成；公开面位于 contexts 并受静态规则保护        |
| Phase 4 基础设施解耦   | DONE    |   100% | Audio/可控依赖/Context/错误/migration/组合根均有自动化证据         |
| Phase 5 质量收口       | DONE    |   100% | 规则、覆盖率、E2E、过渡清理、架构文档和最终审计全部完成            |

### 8.2 当前工作队列

| 顺序 | 任务                                     | 状态    | 依赖         | 验证证据                                                                        |
| ---: | ---------------------------------------- | ------- | ------------ | ------------------------------------------------------------------------------- |
|    1 | P0-01 扫描完整性模型与 prune 规则        | DONE    | 无           | domain/application/sqlite/scan 测试；全量门禁通过                               |
|    2 | P0-02 扫描异常/取消测试                  | DONE    | P0-01        | 根失败、局部失败、取消、完整 prune 测试通过                                     |
|    3 | P0-03 Go 生命周期与 shutdown             | DONE    | 无           | 初始化回滚、逆序关闭、幂等关闭和端口释放测试通过                                |
|    4 | P0-04 媒体代理安全收口                   | DONE    | P0-03        | token、私网/DNS 阻断、redirect、timeout、Range 测试通过                         |
|    5 | P0-05 ProviderRegistry 契约与 ProviderId | DONE    | 无           | Registry 未知/重复选择测试；凭据、缓存、设置按 ProviderId 工作                  |
|    6 | P0-06 统一质量入口                       | DONE    | 无           | 冻结依赖安装后 `make check` 通过                                                |
|    7 | P0-07 CI                                 | BLOCKED | P0-06        | workflow YAML 与预提交边界审计通过；等待授权建分支、提交、推送并取得远程证据    |
|    8 | P0-08 工程身份清理                       | DONE    | 无           | 正式 module；仅 yarn.lock；README/架构命令已同步                                |
|    9 | P1-01 ProviderId 值对象                  | DONE    | P0-05        | 稳定机器身份与展示名分离；持久化命名空间已迁移                                  |
|   10 | P1-02 来源限定实体 Key                   | DONE    | P1-01        | 品牌类型、严格构造/解析和特殊字符往返测试通过                                   |
|   11 | P1-03 Mapper 接入                        | DONE    | P1-01        | 四个 Provider 的实体及嵌套引用均写入 ProviderId；UI 回投影拒绝无来源实体        |
|   12 | P1-04 Queue 聚合迁移                     | DONE    | P1-02/P1-03  | 聚合与插件按 TrackKey 去重/选择/插队/删除/up-next；跨源同裸 id 测试通过         |
|   13 | P1-05 播放解析迁移                       | DONE    | P1-04        | 按队列项来源并行选择解析器；来源限定 URL 回填；旧来源/混合队列测试通过          |
|   14 | P1-06 Read model 迁移                    | DONE    | P1-05        | History/Likes/当前态/菜单/拖拽入队使用 TrackKey；实体 Query key 均含 ProviderId |
|   15 | P1-07 切源测试                           | DONE    | P1-06        | 旧队列、跨源同 id、跨源竞态和歌词来源测试通过                                   |
|   16 | P2-01 端口消费矩阵                       | DONE    | Phase 1      | 路线图 §5.6 记录 Catalog/Playback/Identity/Library 的真实消费与目标语义         |
|   17 | P2-02 Catalog 端口                       | DONE    | P2-01        | MediaService 仅依赖 CatalogSource；类型测试排除播放/歌词/认证/用户库            |
|   18 | P2-03 Playback 端口                      | DONE    | P2-01        | PlaybackService 仅依赖 PlaybackResolverRegistry；TRANSPORT 使用 AudioOutputPort |
|   19 | P2-04 Identity/Library 端口              | DONE    | P2-02/P2-03  | AuthService/LibraryService 仅依赖独立 source port；凭据继续单独注入             |
|   20 | P2-05 Capability 注册重构                | DONE    | P2-02～P2-04 | MusicSource 由实际端口槽位组成；UI availability 从 CatalogPorts 投影            |
|   21 | P2-08 删除旧大接口                       | DONE    | P2-05        | MusicProvider/ProviderCapability、supports 与空可选默认实现全部归零             |
|   22 | P2-06 查询结果语义                       | DONE    | P2-05        | QueryResult 显式区分 success/partial/unsupported/notFound/failed                |
|   23 | P2-07 Provider 契约测试                  | DONE    | P2-05/P2-06  | 四个真实来源运行共享端口注册契约；静态守卫阻止旧 API 回流                       |
|   24 | P3-01 Playback Context                   | DONE    | Phase 2      | 聚合、用例、端口和运行时适配器形成受守卫的独立公开面                            |
|   25 | P3-02 Catalog Context                    | DONE    | P3-01        | 区分 entity/reference/detail snapshot，减少跨层 Partial<T>                      |
|   26 | P3-03 Identity Context                   | DONE    | P3-02        | Account、Session、认证用例和凭据端口形成独立公开面                              |
|   27 | P3-04 Local Library Context              | DONE    | P3-03        | Go/Wails/Local adapter 使用明确应用契约、结果与错误语义                         |
|   28 | P3-05 Engagement 模块                    | DONE    | P3-04        | Likes、Comments、History 明确归属并建立稳定入口                                 |
|   29 | P3-06 跨上下文契约                       | DONE    | P3-05        | 只公开稳定 key/reference/command/query DTO，阻止共享内部聚合                    |
|   30 | P3-07 目录迁移                           | DONE    | P3-06        | 稳定公开面迁入 contexts，更新别名/分层规则并删除旧入口                          |
|   31 | P4-01 AudioPort                          | DONE    | Phase 3      | AudioRuntimePort 由 WebAudioRuntime 实现；Kernel 构造器访问受静态守卫保护       |
|   32 | P4-02 可控依赖                           | DONE    | P4-01        | PlayQueue 注入 RandomSource；Go 扫描持久化注入 Clock；内层全局访问受守卫        |
|   33 | P4-03 Go Context                         | DONE    | P4-02        | Wails/HTTP→application→scanner/SQLite 全链路传递 Context；取消可回滚            |
|   34 | P4-04 错误体系                           | DONE    | P4-03        | Go ErrorCode/cause 与 Wails wire error 分离；前端统一解析类型化错误             |
|   35 | P4-05 Schema migration                   | DONE    | P4-04        | user_version 顺序事务迁移；兼容无版本旧库；校验结构并拒绝未来版本               |
|   36 | P4-06 组合根测试                         | DONE    | P4-05        | 真实 Provider/插件/端口图、失败回滚、监听撤销和后端 shutdown 均已验证           |
|   37 | P5-01 架构规则升级                       | DONE    | Phase 4      | contexts 只许公开入口；Wails/基础设施/环境依赖边界受守卫；清理过期 allowlist    |
|   38 | P5-02 覆盖率阈值                         | DONE    | P5-01        | Domain/Application/Local/Web Audio 分层阈值进入默认 test 门禁                   |
|   39 | P5-03 核心 E2E                           | DONE    | P5-02        | 双来源真实 Engine 流与真实 Scanner→SQLite→Wails 流覆盖启动、切源和退出          |
|   40 | P5-04 删除过渡代码                       | DONE    | P5-03        | 旧目录/旧 API 搜索归零；删除死事件；旧路径与事件加入架构防回流规则              |
|   41 | P5-05 更新架构总览                       | DONE    | P5-04        | 最终上下文、依赖 DAG、组合根、前后端运行流、错误/资源和质量门禁已对齐源码       |
|   42 | P5-06 完成审计                           | DONE    | P5-05        | DoD-01～08 已逐项映射证据；只保留 P0-07/远程 CI 外部缺口                        |

### 8.3 已完成记录

| 日期       | 任务          | 结果                                                                                                                                                                                                                                                                                                               | 验证                                                                                                                                                  |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-11 | Roadmap       | 创建本执行基线，确认现状、目标架构、阶段和完成定义                                                                                                                                                                                                                                                                 | 文档审阅；与当前源码和质量门禁结果核对                                                                                                                |
| 2026-07-11 | P0-01 / P0-02 | 引入完整/部分扫描快照；不完整观察无 prune 权限；partial 状态透传至 UI                                                                                                                                                                                                                                              | `make check`、`go test -race ./backend/...`、`yarn run check`、`yarn build`                                                                           |
| 2026-07-11 | P0-03 / P0-04 | App 对称管理 SQLite/HTTP 生命周期；stream 代理增加会话认证、SSRF/DNS 防护和超时策略                                                                                                                                                                                                                                | `make check`、`go test -race ./backend/...`、`yarn run check`、`yarn build`                                                                           |
| 2026-07-11 | P0-05 / P1-01 | 引入品牌化稳定 ProviderId；Registry、凭据、缓存和设置页脱离展示名称                                                                                                                                                                                                                                                | 87 个测试文件、410 个测试；全量门禁与生产构建通过                                                                                                     |
| 2026-07-11 | P0-06 / P0-08 | 统一 `make check`；正式 Go module；Yarn 单锁；修复 README/架构命令                                                                                                                                                                                                                                                 | 冻结 Yarn 安装、workflow YAML、`make check` 通过                                                                                                      |
| 2026-07-11 | P1-02         | 定义 TrackKey/AlbumKey/ArtistKey 品牌类型、保真序列化与严格解析规则                                                                                                                                                                                                                                                | 88 个测试文件、422 个测试；`make check` 通过                                                                                                          |
| 2026-07-11 | P1-03         | Track/Album/Artist/Playlist/MV/Chart 强制携带 ProviderId；NCM/QQ/Spotify/Local mapper 及嵌套引用在防腐层写入来源；ProviderId 下沉为独立领域值对象，避免实体反向依赖端口；UI placeholder 不再伪造无来源领域 Track                                                                                                   | 88 个测试文件、423 个测试；循环依赖仅剩原有 allowlist 3 条；分层检查、Go race、生产构建及 `make check` 通过                                           |
| 2026-07-11 | P1-04         | PlayQueue 的输入去重、起播选择、select/add/addNext/remove、shuffle anchor 和 up-next 全部改用 TrackKey；插件事件流保留跨源同裸 id 项                                                                                                                                                                               | 88 个测试文件、428 个测试；领域队列覆盖跨 Provider 冲突；`make check` 通过                                                                            |
| 2026-07-11 | P1-05         | ProviderRegistry 增加稳定 id 只读解析；PlaybackService 按队列来源分组并行解析；URL 结果按 `(ProviderId, playbackId)` 回填；PlaybackIntent 当前项按 TrackKey 匹配                                                                                                                                                   | 88 个测试文件、431 个测试；覆盖切源后旧队列和混合来源相同 playbackId；`make check` 通过                                                               |
| 2026-07-11 | P1-06         | 建立 VibeTrack→TrackKey UI 边界；History、Likes、当前播放态、播放上下文、菜单、拖拽/批量入队迁移来源限定身份；匿名 Like 合并按 ProviderId 隔离；审计 Query key                                                                                                                                                     | 88 个测试文件、433 个测试；跨源同裸 id 的历史、当前态、Like、队列交互与缓存命名空间测试通过；`make check` 通过                                        |
| 2026-07-11 | P1-07         | 增加旧来源队列续播、同 playbackId URL 隔离、快速跨来源异步解析竞态测试；Lyrics 按曲目来源解析并以 TrackKey 去重                                                                                                                                                                                                    | 88 个测试文件、435 个测试；Go race、前端全检、架构规则和生产构建均由 `make check` 验证                                                                |
| 2026-07-11 | P2-01         | 以真实应用调用点建立用例—最小端口—当前失败语义—目标结果语义矩阵，并固定 Catalog→Playback→Identity/Library 的拆分顺序                                                                                                                                                                                               | 路线图 §5.6 与 MediaService/AuthService/LibraryService/PlaybackService/Provider ports 逐项核对                                                        |
| 2026-07-11 | P2-02 / P2-03 | 提取 source identity、Catalog 最小读端口、PlaybackResolverRegistry 和 AudioOutputPort；MediaService/PlaybackService 不再依赖全能 MusicProvider，DOM Audio 插件实现输出端口                                                                                                                                         | 90 个测试文件、437 个测试；Catalog/Playback 负类型边界测试、循环/分层检查、生产构建及 `make check` 通过                                               |
| 2026-07-11 | P2-04         | 提取 ActiveAuthSource/AuthSourcePort 与 ActiveUserLibrarySource/UserLibrarySourcePort；AuthService/LibraryService 退出 MusicProvider；组合根负责把来源适配为可选身份与用户库端口                                                                                                                                   | 90 个测试文件、437 个测试；能力服务测试、类型检查、循环/分层检查、生产构建及 `make check` 通过                                                        |
| 2026-07-11 | P2-05 / P2-08 | Registry 改存由实际 Catalog/Playback/Lyrics/Auth/User Library 端口组成的 MusicSource；删除能力字符串、supports、MusicProvider、空可选默认实现及 Spotify 空歌词方法；UI 门控从 CatalogPorts 投影 availability                                                                                                       | 91 个测试文件、438 个测试；旧 API 源码搜索归零；Go race、静态/格式/Knip/循环/分层检查、生产构建及 `make check` 通过                                   |
| 2026-07-11 | P2-06         | 应用查询边界增加 QueryResult，区分 success/partial/unsupported/notFound/failed；失败保留来源、操作与 cause；UI 统一决定空态、部分数据和错误路径，不让 Result 渗入领域端口                                                                                                                                          | 93 个测试文件、443 个测试；四类结果、partial 与 UI 投影测试；Go race、前端全检、架构规则、生产构建及 `make check` 通过                                |
| 2026-07-11 | P2-07         | Local/NCM/QQ/Spotify 运行同一套来源注册契约，验证稳定身份、实际 Catalog 端口、Playback 空输入、Lyrics/Auth/Library 装配；分层脚本禁止旧 Provider API 与应用用例依赖 MusicSource 组合回流                                                                                                                           | 94 个测试文件、447 个测试；共享契约、类型负向测试、增强架构守卫、生产构建及 `make check` 通过                                                         |
| 2026-07-11 | P3-01         | 建立 `@core/playback` 稳定公开面，集中导出 Playback 聚合/值对象、用例、最小端口和命名后的运行时适配器；UI 与组合根退出领域/插件深层导入；分层脚本禁止绕过公开面                                                                                                                                                    | 95 个测试文件、448 个测试；公开面负类型测试、Knip 收口、循环/分层守卫、生产构建及 `make check` 通过                                                   |
| 2026-07-11 | P3-02         | 建立 `@core/catalog` 稳定公开面；区分 Album/Artist/Playlist/MV 的 summary/reference/detail snapshot；Catalog、Library、Provider mapper 与 UI 投影退出跨边界 `Partial<T>`；缺失详情明确返回 notFound；静态守卫禁止 UI 绕过公开面                                                                                    | 96 个测试文件、450 个测试；Catalog 端口精确类型测试、公开面负类型测试、Knip/循环/分层守卫、Go race、生产构建及 `make check` 通过                      |
| 2026-07-11 | P3-03         | 建立 `@core/identity` 公开面；AuthProvider/AuthService 收敛为 IdentityGateway/IdentityService；运行时组合和 UI 改走 identity；Account 边界退出 Partial；AuthSession 增加运行时恢复校验；远端退出失败时仍清理本地会话；静态守卫禁止 UI 绕过公开面                                                                   | 100 个测试文件、457 个测试；Identity 端口/公开面负类型、Session/凭据损坏恢复和退出清理测试；Knip/循环/分层守卫、Go race、生产构建及 `make check` 通过 |
| 2026-07-11 | P3-04         | Go application 详情查询改为显式 optional；Wails 详情 DTO 使用 found/notFound，扫描 DTO 使用 cancelled/partial/complete；建立 `@core/local-library` 跨语言契约；Local adapter 对缺失 bridge 抛 unavailable，UI 的 Wails 调用收口到单一适配器并由静态规则守卫                                                        | 102 个测试文件、462 个测试；application/Wails 投影、Local adapter、扫描状态与公开面测试；Knip/循环/分层守卫、Go race、生产构建及 `make check` 通过    |
| 2026-07-11 | P3-05         | 从 Catalog/UserLibrary 中提取 EngagementPorts 与 EngagementService，统一 Likes/Comments/PlayRecord 的 availability 和 QueryResult；NCM 失败不再静默为空；UI 改走 `@core/engagement`；session-local history 明确保留为 UI 投影；Identity 切源重新同步登录态                                                         | 105 个测试文件、468 个测试；Engagement 端口/服务/公开面、Provider 注册与 NCM 失败语义测试；Knip/循环/分层守卫、Go race、生产构建及 `make check` 通过  |
| 2026-07-11 | P3-06         | 建立稳定跨上下文 contracts 与 Account Library 入口；UI 生产代码对 `@domain` 深层导入归零；ProviderId/TrackKey/QueryResult、Track/Image、Lyric/Progress 均经归属公开面消费；`@core` 根入口停止重导出上下文；静态规则阻止根 barrel/领域路径回流                                                                      | 107 个测试文件、470 个测试；各上下文和 contracts 负类型测试、import 图审计；Knip/循环/分层守卫、Go race、生产构建及 `make check` 通过                 |
| 2026-07-11 | P3-07         | 将 Catalog/Playback/Identity/Engagement/Local Library/Account Library/contracts 公开面迁入 `src/contexts`；新增 `@contexts/*` 的 TS/Vite 双别名；75 个调用点迁移；删除旧 core 入口；contexts 纳入分层图并禁止旧路径                                                                                                | 107 个测试文件、469 个测试；7 个 contexts 公开面测试、旧路径/领域导入搜索归零；Knip/循环/分层守卫、Go race、生产构建及 `make check` 通过              |
| 2026-07-11 | P4-01         | 定义 Kernel `AudioRuntimePort`，由 `infrastructure/audio` 的 `WebAudioRuntime` 创建主播放、分析探针与 AudioContext；组合根显式注入；Planet 在正常关闭、插件安装失败和依赖校验失败时对称释放且幂等；core 中浏览器音频构造归零并由静态规则守卫                                                                       | 109 个测试文件、473 个测试；资源身份/幂等释放/失败回滚/Web Audio adapter 测试；Knip/循环/分层守卫、Go race、生产构建及 `make check` 通过              |
| 2026-07-11 | P4-02         | PlayQueue 聚合显式依赖 RandomSource，SystemRandom 只在组合根装配；共享 shuffle/getRandomInt 改为调用方传入熵源；Go 本地库应用服务显式依赖 Clock，扫描保存时间可精确验证；静态规则禁止 frontend domain/application 重新读取环境时钟或随机源                                                                         | 109 个测试文件、474 个测试；固定熵洗牌顺序、固定扫描时间戳与公开端口测试；Knip/循环/分层守卫、Go race、生产构建及 `make check` 通过                   |
| 2026-07-11 | P4-03         | Catalog/Lyric/FolderPicker/Media Source 端口显式接收 context；Wails 生命周期 context 经 Library adapter 传入 application；SQLite 全部使用 BeginTx/QueryContext/ExecContext；扫描写门改为可取消信号量；文件解析前后检查取消；HTTP 流代理沿请求 context 取消上游                                                     | 109 个前端测试文件、474 个前端测试；Go 增加等待写门取消、SQLite 事务回滚、sidecar 取消、HTTP 上游取消测试；全量 `make check` 通过                     |
| 2026-07-11 | P4-04         | 建立 Go ErrorCode（unavailable/notFound/incomplete/cancelled/failed）与保留 cause 的应用错误；Wails 只投影稳定 `code + operation`，不泄漏 SQLite/路径文本；扫描 cancelled、详情 notFound、扫描 incomplete 继续作为正常结果；Local Library 前端契约统一解析为 LocalLibraryError，畸形错误 fail-closed               | 109 个测试文件、477 个测试；Go 分类/cause/wire 投影/降级测试，前端协议解析与扫描映射测试；全量 `make check` 通过                                      |
| 2026-07-11 | P4-05         | SQLite 以 PRAGMA user_version 管理 v1/v2 顺序迁移；DDL 与版本写入同事务；启动后验证必需列；接管旧程序留下的无版本完整 schema；高于程序版本的数据库明确拒绝                                                                                                                                                         | 全新库、v1 升级、无版本旧库、幂等重开、未来版本、失败回滚、结构不兼容测试；全量 `make check` 通过                                                     |
| 2026-07-11 | P4-06         | 把真实 Planet 图提取为显式依赖的 composePlanet；以 Local Provider 装配 Playback/Queue/Volume/Progress/AudioEngine/ProviderRegistry/Lyrics/StoreBridge；验证端口注册、active source、DOM 监听对称撤销、能力清空和扩展启动失败全图回滚；Go openInfra/App 测试继续覆盖半启动回滚、HTTP→SQLite 逆序关闭和幂等 shutdown | 110 个测试文件、479 个测试；前端覆盖率 47.37%；全量 `make check` 通过                                                                                 |
| 2026-07-11 | P5-01 / P5-02 | 分层脚本禁止跨 context 深层 import、非批准 Wails 入口、旧 context 路径和内层环境依赖；清理一个已消失的循环 allowlist；Vitest 对 Domain、Application、Local Provider、Local Library contract、Web Audio adapter 分别设置语句/函数/分支/行阈值                                                                       | 110 个测试文件、479 个测试；Domain 94.32/95.31/86.46，Application 66.24/59.04/72.60，Local 95%+；全量 `make check` 通过                               |
| 2026-07-11 | P5-03         | 前端以两个可控来源贯通真实 composePlanet/Engine/Media/Playback/插件图，覆盖浏览、播放、切源后旧队列续播和幂等退出；后端以真实 WAV 临时目录贯通 Scanner→Application→SQLite→Wails 读取和关闭；同时修复并回归保护待决 `audio.play()` 在销毁后访问插件上下文的竞态                                                     | 111 个前端测试文件、481 个测试；后端 E2E 在 race detector 下通过；分层覆盖率、架构规则、生产构建与全量 `make check` 通过                              |
| 2026-07-11 | P5-04         | 删除 7 个已迁空的 `core/<context>` 目录和无生产订阅者的 `provider:changed` 死事件；修正文档注释；确认 Wails 生成类型是 Go wire DTO 的生成投影而非手写重复契约；把旧 context 路径和已删除事件纳入全局架构守卫                                                                                                       | 旧 Provider API、旧 context 路径、死事件和空目录搜索归零；Knip、分层/循环检查、111/481 测试、Go race、生产构建及全量 `make check` 通过                |
| 2026-07-11 | P5-05         | `doc/architecture.md` 按最终源码更新：明确 context 公开面与内部物理实现的区别、真实依赖 DAG、composePlanet/Engine 数据流、本地库 Context/事务/错误/迁移/退出链路、Web Audio 资源所有权、分层覆盖率和核心 E2E                                                                                                       | 与 contexts/app/core/infrastructure/providers、backend 各层、Makefile、架构脚本和 workflow 逐项核对；Markdown 格式与 `git diff --check` 通过          |
| 2026-07-11 | P5-06         | 审计 §1.2 八条完成定义并建立 DoD-01～08 证据表；确认实现、边界、运行时可靠性、文档和本地门禁均完成；没有把未提交 workflow 误记为远程 CI 成功                                                                                                                                                                       | 最终 `make check`：Go vet/race、111 个前端测试文件/481 个测试、分层覆盖率、Knip、循环/分层架构规则及生产构建全部通过；仅 P0-07 WAIT_REMOTE            |
| 2026-07-12 | P0-07 准备    | 完成提交前边界审计：确认全部改动仍在未暂存的 `main` 工作树；`.env.local`、coverage、dist 均由 Git 忽略；跟踪/未跟踪文件未命中常见私钥和 token 特征；新增文件无异常体积；CI workflow 可由 YAML 解析器读取                                                                                                           | `git diff --check`、`git status --ignored`、未跟踪文件清单、敏感特征路径级扫描和 workflow YAML 解析通过；未暂存、未提交、未推送                       |

---

## 9. 决策记录

| ID      | 日期       | 决策                              | 原因                                       | 状态     |
| ------- | ---------- | --------------------------------- | ------------------------------------------ | -------- |
| ADR-001 | 2026-07-11 | 保持模块化单体，不拆微服务        | 当前产品、部署和团队规模不需要分布式复杂度 | ACCEPTED |
| ADR-002 | 2026-07-11 | 先修正确性和身份，再拆目录        | 领域边界应决定目录，而不是目录反向决定模型 | ACCEPTED |
| ADR-003 | 2026-07-11 | Provider 是多个上下文端口的适配器 | 避免外部平台能力成为中心领域模型           | ACCEPTED |
| ADR-004 | 2026-07-11 | 实体身份必须包含稳定 ProviderId   | 避免跨源碰撞和错误解析                     | ACCEPTED |
| ADR-005 | 2026-07-11 | 查询结果只在应用边界表达状态      | 保留语义，同时避免 Result 污染所有领域类型 | ACCEPTED |
| ADR-006 | 2026-07-11 | 不完整扫描没有 prune 权限         | 读取失败不能被解释为领域对象消失           | ACCEPTED |

后续出现会改变目标架构、任务顺序或不变量的决定时，必须先在此追加记录。

---

## 10. 下一步

Phase 1～5 与 P0 的全部实现任务已经完成，最终本地门禁通过。路线图唯一未闭环项是 **P0-07：首次远程 CI 证据**；workflow 当前仍是未提交文件，必须先由用户授权提交和推送，或由用户自行推送后提供远程运行结果。

下一批预计触及：

- 若授权由我收口：从当前工作树创建 `codex/ddd-clean-architecture` 分支，暂存经审计的完整变更，创建提交并推送，然后读取 GitHub Actions 首次运行结果。
- 若用户自行收口：提交并推送 `.github/workflows/ci.yml` 及本轮实现，确认 Verify workflow 通过，再把 P0-07/DoD-01/DoD-07 标记为 DONE。

在得到推送授权前不创建提交、不推送，也不把本路线图总状态标记为完成。
