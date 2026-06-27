# core-architecture.md — PLANET 业务层(内核 / 领域 / provider)重造设计书

> **定位**:这是"在一个微内核插件底座上,重造 PLANET 业务层"的**唯一真相源 + 分步实施清单**。
> 分工:[`CLAUDE.md`](../CLAUDE.md) = 法则(能不能);[`REFACTORING.md`](../REFACTORING.md) = 通用重构镜头(改什么/怎么改);**本篇** = 这次重造的**目标架构 + 命名/事件定稿 + 分期清单**(做什么/什么顺序)。
>
> 范围**只限业务层**:`@shared` / `@domain` / `@core` / `@providers` / `src/app`。UI 不动,唯一会被波及的是 **内核↔UI 接缝**:`src/ui/store/bridge.ts`、`src/ui/hooks/data.ts`(事件名 / 命令调用跟随)。morph 引擎、vibe 屏幕、设计系统**零改动**。
>
> 进度勾选见 §9。每一步:`yarn run check` 全绿 → commit(中文 message + `Co-Authored-By`)→ `git push origin main`。

---

## 0. 为什么要做(现状判断)

业务层当前已是个**雏形微内核**(`Planet` 宿主 + 事件总线 + 拓扑依赖 + 一组插件),但有四类问题:

1. **生命周期 bug**:`Planet.dispose()` 直接调 `plugin.dispose()`,从不走 `uninstall()`,卸载时 `_context` 不清——注释承诺的对称挂载/卸载是假的;`uninstall()` 0 调用。
2. **命令错走广播**:UI 命令经 `hooks.emit(...)` 这条 fire-and-forget 总线下达,导致一批"半接线"事件(订阅无 emit、emit 无订阅、漏 off)——这是债,不是能力缺失。
3. **贫血领域**:`@domain` 只有 DTO + 少量派生方法;播放规则(队列前进、随机双队列、repeat 语义、静音恢复)散在 `@core` 插件里,`Queue` 还把领域规则和 `EventEmitter` 混在一个类。
4. **写死的单例 provider**:`getPlugin(PROVIDER_PLUGIN_ID)` 是个写死的特例,挡住"多 provider / 可视化等能力插件"。

---

## 1. 设计法则(决策 + why)

### 1.1 微内核 + 宏微混合;核心与第三方同一注册机制
内核只拥有**最小机制**:插件生命周期 + 事件总线 + **能力注册表**。所有功能都是插件。内置插件(provider、playback、queue…)在组合根**绑死**进内核(eager、全信任),未来第三方插件经**同一套注册机制**接入——"内置 vs 第三方"只是打包方式不同(= Linux 内置模块 vs `.ko`)。
**why**:这是用户的核心准则;也化解"插件管理器自身也是插件"的自举悖论(绑死内置 = 构造期 bind,不是自己加载自己)。

### 1.2 充血领域(rich domain),不是贫血 DTO
播放业务的**规则**下沉为 `@domain` 里的纯聚合 / 值对象(无 audio、无事件、可独立单测)。`@core` 插件退成**运行时编排适配器**(持有聚合 + 驱动 audio + 发事件)。
**why**:领域的完整性由领域定义,不由当前 UI 定义;规则可独立测试;core 真正变薄。

### 1.3 命令=向内直调 / 事件=向外广播 / 状态=快照(CQRS,且吻合依赖规则)
- **命令(意图,UI→领域)**:经 `PlaybackService` 的**直接方法调用**(类型安全、有返回值、唯一接收者)。**不再上事件总线。**
- **事件(事实,领域→外界)**:`*-changed` / `*-ended` 经事件总线 fan-out 给 N 个订阅者。
- **状态(快照)**:zustand store(`bridge` 订阅事件钉进去)+ service 上一个 `getState()` 给非 React 入口(未来 Media Session / 快捷键)。
**why**:向内能直调是整洁架构的正确方向(外层依赖内层);向外不能直调(领域不反向依赖 UI),只能发事件。"命令走广播"正是现状那批半接线 bug 的根因。

### 1.4 不砍领域能力,只砍管道废料(完整性原则)
"清空队列 / 入队 / 出队 / 静音 / 选曲"是音乐播放器的**核心词汇**,不是 speculative——它们当前的半接线状态是**债**,正确做法是**接通补全**(§3 命令表),不是删。只删**纯管道废料/bug**(§8)。
**why**:用 "UI 没用到" 当死代码判据,对领域层是错的(头痛医脚)。

### 1.5 右尺寸:借鉴只取思想,framework 机制全部推迟
参考了 lynx(扩展点底座、`definePlugin`、能力沙箱、懒激活、sideload、apiVersion)与 BetterScroll(插件方法代理到宿主 + 条件类型)。**只取两条思想**:① 统一注册(能力注册表);② 宿主由插件拼装(按域命名空间挂载 + 条件类型)。
**推迟**(等真有第三方/动态插件再加,注册表天然兼容):能力沙箱、懒激活、sideload 加载器、apiVersion、宿主自动代理 + 完整条件类型机制、插件管理器 UI、命令 dispatch 中间件。
**插件作者形态**:**保留 class-based 插件**——用户准则"同一注册方式"由**能力注册表**兑现,与 class/functional **正交**;为它做 functional 全量重写是无收益 churn,违反第一法则,故不做。
**why**:给一个 6 插件、0 第三方的播放器造 IDE 级框架,正是两项目第一法则都禁止的推测性债务。

### 1.6 BetterScroll 的"宿主拥有方法":取思想、改形态
借"宿主由插件拼装 + 条件类型生长"的思想;**但不要扁平方法代理**(`engine.next()` 平铺)。planet 是多领域,改成**按域命名空间挂载**:`engine.playback` / `engine.media` /(插件在场时)`engine.analyser`,核心命令显式写在子门面上、不走动态代理。
**why**:BetterScroll 是单一职责控件,扁平读着自然;planet 多领域,平铺会撞名、难追来源。

---

## 2. 目标架构(分层 + 数据流)

```
UI / 快捷键 / (未来) Media Session
      │  ① 命令 = 直接方法调用(不上总线)
      ▼
PlaybackService(命令式门面 = 充血域对外 API)   MediaService(浏览/取数)
      │  ② 经内核解析能力插件、直调其方法                │
      ▼                                                ▼
@core 插件(运行时编排适配器:持有聚合 / 驱动 audio)   (active) Provider
  Playback(audio play/pause/load/ended)
  PlayQueue(持有 PlayQueue 聚合)  Volume  Progress  Lyrics  StoreBridge
      │  ③ mutate 聚合/audio 后 emit 事实事件
      ▼  ④ 插件间用事件协调(queue:current-changed → Playback 加载音频;
         playback:track-ended → PlayQueue 前进)——核心内部的事件驱动
事件总线 planet.hooks(只承载"事实",不再有"命令")
      │  ⑤ fan-out
      ├─▶ StoreBridge → zustand(UI 的状态快照)
      └─▶ Lyrics(跟随当前曲取词)

@domain(充血、纯、可独立单测,无 audio / 无事件)
  PlayQueue 聚合 · RepeatMode · Volume 值对象 · 实体(Track/Album/…)+ 端口(MusicProvider)

@shared(框架无关纯工具,最内,零依赖)
```

**依赖方向(单向)**:`@shared ← @domain ← @core ← @providers ← app`(UI 仅经 Engine 门面接触 core)。

---

## 3. 命令 & 事件目录(scheme A)

### 3.1 命令(成为 `PlaybackService` 方法,直调,**不在总线上**)

| 旧事件(将删除) | 新命令方法 | 说明 |
|---|---|---|
| `play` | `resume()` | 恢复播放(audio) |
| `pause` | `pause()` | 暂停 |
| —(派生) | `togglePlay()` | 读 `getState()` 自决方向 |
| `change_play_queue` | `playNow(tracks, track, key?)` | 设队列并从某曲开始 |
| `next_track` | `next()` | 下一曲 |
| `previous_track` | `previous()` | 上一曲 |
| `select_track`(半接线) | `selectTrack(track)` | **补全**:跳到队列中某曲 |
| `clean_play_queue`(死) | `clearQueue()` | **补全**:清空队列(emit `queue:changed` 空) |
| —(缺失) | `addToQueue(track)` | **补全**:入队 |
| —(缺失) | `removeFromQueue(track)` | **补全**:出队 |
| `change_shuffle_enable` | `toggleShuffle()` | 随机开关 |
| `change_repeat_mode` | `cycleRepeat()` | 循环模式轮转 |
| `change_volume` | `setVolume(v)` | 0..100 |
| `mute_or_unmute`(半接线) | `toggleMute()` | **补全**:静音/恢复(Volume 值对象 preVolume 规则) |
| `play_time_seek` | `seek(percent)` | 0..100 |
| —(读) | `getState()` | 同步状态快照 |

### 3.2 事件(留在总线,**领域→外界**;scheme A:`聚合:过去式-kebab`)

| 旧事件 | 新事件 | payload |
|---|---|---|
| `play_state_changed` | `playback:state-changed` | `PlayState` |
| `play_track_ended` | `playback:track-ended` | — |
| `play_queue_changed` | `queue:changed` | `{ tracks }` |
| `current_track_changed` | `queue:current-changed` | `Track` |
| `shuffle_enable_changed` | `queue:shuffle-changed` | `boolean` |
| `repeat_mode_changed` | `queue:repeat-changed` | `RepeatMode` |
| `volume_changed` | `volume:changed` | `number`(静音 = 0;`muted` 由 store 派生) |
| `track_duration_changed` | `progress:duration-changed` | `FormattedDuration` |
| `play_time_changed` | `progress:position-changed` | `Progress` |
| `lyric_changed` | `lyrics:changed` | `Lyric[]` |
| —(Phase B) | `provider:changed` | `string`(provider name) |
| `play_queue_cleaned`(删) | — | 由 `queue:changed`(空)覆盖 |

---

## 4. 领域模型(`@domain`,充血)

> 纯函数 / 纯状态,无 `audio`、无 `EventEmitter`、可脱离 React 单测。插件持有实例并在变更后 emit 事件。

- **`PlayQueue` 聚合**(把现 `@core/.../queue.ts` 的规则搬来、剥离 EventEmitter):
  状态:`tracks` + `currentIndex` + 显示序/播放序(随机)。
  方法:`setTracks(tracks, startAt?)` · `add(track)` · `remove(track)` · `clear()` · `select(track)` · `next(repeat)` · `previous()` · `shuffle()/unshuffle()`。
  不变量:**末尾遇 `OFF` 停、`ALL` 绕回、`ONE` 重播**;随机保留显示序、仅打乱播放序;`current` 始终落在有效曲或 `undefined`。
- **`RepeatMode`**:`OFF → ALL → ONE` 轮转(现 `Repeat` 已是纯的,迁入 `@domain` 即可)。
- **`Volume` 值对象**:`clamp(0..100)` + 静音/恢复规则(`preVolume`:静音存上次、恢复取回;上次为 0 时恢复到 30)。

---

## 5. 内核(`@core/kernel`)

- **生命周期(治本)**:对称模板——`init(ctx)` 注入 + 调 `onInit()`;`dispose()` 调 `onDispose()` + **清 `_context`/`_installed`**。子类只实现 `onInit`/`onDispose` 钩子。**删 `uninstall()`**。Planet 挂载/卸载只认 `init`/`dispose`。
- **事件总线**:`EventEmitter` 保留 `on/once/off/emit/clear`;**删 `emit("*")` 通配分支**(类型 API 不可达、无调用)。快照派发(防 emit 中改监听)保留。
- **能力注册表(Phase B)**:`register<T>(capability, impl)` / `resolve<T>(capability)` / `resolveAll<T>(capability)`,取代写死的 `getPlugin(FIXED_ID)`。内置与第三方同一写法。
- **删 `manager/` 模块**:`Planet` 直接用私有 `Map<string, Plugin>`(去重已由 `topoSort` 保证;`Manager.apply/remove/has/size` 全无使用方)。抽象基类 `Plugin implements Identifiable, Disposable`(单实现接口已折叠进类,无 `I` 前缀)。

---

## 6. Provider & 多 provider(Phase B)

- 每个 provider 是独立插件、独立 id(`provider:netease` / `provider:qq` / `provider:spotify` / `provider:mock`),声明提供 `music-provider` 能力。
- **`ProviderRegistry`**(内置插件,= "管理插件的插件"的有用形态):聚合所有 `music-provider`、持有"当前 provider"、运行时切换、切换 emit `provider:changed`。
- `MediaService` / `PlaybackService` 不再认死 id,经注册表取"当前 provider"。UI 的 React Query 已按 `providerName` 做 key,切换自动隔离缓存。
- 组合根注册**所有**已配置 provider,默认活跃由 `VITE_PROVIDER` 决定(从"选一个实例化"变"全注册、选活跃")。

---

## 7. 命名定稿

- **插件 id**:统一 kebab/lowercase + `static readonly`:`playback` · `play-queue` · `volume` · `progress` · `lyrics` · `play-queue-store-bridge`(Phase B provider:`provider:*`)。
- **类名**:`Control → Playback`(驱动 `<audio>`;与应用层 `PlaybackService` 以 `-Service` 后缀区分层)。`LyricPlugin → Lyrics`(去掉别人没有的 `Plugin` 后缀;复数 = 歌词源,区别于 `Lyric` 单行模型)。其余 `PlayQueue/Volume/Progress` 保留。
- **方法/工具**:`getNumberInRange → clamp`(call sites:Volume/Progress);插件内无谓的 `async`(Volume.change / muteOrUnmute)去掉。
- `@shared` 其余工具(`Timer`/`sleep`/`debounce`/`getRandomIntExclude`,仅测试引用)**本次不动**(非本次焦点,且属通用工具非领域能力)。
- **接口命名(无 `I` 前缀,按本质二分)**:
  - **单实现、与同名类成对的接口 → 折叠进类**,不保留接口:`EventEmitter` / `CapabilityRegistry` / `Plugin`(抽象基类)/ `Planet` / `PluginContext`(原 `Context`,与 `AudioContext` 区分)。类即契约,接口是 YAGNI。
  - **跨层真端口 / 插件对外能力面 → 留接口,按角色命名**:领域端口用领域名词(`@domain/ports/` 的 `MusicProvider`,目录已表"port"语义,不加后缀);`@core` 插件对外能力面用 `XxxPort`(`ProviderRegistryPort` / `AnalyserPort`,与各自插件类 `ProviderRegistry` / `AudioEngine` 区分)。
  - 结构性角色接口保持无前缀:`Identifiable` / `Disposable` / `Clearable` / `Capability` / `EventMap` / `EventHandler`。
  - **handler 命名统一** `on<Event>`:`onCurrentChanged`(原 `changePlayTrack`)/ `onEnded`(原 `onPlayEnd`)/ `onTrackEnded` / `onTrackChanged`。
  - **去 stutter**:`PlayQueue` 插件内队列操作用裸动词 `add/remove/clear/select`(对象本身即 queue);对外 `PlaybackService` 的 UI 命令仍用 `addToQueue/removeFromQueue/clearQueue/selectTrack`(读作意图)。

---

## 8. 死代码处置(完成 vs 删除)

- **接通补全**(领域能力,§3.1):`selectTrack` · `clearQueue` · `addToQueue` · `removeFromQueue` · `toggleMute`;并修 `select_track` 的**监听泄漏**(订阅无 off)。
- **删除**(纯管道废料/bug):`Plugin.uninstall()` · `EventEmitter.emit("*")` · `manager/` 模块 · `play_queue_cleaned` 事件(被 `queue:changed` 空态覆盖)。

---

## 9. 分期实施清单

> 每步独立全绿、独立 commit+push。Phase A 不依赖任何插件框架决策。

### Phase A — 充血领域 + 命令/事件分离(业务正确性,先落袋)
- [x] **A1 内核 hygiene**:修 Plugin 生命周期(对称 `onInit/onDispose` + 清 context、删 `uninstall`)、删 `EventEmitter.emit("*")`、删 `manager/`(Planet 用私有 Map)。**无播放行为变更。**
- [x] **A2 充血 `@domain`**:落 `PlayQueue` 聚合 / `RepeatMode` / `Volume` 值对象 + 单测。**纯新增,未接线。**
- [x] **A3 插件接聚合 + 命令/事件分离 + 补全能力**:插件改用 `@domain` 聚合;`PlaybackService` 补全 §3.1 全部方法(经 `getPlugin` 直调,**命令下总线**);补全 `selectTrack/clearQueue/addToQueue/removeFromQueue/toggleMute` 端到端;修监听泄漏。总线此后只剩事件。
- [x] **A4 scheme A 事件命名**:按 §3.2 改全部事件;更新 `store/bridge.ts` + `hooks/data.ts`。
- [x] **A5 命名收尾 + 性能**:`Control→Playback`、`LyricPlugin→Lyrics`、id 统一、`clamp`、去无谓 `async`;`Progress` 每秒节流挪到源头(格式化只 1 次/秒,而非 bridge 丢 3/4)。

### Phase B — 能力注册表 + 多 provider + 可视化 seam(扩展底座,右尺寸)
- [x] **B1 能力注册表**:内核加 typed `Capability<T>` + `provide/resolve/resolveAll`(`CapabilityRegistry`,经 `PluginContext.registry` 注入插件、`Planet.resolve` 暴露)。**所有解析统一走注册表,一个机制**:transport/queue/volume/progress 各发能力 token(`TRANSPORT/PLAY_QUEUE/VOLUME_CONTROL/PROGRESS`)、`onInit` 自注册,`PlaybackService` 经 token `resolve`;provider 经 `MUSIC_PROVIDER`+ProviderRegistry。**删除 `Planet.getPlugin`**(已无消费方;Planet 内部仍用 id-keyed Map 做生命周期)。(原 B1 曾保留 getPlugin 做"右尺寸",重构 pass 复审后判定双机制是 wart,统一更简、更贴"同一注册方式"准则。)
- [x] **B2 多 provider**:provider 独立 id(`provider:<name>`)+ `MUSIC_PROVIDER` 能力(`onInit` 自注册);加 `ProviderRegistry` 插件(`active`/`providers`/`setActive` + `provider:changed`);`Engine`/`Lyrics`/services 经注册表取**活跃** provider;组合根注册全部可用 provider、按 `VITE_PROVIDER` 选活跃(缺省/缺凭据回退 Mock)。删 `PROVIDER_PLUGIN_ID`。
- [x] **B3 audio-analyser seam**:`AudioEngine` 能力插件**惰性**独占 `MediaElementSource`、暴露 `AnalyserNode` tap(**不建可视化 UI**;惰性=未被请求前不碰音频链,零回归风险),给均衡器/可视化留口。
- [x] **B4 宿主按域挂能力**:`Engine` 把已解析能力以命名空间访问器显式暴露(`engine.providers`;未来 `engine.analyser`),**不上自动代理/条件类型机制**。

### Phase C — 推迟(等真实需求触发)
functional `definePlugin` / 完整 SDK · sideload 加载器 · 能力沙箱 · 懒激活 · apiVersion · 宿主自动代理 + 完整条件类型 · 可视化 UI 与 UI 贡献模型 · 命令 dispatch 中间件。

---

## 10. 决策状态

**已锁**:微内核+宏微混合(1.1)· 充血域(1.2)· 命令直调/事件总线/状态快照(1.3)· 完整性原则(1.4)· 右尺寸+保留 class 插件(1.5)· 宿主按域挂载(1.6)· scheme A(§3)· 命名(§7)· 分期(§9)。
**可否决(用户随时可推翻)**:`Control→Playback` 取名;`Volume` 静音恢复默认值 30;Phase A/B 的先后(可一鼓作气)。

---

## 11. XMB 信息架构(导航的领域建模)

XMB 是 L1 launcher。单领域(全是音乐)App 的横轴**既不能是内容类型**(PS3 那套)、**也不该是功能平铺**(每屏一列)。横轴建模为**限界上下文 / "用户与音乐的关系模式"**——一棵 **capability-aware 的优先级树**。

- **L1 = 限界上下文"世界"**(互斥,少而稳):`Now Playing`(Playback)· `Discover`(Catalog)· `Library`(用户自有)· `You`(Identity)· `Settings`(System)。映射到 `PlaybackService` / `MediaService` / 未来的 Library/User context。
- **L2 = 该世界的子目录**,**按优先级排列(最可能想要的在最上)**——让期望点击距离最小(Hick+Fitts)。`Now Playing` = Player · Up Next · History(会话的 现在/未来/过去);`Library` = Liked · Playlists · Albums · Artists(Cover Flow 降为 Albums 的视图模式)。
- **L3 = 单个聚合根详情**(playlist/album/artist/chart),morph 落点;**L3 即菜单地板**,聚合内容平铺其中 + 播放。
- **L4+ = 内容图的横向穿行**(album↔artist↔track):**每个实体在树里只有唯一"家",跨引用 = 传送到那个家,不长新枝**——树保持干净,内容仍互联。morph 承载 L2→L3 与 L3↔L3。
- **能力门控**:只有"provider 供数"的项被 `media.supports(cap)` 门控(整个 Discover、以及 Lyrics/Comments);本地世界(Player/Queue/History、Library、You、Settings)恒在。**门控为空的世界整列隐藏**。
- **Discover 优先级**:For You(`personalized`)· **Browse**(按维度,无 capability → 预留 #2、暂隐)· Charts(`toplist`)· Search(`search`)。
- **Search**:与 Discover 同属 Catalog 域 → 放 Discover 下;高频访问靠**全局 `/` 或 ⌘/Ctrl+K 热键**(任意页面唤起),而非提到一级。

---

## 一句话
**薄内核 + 充血域 + 命令直调/事件广播;能力统一注册、宿主由插件拼装;借鉴只取思想,framework 机制按需后置。** 先 A(正确性)后 B(扩展性),逐步全绿。导航是 capability-aware 的优先级树:L1 限界上下文 → L2 优先级子目录 → L3 聚合详情 → 内容图横向穿行。
