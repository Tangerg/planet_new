# Planet 架构总览

> 本文档解析 Planet 项目的整体架构，**重点是前端**。后端只是 Wails 提供的 Go 容器，承担窗口与桥接，业务逻辑全部在前端。

---

## 1. 项目定位

Planet 是一个基于 Wails (Go + Web) 的桌面音乐播放器：

- 渲染层使用 React + TanStack Router + shadcn/ui，靠浏览器内核呈现 UI；
- 播放、队列、歌词、音量、可视化等业务都在浏览器侧用一个**自研的插件框架**实现；
- 数据来源（网易云、Spotify、Mock 等）也以**插件**形式接入，可通过环境变量切换；
- 桌面壳由 Wails Go 端提供，本身只暴露最小的应用骨架（`main.go` / `app.go`）。

```
┌─────────────────────────────────────────────────────────────┐
│                    Wails Webview (Go shell)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                       View 层                         │   │
│  │  Pages · Layout · Components · Hooks · Stores        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Planet 内核                        │   │
│  │      Context · Plugin · EventEmitter · Manager       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                       Plugins                         │   │
│  │  Provider(Mock/Spotify/NCM) · Control · PlayQueue ·  │   │
│  │  Progress · Volume · Lyric · Analyser · ViewStore    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 顶层目录

```
planet_new/
├─ doc/                       本文档
├─ DESIGN.md                  视觉风格指南（Spotify-inspired）
├─ main.go / app.go           Wails 入口与最小 App 结构体
├─ wails.json / go.mod        Go 端配置
└─ frontend/
   ├─ index.html
   ├─ vite.config.ts          Vite 8 + Tailwind 4 + tanstackRouter
   ├─ tsconfig.*.json
   ├─ src/
   │  ├─ packages/            可独立复用的 "内核 + 插件" 层（不依赖 React）
   │  └─ view/                React UI 层（消费内核）
   └─ wailsjs/                Wails 自动生成的 JS bridge
```

`packages/` 与 `view/` 的边界是关键设计：**内核完全没有 React 依赖**，理论上可以挂到任何宿主（CLI、Electron、原生 webview）；UI 层只通过 hooks/context 与内核交互。

---

## 3. 前端分层

```
            ┌────────────────────────────────────────┐
            │  view/pages          路由页面          │
            │  view/layout         壳布局            │
            │  view/components     展示组件          │
            │  view/ui             shadcn 基础组件   │
            │  view/hooks          usePlanet/Provider│
            │  view/store          UI 局部 Zustand   │
            │  view/store-planet   把内核事件 → UI   │
React 层    └────────────────────────────────────────┘
─────────────────────────────────────────────────────
            ┌────────────────────────────────────────┐
            │  packages/core       Planet/Plugin/Ctx │
            │  packages/event      EventEmitter      │
            │  packages/manager    Manager 通用容器  │
            │  packages/plugin/*   业务插件          │
            │  packages/provider/* 数据源插件        │
            │  packages/model      纯类型定义        │
            │  packages/shared-utils  工具函数       │
内核层      └────────────────────────────────────────┘
```

依赖方向严格自上而下：UI 层引内核，内核内部 `provider`/`plugin` 引 `core` + `event` + `manager` + `shared-utils`，**不允许反向**。

---

## 4. 内核（packages）

### 4.1 三大基础设施

| 子模块 | 角色 | 关键 API |
|---|---|---|
| `event` | 强类型事件总线 | `EventEmitter<E>`、`on/once/off/emit` |
| `manager` | 通用容器（按 id 存取一组对象） | `Manager<T>`、`UseableManager<T>` |
| `core` | 把上面两者拼成 Planet 实例 | `Planet`、`Plugin`、`Context` |

#### EventEmitter — 类型化事件中心

```ts
interface IEventMap { [key: string]: any }
class EventEmitter<E extends IEventMap> {
  on/once/off/emit<K extends keyof E>(...)
}
```

通过 TypeScript [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)，每个插件在自己文件里**追加事件类型**：

```ts
// plugin/control/index.ts
declare module "../../core/event" {
  interface PlanetEventMap {
    play: never
    pause: never
    play_state_changed: PlayState
    play_track_ended: never
  }
}
```

结果：UI 写 `planet.hooks.emit("play_state_changed", PlayState.PAUSED)` 时，编译器知道这个事件存在且 payload 必须是 `PlayState`。**事件契约是去中心化定义的**，谁定义谁负责，无需维护一份大型 union 类型。

#### Manager — 容器抽象

`Manager<T extends IManageable>` 管理一堆有 `id` 的对象（apply/add/remove/get/has/size），`UseableManager` 在 Manager 之上加 `current` 概念和"删除当前后选谁"的策略（previous/next/random）。

**两个用处：**
1. `Planet` 内部用 `Manager<IPlugin>` 装所有插件，`getPlugin(id)` 直接取出；
2. 业务层（比如歌词的 LyricIterator）也可以复用同套模式。

#### Context — 插件共享上下文

```ts
interface IContext {
  audioElement: HTMLAudioElement
  audioContext: AudioContext
  hooks: IEventEmitter<PlanetEventMap>
}
```

所有插件共享**同一个** `<audio>` 元素和 `AudioContext`，加同一个事件总线。Control 控制 audio 播放、Progress 监听 timeupdate、Analyser 接 AudioContext 做频谱、Volume 控 audio 音量——它们之间不直接耦合，全部通过 `hooks` 触发/监听事件。

---

### 4.2 Plugin 生命周期

```
new Plugin()
   │
   ├── beforeInstall()      创建期；尚无 context
   ├── install(ctx)         由 Planet 调用，把 context 注入；插件内部存住 _context
   ├── afterInstall()       推荐在这里订阅事件、监听 audio
   │
   │     …… 运行期，处理事件、操作 audioElement ……
   │
   ├── beforeUninstall()    默认调用 dispose()
   ├── uninstall()          清掉 context
   └── afterUninstall()
```

`Plugin` 抽象基类已经把 `install/uninstall` 的样板写好，子类只需要：
- `get id()`：唯一标识
- `dispose()`：清理订阅
- 在 `afterInstall()` 里订阅事件、注册 audio 监听

`context` 是 getter，未安装时访问会抛错——比"为空时返回 null"更早暴露错误。

---

### 4.3 现有插件目录

| 插件 | 职责 | 监听的事件 | 发出的事件 |
|---|---|---|---|
| **Control** | 把事件翻译成 audio 操作 | `play`、`pause`、`current_track_changed`、`audio.ended` | `play_state_changed`、`play_track_ended` |
| **PlayQueue** | 维护两个队列（display + 实际播放）、随机/重复模式 | `change_play_queue`、`next_track`、`previous_track`、`select_track`、`change_repeat_mode`、`change_shuffle_enable`、`play_track_ended` | `play_queue_changed`、`current_track_changed`、`repeat_mode_changed`、`shuffle_enable_changed` 等 |
| **Progress** | 把 audio 的 timeupdate / durationchange 转成事件，提供 seek | `play_time_seek`、audio 原生事件 | `track_duration_changed`、`play_time_changed` |
| **Volume** | 维护音量、静音/取消静音 | `change_volume`、`mute_or_unmute` | `volume_changed` |
| **Lyric** | LRC 解析 + 计时器同步行 | （内部驱动，外部用 `lyric.apply/play/pause/seek`） | console 输出（占位） |
| **Analyser** | Web Audio AnalyserNode 接 AudioContext，60fps 取频谱 | （内部驱动） | （目前 console，预留可视化用） |
| **Provider** *(plugin)* | 数据源抽象，所有具体数据源（NCM / Spotify / Mock）都是 Provider 的子类 | — | — |
| **Store**（在 view/store-planet） | 把 `play_queue_changed` 等事件桥到 Zustand UI store | `play_queue_changed` | 写 Zustand |

#### PlayQueue 的双队列设计

PlayQueue 内部维护两个 `Queue`：

- `displayQueue` — 用户视角的顺序，渲染队列 UI；
- `playQueue` — 真正的播放顺序；shuffle 开启时 = `displayQueue` 打乱后的副本。

切歌时通过 `playQueue.next()` 决定下一首，再用 `displayQueue.select(playQueue.current)` 把高亮同步到展示队列。这样 shuffle 模式下用户看到的列表顺序不变，但播放跳跃。

`Repeat` 是一个独立的状态机，三个值循环（OFF → ONE → ALL）。`autoNext()` 在收到 `play_track_ended` 时根据它决定行为。

---

### 4.4 Provider — 数据源插件

`Provider` 既是插件，也是接口：

```ts
abstract class Provider extends Plugin implements IProvider {
  static readonly PLUGIN_ID = "provider"   // 同一时刻只挂一个
  get id() { return Provider.PLUGIN_ID }
  dispose() {}                             // 默认空，子类按需

  abstract get name(): string              // 数据源标识，给 UI 看
  abstract playlistDetail(id): Promise<Playlist>
  abstract albumDetail(id): Promise<Album>
  abstract lyric(id): Promise<Lyric[]>
  abstract playUrls(ids): Promise<TrackPlayUrl[]>
  abstract personalized(): Promise<Personalized>
}
```

| 实现 | 数据源 | 备注 |
|---|---|---|
| `NeteaseCloudMusic` | 第三方反向工程 API（默认 `localhost:3000`，Binaryify/NeteaseCloudMusicApi） | 需要本地起服务 |
| `Spotify` | `api.spotify.com/v1` + Client Credentials | 没有完整播放 URL（仅 30s preview）、没有歌词；client_secret 暴露在 bundle |
| `Mock` | 完全前端生成（hash → seed → PRNG） | 默认。封面用内嵌 SVG 渐变，无需任何外部依赖 |

**为什么 Provider 用固定的 `PLUGIN_ID`：** Manager 按 id 索引，同一个 id 只能注册一次。这意味着系统里同时只能有一个 Provider 是活跃的；UI 通过 `planet.getPlugin<Provider>(Provider.PLUGIN_ID)` 拿到当前 Provider 而不关心它是哪一种。切换源 = 重新装载一个 Provider。

切换通过 `view/planet.ts` 里的 `createProvider()` 工厂决定：

```ts
switch (env.VITE_PROVIDER) {
  case "spotify": return new Spotify({ clientId, clientSecret, market })
  case "netease": return new NeteaseCloudMusic({ host })
  case "mock":
  default:        return new Mock()
}
```

---

## 5. View 层

### 5.1 入口与 Provider 树

`view/main.tsx`：

```
PlanetProvider (planet 实例)
└── QueryClientProvider (react-query)
    └── TooltipProvider (shadcn)
        └── RouterProvider (TanStack Router)
            └── RootRoute → <Basic />
```

- `PlanetProvider` 通过 React Context 把 `planet` 实例暴露给 hooks；
- `QueryClient` 用于服务端数据（playlist/album/personalized）；
- `RouterProvider` 处理路由（home/album/playlist）。

### 5.2 路由与页面

由 `@tanstack/router-plugin/vite` 自动从 `view/pages/*` 生成 `route.tsx`：

```
/home/                 列出推荐 playlists / albums / artists
/album/$albumId        专辑详情 + 曲目表
/playlist/$playlistId  歌单详情 + 曲目表
```

页面组件极薄，只负责：
1. `useProvider()` 拿当前数据源；
2. `useQuery(...)` 调 `provider.xxx()` 拉数据；
3. 把数据塞给 `Banner` / `TrackList` / `CardFlow`。

点击曲目时：

```
  page.onRowClick(track)
    → provider.playUrls(ids)             // 获取真正可播放的 URL（Mock 返回空）
    → planet.hooks.emit("change_play_queue", { tracks, track })
        ← PlayQueue 接到事件，更新内部队列、emit "current_track_changed"
            ← Control 接到事件，audioElement.src = playUrl，audio.play()
            ← UI Meta/Control 各自更新（歌曲名、按钮状态、进度条）
```

UI 不直接控制 audio。

### 5.3 布局

`view/layout/basic`：固定 grid

```
┌──────┬──────────────────────────┐
│ nav  │ header                   │
│      ├──────────────────────────┤
│      │ view (Outlet)            │
│      │                          │
├──────┴──────────────────────────┤
│ player                          │
└─────────────────────────────────┘
+ Queue (Sheet, 右侧滑出)
```

每块都是独立组件（nav / header / player / queue / view），通过 Tailwind 类直接落到 DESIGN.md 的色板与几何上。

### 5.4 UI 组件

| 目录 | 内容 |
|---|---|
| `view/ui` | shadcn 基础原子（button、avatar、slider、tooltip、scroll-area、sheet、card） |
| `view/components` | 业务组件（banner、card-flow、title、track-item、track-list） |
| `view/lib/cn.ts` | `clsx + tailwind-merge` 合并类名 |

样式策略：
- Tailwind 4 的 CSS-first 配置：所有 token（颜色 / 字体 / 阴影 / 半径）放在 `view/index.css` 的 `@theme` 块，组件里直接写 `bg-surface text-text-muted` 这种语义类；
- 动画用 `motion` 包（`motion/react`）和 `tw-animate-css`；
- 没有 CSS-in-JS，没有运行时样式生成。

### 5.5 Hooks

| Hook | 作用 |
|---|---|
| `usePlanet()` | 从 Context 拿 planet 实例 |
| `useProvider<T>()` | `planet.getPlugin<T>(Provider.PLUGIN_ID)` 的快捷封装 |
| `useVolume()` | 订阅 `volume_changed` 事件，返回响应式 volume |

模式：UI 想消费某个内核状态时，写一个 hook 用 `useEffect` 订阅事件，把值放到 React state。**不要尝试在内核里做 React 状态**。

### 5.6 Store

两套 store 共存，故意分层：

- `view/store/app` — 纯 UI 局部状态（如 Queue 抽屉是否打开），不需要内核知道；
- `view/store/playqueue` — 镜像内核里的 PlayQueue，给 UI 当 selector；
- `view/store-planet` — **内核插件**，唯一职责是把内核事件桥到上面的 Zustand store。

这种设计的理由：UI 用 React 习惯订阅 store，但内核要保持 React 无关。`store-planet` 是这两套世界的胶水，只有它知道两边。

---

## 6. 数据流（端到端）

以"用户点歌单里某首歌"为例：

```
1. User clicks <li>      (TrackList)
2. onRowClick(track)
3. const urls = await provider.playUrls(ids)
                    ─────► fetch / mock data
4. mutate tracks[].playUrl
5. planet.hooks.emit("change_play_queue", {key, tracks, track})

   ┌──── PlayQueue ────────────────────────────────┐
   │ - displayQueue.apply(tracks)                  │
   │ - playQueue.apply(shuffleEnable ? shuffled    │
   │                                  : tracks)    │
   │ - select track                                │
   │ - emit "play_queue_changed", "current_track_changed"│
   └───────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   Control            Store-planet      UI Meta
   audio.src=url      → Zustand          (订阅 current_track_changed
   audio.play()                            刷新 thumbnail + title)
   emit play_state_changed

   ┌──── Progress（audio 'timeupdate'）────┐
   │ emit play_time_changed                │  ───► UI 进度条
   │ emit track_duration_changed           │
   └───────────────────────────────────────┘
```

整个过程**单向、事件驱动**：UI 发事件 → 插件改状态 → 插件再发事件 → UI 渲染。没有 UI 直接 mutate 内核内部状态的路径。

---

## 7. 构建与运行

### 7.1 工具栈版本（截止当前）

- **React 19**、**Vite 8**、**TypeScript 6**
- **Tailwind 4**（CSS-first，`@tailwindcss/vite`）
- **motion 12**（前身是 framer-motion）
- **TanStack Router 1.x** + **TanStack Query 5.x**
- **shadcn/ui**（手挑组件，源码在 `view/ui`）+ **Radix Primitives**
- **Zustand 5**、**ky 2**、**lucide-react 1**

### 7.2 命令

```bash
# frontend/
yarn dev         # vite dev server，默认走 Mock provider
yarn build       # tsc 类型检查 → vite 打包到 dist/
yarn test        # vitest

# 根目录
go build ./...   # 后端编译（仅在用 wails 整体打包时关心）
wails dev        # 整合 Wails 桌面外壳启动
```

### 7.3 切换数据源

复制 `.env.example`（如有）到 `frontend/.env`：

```
VITE_PROVIDER=mock                              # 不写也是 mock
# VITE_PROVIDER=netease
# VITE_NETEASE_HOST=http://localhost:3000
# VITE_PROVIDER=spotify
# VITE_SPOTIFY_CLIENT_ID=...
# VITE_SPOTIFY_CLIENT_SECRET=...
# VITE_SPOTIFY_MARKET=US
```

---

## 8. 扩展指南

### 8.1 新增一个事件

1. 在使用方插件的文件里：
   ```ts
   declare module "../../core/event" {
     interface PlanetEventMap {
       my_new_event: { foo: string }
     }
   }
   ```
2. 直接 `planet.hooks.emit("my_new_event", { foo: "bar" })` / `on("my_new_event", handler)`。
   编译器自动知道 payload 类型。

### 8.2 新增一个业务插件

1. 在 `packages/plugin/<name>/index.ts` 里 `class X extends Plugin`，实现 `id` + `dispose`；
2. `afterInstall()` 里订阅事件、监听 audio；
3. 在 `view/planet.ts` 的 `plugins: [...]` 数组里 `new X()`。

### 8.3 新增一个数据源

1. 在 `packages/provider/<Name>.ts` 里 `class Y extends Provider`，实现 5 个抽象方法；
2. 把字段映射成 `model/*` 里定义的 Track / Album / Playlist / Lyric 类型；
3. 在 `packages/provider/index.ts` 里导出，加进 `view/planet.ts` 的 `createProvider()` 分支。

### 8.4 新增一个页面

1. 在 `view/pages/<route>/index.lazy.tsx` 里写组件，导出 `Route = createLazyFileRoute(...)`；
2. tanstackRouter 插件会自动重写 `route.tsx`；
3. 在 nav 里加链接。

### 8.5 新增一个 UI 设计 token

直接编辑 `view/index.css` 的 `@theme` 块，添加 `--color-foo: ...`，Tailwind 4 自动暴露成 `bg-foo` / `text-foo`。

---

## 9. 设计取舍速记

| 决策 | 取舍 |
|---|---|
| 自研事件 + 插件框架，而不是用现成库（如 Redux Toolkit） | **+** 内核完全 React 无关，可移植；事件类型靠 declaration merging 去中心化定义 **−** 重复造轮子，社区生态不可复用 |
| Provider 用固定 `PLUGIN_ID` | **+** UI 只关心"当前 provider"，切换 = 替换插件 **−** 不支持多 provider 同时挂载（但目前没这需求） |
| UI 状态用 Zustand，不接事件 store | **+** React 友好；selector 拆分清楚 **−** 多了 `store-planet` 胶水层 |
| Tailwind 4 + tw-animate-css，禁 CSS-in-JS | **+** 零运行时样式开销，token 与 DESIGN.md 一一对应 **−** 复杂条件样式靠 `cn()` 拼字符串，可读性比 styled-components 略差 |
| Mock 默认 provider | **+** 任何机器 `yarn dev` 即可看 UI **−** 新人可能误以为这是真数据 |
| audio 操作集中在 Control 一个插件 | **+** 唯一事实源；其它插件通过事件跟它解耦 **−** 多曲目同时播放（如音效叠加）需要再设计 |

---

## 10. 已知遗留 / 后续方向

- **Spotify 完整播放**：当前只用 Client Credentials，拿不到完整播放 URL。要实打实播放 Spotify 需要接入 Web Playback SDK（Premium 账号）+ Authorization Code with PKCE。
- **网易云官方 OpenAPI**：`openapi.music.163.com` 需要 RSA 签名 + AppKey 鉴权，浏览器侧无法安全做。建议在 Wails Go 端写一个签名代理（`/api/*` → 转发到 `openapi.music.163.com`），把 secret 留在 Go 进程里。
- **Lyric 的 UI**：插件目前只在 console 输出当前行；UI 端歌词面板还没接。
- **Analyser 的 UI**：频谱数据已经 60fps 在跑，缺一个可视化组件消费 `frequencyData`。
- **测试**：`shared-utils` 有单测，业务插件（PlayQueue、Lyric）和 UI 没有覆盖。
- **打包体积**：单个 chunk 接近 380kB（gzip 119kB），可以拆 motion 与 router-devtools 做 manualChunks。
