# `frontend/src/packages/` 深度优化清单

> 这份文档把 `packages/`（前端内核层）当前的问题逐条列出，分级到 P0 / P1 / P2，并给出可落地的改法。每条问题尽量带上文件 + 行号、最小可复现说明、推荐补丁、影响面，方便挑选执行。
>
> **路线建议**：先做 P0（必修 bug + 类型一致性）+ P2（清理死代码），改动局限在 `packages/` 内，`view/` 层只在 Duration 类型那一处需要联动；P1（设计层重构）单独一轮，因为它会动 Plugin 基类签名、Planet API、Provider 形态，传导面更大。

---

## 目录

- [P0 — Bug 与类型不一致](#p0--bug-与类型不一致)
  - [A1. `sleep` 判断写反，所有 sleep 立即 resolve](#a1-sleep-判断写反所有-sleep-立即-resolve)
  - [A2. Control / Progress 的 `removeEventListener` 引用不上](#a2-control--progress-的-removeeventlistener-引用不上)
  - [A3. `Volume` 初始单位错乱](#a3-volume-初始单位错乱)
  - [A4. `EventEmitter.once` 不可解绑](#a4-eventemitteronce-不可解绑)
  - [A5. emit 期间 off 自己会漏派 / 重派](#a5-emit-期间-off-自己会漏派--重派)
  - [A6. `getRandomInt` 是闭区间，调用方按半开区间用 → 越界](#a6-getrandomint-是闭区间调用方按半开区间用--越界)
  - [A7. `createOnceFunction` 的 done 回调位置错](#a7-createoncefunction-的-done-回调位置错)
  - [A8. NCM 残留小问题（id 类型 / console.log / 字段缺失）](#a8-ncm-残留小问题id-类型--consolelog--字段缺失)
  - [A9. `Plugin.uninstall()` 默认不调 `dispose()`](#a9-pluginuninstall-默认不调-dispose)
  - [B10. `Duration` 一名两型](#b10-duration-一名两型)
  - [B11. `IDisposeable` 拼错 + 通用接口散落](#b11-idisposeable-拼错--通用接口散落)
  - [B12. `IEventMap` 类型太宽松](#b12-ieventmap-类型太宽松)
  - [B13. `Plugin` 6 个生命周期钩子可收敛成 2 个](#b13-plugin-6-个生命周期钩子可收敛成-2-个)
- [P1 — 设计层重构](#p1--设计层重构)
  - [C14. 插件挂载顺序敏感，无依赖声明](#c14-插件挂载顺序敏感无依赖声明)
  - [C15. Planet 没有 `dispose()`](#c15-planet-没有-dispose)
  - [C16. `Provider` 既是接口又是 Plugin，能力差异未表达](#c16-provider-既是接口又是-plugin能力差异未表达)
  - [C17. `UseableManager.substituteRule` 是 PlayQueue 的私事](#c17-useablemanagersubstituterule-是-playqueue-的私事)
  - [C18. NCM mapping 散落，应抽 mapper](#c18-ncm-mapping-散落应抽-mapper)
  - [C19. PlayQueue tracks 暴露可变数组](#c19-playqueue-tracks-暴露可变数组)
- [P2 — 死代码 / 占位](#p2--死代码--占位)
  - [D20. Lyric 插件没接事件总线](#d20-lyric-插件没接事件总线)
  - [D21. Analyser 启不动且没 cancel handle](#d21-analyser-启不动且没-cancel-handle)
  - [D22. 测试文件大多是 `console.log` 占位](#d22-测试文件大多是-consolelog-占位)
- [推荐切片](#推荐切片)

---

## P0 — Bug 与类型不一致

> 都是行为不正确 / 类型谎报的问题。修了不会破坏 view 层的调用方式（除 B10 需要联动）。

### A1. `sleep` 判断写反，所有 sleep 立即 resolve

**位置**：`packages/shared-utils/time.ts:9`

```ts
export function sleep(duration: Duration): Promise<void> {
    if (Number.isNaN(duration) || Number.isFinite(duration) || duration < 0) {
        duration = 0;
    }
    ...
}
```

`Number.isFinite(duration)` 为真表示"有限值"——即正常的传入。这里写成"是有限值就置 0"，相当于**所有正常 sleep 都立即 resolve**。Lyric 插件用 sleep 做行间隔，所以也跟着失效。

**改法**：

```ts
if (!Number.isFinite(duration) || duration < 0) {
    duration = 0;
}
```

**影响面**：`shared-utils/time.ts` 一处。Lyric 行为顺带恢复正常。

---

### A2. Control / Progress 的 `removeEventListener` 引用不上

**位置**：
- `packages/plugin/control/index.ts:27` / `:35`
- `packages/plugin/progress/index.ts:24-25` / `:30-31`

```ts
afterInstall() {
    this.context.audioElement.addEventListener("ended", this.onPlayEnd.bind(this))
}
dispose() {
    this.context.audioElement.removeEventListener("ended", this.onPlayEnd)
}
```

`addEventListener` 拿到的是 `bind` 出来的**新函数引用**，`removeEventListener` 用裸方法引用，两者不相等——**永远移除不掉**。卸载插件后 audio listener 仍残留。

**改法**：把方法改为类字段箭头函数（自动绑 this，引用稳定），或者把 bind 后的引用先存字段。推荐前者：

```ts
class Control extends Plugin {
    private onPlayEnd = (): void => {
        this.context.hooks.emit("play_track_ended")
    }
    private play = async (): Promise<void> => { ... }
    private pause = (): void => { ... }
    private changePlayTrack = async (track: Track): Promise<void> => { ... }
}
```

Progress 同理。

**影响面**：两个插件文件。EventEmitter 那边的 on/off 也用到了 `this.xxx` 直接传，但因为 EventEmitter 接受 `ctx` 参数并用 `fn.call(ctx, arg)`，那部分不受影响。

---

### A3. `Volume` 初始单位错乱

**位置**：`packages/plugin/volume/index.ts:33`

```ts
afterInstall() {
    this.preVolume = 0;
    this.curVolume = this.context.audioElement.volume   // 0..1
    ...
}
```

但 `change(v)` / `mute_or_unmute` / `volume_changed` 全按 0–100 用：

```ts
this.context.audioElement.volume = v / 100
```

第一次 `mute_or_unmute` 时，`curVolume = 1`（不是 0）→ 走 `else { v = 0 }`，看起来正常；但任何先读 curVolume 的逻辑就拿到了 1 而非 100。

**改法**：

```ts
this.curVolume = Math.round(this.context.audioElement.volume * 100)
```

并且 `volume_changed` 事件 payload 单位在文档里写清楚（`number 0..100`）。

**影响面**：volume 一个文件；UI 拿值无变化（因为 audio.volume 默认是 1，curVolume 修复后是 100，正好对得上 UI 的 0–100 滑条）。

---

### A4. `EventEmitter.once` 不可解绑

**位置**：`packages/event/emitter.ts:30-35`

```ts
once<K>(name: K, fn, ctx) {
    const onceFn = createOnceFunction(fn, () => this.off(name, onceFn))
    return this.on(name, onceFn, ctx)
}
```

存进 listeners 的是 `onceFn`（包装函数），用户后面调 `off(name, fn)` 时传的是原 `fn`，匹配不到，无法手动取消订阅。

**改法**：把 once 实现成 listener 上的标记位，emit 时若是 once 派完即移除：

```ts
type Listener = { fn: Function; ctx: object; once: boolean }

once(name, fn, ctx = this) {
    const list = this.getOrCreate(name)
    list.push({ fn, ctx, once: true })
    return this
}

off(name, fn?) {
    if (!this.listeners.has(name)) return this
    if (!fn) { this.listeners.set(name, []); return this }
    const list = this.assertGet(name)
    this.listeners.set(name, list.filter(l => l.fn !== fn))
    return this
}

private emitByName(name, arg) {
    const list = [...this.assertGet(name)]   // snapshot, 解决 A5
    for (const l of list) {
        l.fn.call(l.ctx, arg)
        if (l.once) {
            const live = this.assertGet(name)
            this.listeners.set(name, live.filter(x => x !== l))
        }
    }
}
```

**影响面**：emitter 一个文件。`createOnceFunction` 仍可保留给别处用。

---

### A5. emit 期间 off 自己会漏派 / 重派

**位置**：`packages/event/emitter.ts:69-80`

```ts
private emitByName<T>(name, arg) {
    const listeners = this.assertGet(name)
    listeners.forEach(listener => listener.fn.call(listener.ctx, arg))
}
```

如果某个 listener 在被调时 `off(name, fn)`，原数组的索引会被打乱，`forEach` 会跳过下一个。

**改法**：emit 前 snapshot（A4 的 emit 实现已包含）。

**影响面**：emitter 一个文件，与 A4 一起改。

---

### A6. `getRandomInt` 是闭区间，调用方按半开区间用 → 越界

**位置**：`packages/shared-utils/math.ts:5`

```ts
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)   // [min, max]
}
```

`packages/manager/useable-manager.ts:30`：

```ts
const random = getRandomIntExclude(0, ids.length, delIdx)
```

期望的是数组合法索引 `[0, length-1]`，但 `getRandomInt(0, length)` 实际可能返回 `length`，越界。

**改法**：要么改 `getRandomInt` 为半开区间（注释里也建议），要么调用方改成 `getRandomInt(0, ids.length - 1)`。推荐前者（半开区间更符合 JS 习惯），但这是 breaking change。如果选改语义：

```ts
/** [min, max) */
export function getRandomInt(min: number, max: number): number {
    if (min >= max) throw new Error("min must be < max")
    return Math.floor(Math.random() * (max - min)) + min
}
```

同时检查 `array.ts:6` 的 `shuffleArray` —— 现在用的是 `getRandomInt(0, i)` 在 Fisher-Yates 里期望 `[0, i]` 闭区间。如果改半开，shuffleArray 要改 `getRandomInt(0, i + 1)`。

**影响面**：math 一处 + 两个调用方；建议同时跑 `math.test.ts` 验证。

---

### A7. `createOnceFunction` 的 done 回调位置错

**位置**：`packages/shared-utils/function.ts:11-14`

```ts
return function () {
    if (called) return result;
    try {
        result = fn.apply(_this, arguments);
    } finally {
        fnDoneCallback && fnDoneCallback()   // ← 每次都触发
    }
    called = true;
    return result;
}
```

`fnDoneCallback` 应该只在第一次调 fn 之后触发；现在放在 `finally` 里，且 `finally` 块在 `if (called) return` 之后，但实际上每次首次以外的调用走 `if (called) return result` 直接 return，不进入 try——所以**只有第一次会触发**。然而 `called = true` 在 finally 之后，如果 fn 抛错，finally 仍会触发 done，但 called 仍为 false，再次调用会重新调 fn 并再次触发 done。**异常路径下会双触发**。

**改法**：

```ts
return function () {
    if (called) return result
    called = true
    try {
        result = fn.apply(_this, arguments)
    } finally {
        fnDoneCallback?.()
    }
    return result
}
```

**影响面**：function.ts 一处。如果 A4 改了 once 不再用这个函数，可考虑直接删除 `createOnceFunction`。

---

### A8. NCM 残留小问题（id 类型 / console.log / 字段缺失）

**位置**：`packages/provider/NeteaseCloudMusic.ts`

- `:113` `id: ar.id` 漏 `.toString()`，artist id 类型不一致；
- `:132` 残留 `console.log(album)`；
- `albumDetail` 里 mapping 的 `track` 没有 `album` 字段，UI 在专辑详情列表里看不到封面（实际通过 `hiddenAlbum` 隐藏掉了，但映射仍不完整）；
- `:54-72` `playlistDetail` 的 track.album 缺 `image` 之外的可用字段（已经够用，提一下）。

**改法**：补 `.toString()`，删 console.log，必要时统一 mapper（见 [C18](#c18-ncm-mapping-散落应抽-mapper)）。

**影响面**：provider 一个文件。

---

### A9. `Plugin.uninstall()` 默认不调 `dispose()`

**位置**：`packages/core/plugin.ts:38-49`

```ts
beforeUninstall(): void {
    this.dispose()
}
uninstall(): void {
    if (!this.installed) { ... return }
    this._context = undefined
    this.installed = false
}
```

`dispose` 是在 `beforeUninstall` 调用的。如果子类 override `beforeUninstall` 而忘了调 super，`dispose` 不会执行——副作用泄漏。

**改法**：把 dispose 改到 `uninstall` 里，并禁止子类 override `uninstall`（设为 final 风格，逻辑由 `dispose` 承担）。配合 [B13](#b13-plugin-6-个生命周期钩子可收敛成-2-个) 的简化更彻底。

最小修法：

```ts
uninstall(): void {
    if (!this.installed) { warn(...); return }
    try { this.dispose() } finally {
        this._context = undefined
        this.installed = false
    }
}
beforeUninstall(): void { /* no longer calls dispose */ }
```

**影响面**：Plugin 基类，所有子类的 dispose 仍按现有写法工作。

---

### B10. `Duration` 一名两型

**位置**：
- `packages/model/duration.ts` — `{ duration: number; durationFormatted?: string }`
- `packages/shared-utils/time.ts:1` — `type Duration = number`
- `packages/model/playlist.ts:13,15`，`packages/model/album.ts:11-12` — 字段类型用前者，但运行时塞的是 number（NCM `res.playlist.createTime`）

后果：Spotify / Mock 的实现里到处 `as unknown as Playlist["createTime"]` 强转。**类型签名说谎，绕过的代码越积越多**。

**改法**：

```ts
// model/duration.ts —— 富对象重命名，避免和 number 撞名
export type FormattedDuration = {
    duration: number
    durationFormatted?: string
}
export type Progress = FormattedDuration & { percent: number }
export const InfinityDuration: FormattedDuration = {
    duration: Infinity,
    durationFormatted: "--:--:--"
}
```

```ts
// model/playlist.ts
export type Playlist = {
    ...
    createTime: number          // ms timestamp
    durationCount: number       // ms total
}
// model/album.ts 同理
```

把所有 `Duration`（model 里旧名）改成 `FormattedDuration`，把字段类型改 `number`。

**影响面**：
- `view/components/banner/index.tsx`、`view/layout/basic/player/control.tsx`、`progress` 插件等用到富对象的位置：要么换名 `FormattedDuration`，要么字段计算照旧；
- Spotify / Mock provider：去掉 `as unknown as` 断言；
- NCM provider：保持原状，类型对齐了。

是 P0 里影响面最大的一条，但收益也最大——一改之后这层类型谎报问题彻底干净。

---

### B11. `IDisposeable` 拼错 + 通用接口散落

**位置**：`packages/types/index.ts`

```ts
export interface IIDable { get id(): string }
export interface IDisposeable { dispose(): void }   // ← Disposable 才对
export interface IClearable { clear(): void }
```

**改法**：重命名 `IDisposeable → IDisposable`，调用方仅 `core/types.ts:14` 一处。可顺手把这三个接口归类（语言级 / 容器级），但保持目录不变也行。

**影响面**：一处类型定义 + 一处 import。

---

### B12. `IEventMap` 类型太宽松

**位置**：`packages/event/types.ts:3`

```ts
export interface IEventMap { [key: string]: any }
```

`any` 索引让 listener 收到的 payload 实际上是 `any`，TS 不强制处理 undefined 或字段缺失。

**改法**：

```ts
export interface IEventMap { readonly [key: string]: unknown }
```

并在 `IEventListener` / `emit` 签名里用 `E[K]` 严格传递。

**影响面**：可能会暴露 view 层一些"假装能用"的赋值；遇到再就地修。EventEmitter 自身实现不变。

---

### B13. `Plugin` 6 个生命周期钩子可收敛成 2 个

**位置**：`packages/core/plugin.ts`，`packages/core/types.ts`

当前 IPlugin 上有 `beforeInstall / install / afterInstall / beforeUninstall / uninstall / afterUninstall` 6 个钩子，子类常常在 `afterInstall` 里订阅事件、在 `dispose` 里取消订阅，其他 4 个钩子没用过。

**改法（推荐）**：

```ts
export interface IPlugin extends IIDable, IDisposable {
    /** 由 Planet 在挂载时调一次。子类在这里订阅事件、监听 audio。 */
    init(ctx: IContext): void
    /** 由 Planet 在卸载时调一次。子类在这里取消订阅。 */
    dispose(): void
}
```

`Plugin` 基类保留 `context` getter，`init` 内部处理 `installed` 标记和 `_context` 注入：

```ts
abstract class Plugin implements IPlugin {
    private _installed = false
    private _context?: IContext

    abstract get id(): string

    get context(): IContext {
        if (!this._installed || !this._context) throw new Error("Plugin not installed")
        return this._context
    }

    init(ctx: IContext): void {
        if (this._installed) { warn(`plugin ${this.id} installed twice`); return }
        this._context = ctx
        this._installed = true
        this.onInit()
    }

    /** 子类 hook：context 已可用，订阅事件即可 */
    protected onInit(): void {}

    abstract dispose(): void
}
```

子类从 `afterInstall` 改成 override `onInit`，去掉所有 `super.afterInstall()` 样板。

**影响面**：所有插件（Control、Volume、PlayQueue、Progress、Lyric、Analyser、Provider 子类）都要改 `afterInstall` → `onInit`、删 `beforeInstall/beforeUninstall/afterUninstall`。每个文件改 5–10 行，机械工作。

**这条与 [A9](#a9-pluginuninstall-默认不调-dispose) 自然合并**：dispose 由基类的 `init/uninstall` 流程统一调度。

---

## P1 — 设计层重构

> 影响面更大，会改动 Planet API、Plugin 基类签名、Provider 形态，传导到 `view/` 层。建议单独一轮。

### C14. 插件挂载顺序敏感，无依赖声明

**位置**：`packages/core/planet.ts:16-32`

```ts
constructor(opt?) {
    if (opt?.plugins) {
        opt.plugins.forEach(p => p.beforeInstall())
        opt.plugins.forEach(p => p.install(this.context))
        opt.plugins.forEach(p => p.afterInstall())
        this.pluginManager.apply(opt.plugins)
    }
}
```

PlayQueue 在 `afterInstall` 里 `on("play_track_ended", this.autoNext)`，这条事件由 Control 的 audio `ended` 触发——意味着 Control 必须先安装。当前 `view/planet.ts` 的数组顺序刚好对，但**没有任何机制保证**。换一个顺序就静默挂掉。

另外，install 流程中途某个插件抛错，前面的已经 install 的插件不会回滚，状态不一致。

**改法**：
1. 给 IPlugin 加 `dependsOn?: string[]`，Planet 构造时按依赖拓扑排序；
2. install 用 try/catch，失败时反向 uninstall 已挂的插件。

```ts
interface IPlugin {
    get id(): string
    readonly dependsOn?: string[]
    init(ctx: IContext): void
    dispose(): void
}
```

**影响面**：Planet + IPlugin 接口；现有插件给 PlayQueue 加 `dependsOn = ["control"]` 之类即可。

---

### C15. Planet 没有 `dispose()`

无法整体销毁，未来切换 provider / 热重载 / 单测都要全程拆解。

**改法**：加 `dispose()`，按 install 反序调用每个插件的 `dispose()` 与 `uninstall()`，然后清 EventEmitter、关闭 AudioContext。

```ts
class Planet implements IPlanet {
    dispose(): void {
        const plugins = this.pluginManager.all().slice().reverse()
        for (const p of plugins) {
            try { p.dispose() } catch (e) { warn(`dispose ${p.id} failed: ${e}`) }
        }
        this.pluginManager.clear()
        this.context.hooks.clear()
        // audioContext.close() 视情况
    }
}
```

**影响面**：Planet + IPlanet 接口；view 端的 `useProvider` 切换 provider 流程会受益（先 dispose 再换）。

---

### C16. `Provider` 既是接口又是 Plugin，能力差异未表达

**位置**：`packages/provider/provider.ts`、`packages/provider/types.ts`

`Provider` 兼任两个角色：
1. Plugin（被 Planet 挂载，固定 id `"provider"`）；
2. 数据接口（playlistDetail / albumDetail / lyric / playUrls / personalized）。

但能力差异显著：
- Spotify 没歌词、没完整播放 URL；
- Mock 没真实播放 URL；
- NCM 全有。

UI 端目前没法据此切换体验（比如 Spotify 时该隐藏歌词面板、提示"仅试听 30 秒"）。

**改法（推荐）**：加 capabilities 描述。

```ts
export type ProviderCapability =
    | "playlist"
    | "album"
    | "lyric"
    | "fullPlayback"     // 能给完整播放 URL
    | "previewPlayback"  // 仅 30s 试听
    | "personalized"

abstract class Provider extends Plugin {
    abstract readonly capabilities: ReadonlySet<ProviderCapability>

    supports(cap: ProviderCapability): boolean {
        return this.capabilities.has(cap)
    }
}
```

具体实现：
- `Mock.capabilities = new Set(["playlist", "album", "lyric", "personalized"])`（不含 fullPlayback）
- `Spotify.capabilities = new Set(["playlist", "album", "previewPlayback", "personalized"])`
- `NeteaseCloudMusic.capabilities = new Set(["playlist", "album", "lyric", "fullPlayback", "personalized"])`

UI 端：

```tsx
{provider.supports("lyric") && <LyricPanel />}
{!provider.supports("fullPlayback") && <PreviewOnlyHint />}
```

**影响面**：Provider 基类 + 三个实现 + UI 几处条件渲染。

---

### C17. `UseableManager.substituteRule` 是 PlayQueue 的私事

**位置**：`packages/manager/useable-manager.ts:5-9`

```ts
type UseableManagerSubstituteRule = "previous" | "next" | "random"
type UseableManagerOption = { substituteRule: UseableManagerSubstituteRule }
```

UseableManager 是通用容器，但替补规则纯粹是播放队列的需求（删除当前选哪首）。这个抽象在通用层不合适——而且实际上 PlayQueue 用的是自己写的 `Queue`，根本没用 UseableManager。

**改法**：要么把 UseableManager 删了（确认无人用），要么把 substituteRule 抽成 hook：

```ts
interface IUseableManager<T> {
    get current(): Readonly<T> | null
    use(id: string): void
    /** 删除当前后，由调用方决定下一个用谁 */
    onCurrentRemoved?(prevId: string, ids: readonly string[]): string | null
}
```

如果短期没人用，**直接删**最干净——`grep -r UseableManager src/` 当前没人引用。

**影响面**：删除一个文件 + 导出。

---

### C18. NCM mapping 散落，应抽 mapper

**位置**：`packages/provider/NeteaseCloudMusic.ts`

`playlistDetail` / `albumDetail` / `personalizedPlaylist` / `personalizedAlbums` / `personalizedTracks` / `persionalizedArtists` 各自把 `tr.al` / `tr.ar` 转成内部 model，重复 4–5 次，且每处的字段都略有不同（有的有 image，有的没有）。新增字段时容易漏改。

**改法**：抽 `provider/ncm/mappers.ts`：

```ts
export function mapNcmTrack(raw: any, index: number): Track { ... }
export function mapNcmAlbumStub(raw: any): Album { ... }
export function mapNcmArtist(raw: any): Artist { ... }
```

然后 `NeteaseCloudMusic.ts` 只负责发请求、调 mapper。

**影响面**：仅限 NCM 文件夹内部；行为不变。

---

### C19. PlayQueue tracks 暴露可变数组

**位置**：`packages/plugin/playqueue/queue.ts:22-24`

```ts
get tracks(): Track[] { return this._tracks }
```

外部拿到的是内部数组的同引用。在 `tracks_changed` 事件回调里，UI 边遍历边触发 `change_play_queue` 或 `select_track`，可能在迭代中把数组改了。

**改法**：

```ts
get tracks(): readonly Track[] { return this._tracks }
```

或返回 `[...this._tracks]` 副本。前者类型层面禁止修改但运行时仍是同引用；后者真复制但每次访问都分配。看权衡——TS 标记 readonly 通常足够。

**影响面**：Queue 一个 getter；调用方如果 `.push/.splice` 会被编译器报错，是好事。

---

## P2 — 死代码 / 占位

### D20. Lyric 插件没接事件总线

**位置**：`packages/plugin/lyric/index.ts`

整个 Lyric 插件没有 `on()` / `emit()`，外部没有任何代码调 `lyric.apply / play / pause / seek`。它 install 后就静止——既不监听 `play_track_ended`、也不监听 `play_time_seek`、也不订阅 provider 的歌词数据。

`keepPlay()` 里残留 `console.log(this.lyricIterator.current()?.content)`——证明它从未真正接入。

**改法（两选一）**：
1. **真接进去**：监听 `current_track_changed` → 调 `provider.lyric(id)` → `apply(lyrics)` + `play()`；监听 `play_state_changed` 同步 timer 状态；监听 `play_time_seek` 同步 seek。给 Lyric 自己 emit `lyric_line_changed: Lyric` 事件供 UI 订阅。
2. **先删掉**：保留 `model/lyric.ts` 与 `parseLyrics`，把插件本身移除，等真要做歌词面板时再写。

我倾向 **2 + 后续单独一轮做**，因为做完整还要：UI 歌词面板 + provider.lyric 真实数据接入 + 滚动定位。一次塞太多。

**影响面**：删一个文件 + `view/planet.ts` 的 `Lyric` 导入；如果走选项 1，影响面更大。

---

### D21. Analyser 启不动且没 cancel handle

**位置**：`packages/plugin/analyser/index.ts`

- `resume / suspend` 都是 `private`，外部无法调；
- rAF 没存 handle，dispose 后下一帧仍会跑（但 state === suspended 会立即 return，不至于崩）；
- `dispose` 里把 `analyserNode = null as any`。

**改法（两选一）**：
1. 真做可视化：把 `resume/suspend` 改 public，监听 `play_state_changed`，emit `frequency_data_changed: Uint8Array`，UI 加波形组件；
2. 先删，等真要可视化时再写。同样建议选 2。

**影响面**：删一个文件 + 导入。

---

### D22. 测试文件大多是 `console.log` 占位

**位置**：
- `packages/event/emitter.test.ts` — 没有断言
- `packages/shared-utils/array.test.ts` — 没有断言
- `packages/shared-utils/math.test.ts` — 没有断言
- `packages/shared-utils/function.test.ts` — 没有断言
- `packages/plugin/playqueue/repeat.test.ts` — 没有断言
- `packages/plugin/lyric/index.test.ts` — 调 play 后没等待没断言
- `packages/model/lyric.test.ts` — 没有断言
- `packages/provider/NeteaseCloudMusic.test.ts` — 真打 localhost:3000，离线就挂
- `packages/shared-utils/time.test.ts` — **唯一有真断言的**

跑 `vitest` 时除了 time 那一组，其它全是噪音覆盖率。

**改法**：
- 给 EventEmitter / Repeat / shuffleArray / getRandomInt / getNumberInRange / parseLyrics 各补几条带 `expect` 的断言；
- 把 NeteaseCloudMusic.test.ts 改成 mock fetch 或直接删（依赖外部服务的测试不该跑在 CI 默认路径）。

可以单独一个 PR 收拢，不阻塞前面的优化。

**影响面**：仅测试文件。

---

## 推荐切片

```
P0：A1 → A2 → A3 → A4+A5 → A6 → A7 → A8 → A9 → B11 → B12 → B13 → B10
                                              （一次完成，view 层只在 B10 联动）
P2：D20 + D21（删掉死代码）+ D22（补真测试，独立 PR）
P1：C16（Provider capabilities）→ C14+C15（Plugin 依赖+Planet dispose）→ C17（删 UseableManager）→ C18（NCM mapper）→ C19（readonly tracks）
```

执行顺序的理由：
- **P0 优先**：bug 是即时收益，类型一致性让后续重构有正确基础。
- **B10（Duration）放在 P0 末尾**：是 P0 里影响面最大的一条，做完之后 view 层 / provider 全部类型干净。
- **P2 在 P1 之前**：删死代码不耗思考，先减小重构面。
- **P1 内部 C16 先做**：Provider capabilities 加上后，view 层切 provider 的手感会明显改善，后续 PR 跟进 UI 条件渲染。
- **C14 + C15 一起**：依赖声明 + dispose 是同一组改 Plugin 基类、IPlanet 接口的活儿，一起做避免接口反复变。

如果要更激进：P0 + P2 + P1 一轮全做 —— 大概 1–2 工作日规模，view 层会跟着改 5–8 处。
