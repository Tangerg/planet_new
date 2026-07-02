# Planet 架构总览

Planet 是一个 Wails 桌面音乐播放器。Go 端只提供桌面壳、窗口配置和 Wails bridge；业务逻辑、播放编排、数据源接入和界面状态主要在前端完成。

本文描述当前代码结构。更细的工作约定见 `frontend/CLAUDE.md`。

---

## 1. 项目定位

- 桌面壳：Wails v2 + Go，入口是 `main.go` / `app.go`。
- 前端：React 19 + TypeScript + Vite + Tailwind v4。
- 数据：所有外部音乐数据经 `MusicProvider` 端口进入，具体实现位于 `frontend/src/providers`。
- 播放：浏览器侧 `<audio>` + Web Audio 能力，由 `core` 插件封装。
- UI：`frontend/src/ui` 是播放器界面和单页导航状态机，不直接依赖具体 provider。

```
┌─────────────────────────────────────────────────────────────┐
│                      Wails desktop shell                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ React UI                                               │  │
│  │ Shell · Screens · Components · Hooks · Zustand stores  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Application facade                                     │  │
│  │ Engine · PlaybackService · MediaService · AuthService  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Planet kernel                                          │  │
│  │ PluginContext · CapabilityRegistry · EventEmitter      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Plugins + providers                                    │  │
│  │ Playback · Queue · Progress · Volume · Lyrics · NCM    │  │
│  │ QQMusic · Spotify · Mock                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 顶层目录

```
planet_new/
├─ app.go / main.go              Wails app shell
├─ build/                        Wails packaging assets
├─ doc/                          Project docs
├─ go.mod / wails.json           Go and Wails config
└─ frontend/
   ├─ package.json               Frontend scripts and dependencies
   ├─ vite.config.ts             Vite, Tailwind, aliases, test config
   ├─ src/
   │  ├─ shared/                 Pure framework-free utilities
   │  ├─ domain/                 Models and ports
   │  ├─ core/                   Kernel, events, plugins, application services
   │  ├─ providers/              Infrastructure adapters for music sources
   │  ├─ ui/                     React interface
   │  ├─ app/                    Composition root
   │  └─ main.tsx                React entry
   └─ wailsjs/                   Wails generated JS bridge
```

---

## 3. Frontend Layers

The dependency rule is one-way:

```
shared <- domain <- core <- providers <- ui <- app
```

| Layer | Path | Role |
|---|---|---|
| Shared | `src/shared` | Small pure utilities with no framework dependency. |
| Domain | `src/domain` | Music entities, value objects, provider/auth/library ports. |
| Core | `src/core` | Planet kernel, typed event bus, plugin system, playback/application services. |
| Providers | `src/providers` | Concrete data-source adapters and mappers for NCM, QQMusic, Spotify, Mock. |
| UI | `src/ui` | React screens, components, hooks, i18n, shell navigation, Zustand bridges. |
| App | `src/app` | Runtime composition: create providers, plugins, kernel, and `Engine`. |

The rule is enforced by `frontend/scripts/check-layers.mjs`. New code should move dependencies inward through ports, services, events, or capabilities instead of importing outward.

---

## 4. Domain And Providers

`domain/ports/provider.ts` defines `MusicProvider`, the only surface the application layer uses for catalog data:

- playlist / album / artist detail
- lyrics
- playable URLs
- personalized home data
- search
- toplists
- comments

Providers declare capabilities with `ProviderCapability`, so UI and services can gracefully handle missing features. Unsupported optional methods return empty values from the base provider instead of forcing scattered `try/catch` or UI-side mocking.

Concrete providers:

| Provider | Notes |
|---|---|
| `Mock` | Offline development source, generated deterministic data. |
| `NeteaseCloudMusic` | Local NCM API service, supports richer real catalog/playback flows. |
| `QQMusic` | Local QQ Music API service. |
| `Spotify` | Spotify Web API; playback is preview-limited where available. |

Provider selection starts in `frontend/src/app/planet.ts`: all constructible providers are mounted, and `ProviderRegistry` chooses the active one by name. Runtime switching goes through the registry, not through UI imports of concrete adapters.

---

## 5. Core Kernel

The kernel is centered on three pieces:

| Piece | Path | Purpose |
|---|---|---|
| Event bus | `core/event` | Strongly typed publish/subscribe for state facts and internal choreography. |
| Capability registry | `core/kernel/capability.ts` | Plugins publish typed capabilities; services resolve them by capability key. |
| Plugin lifecycle | `core/kernel/plugin.ts` | `init` / `dispose` with shared `PluginContext`. |

`Planet` installs plugins in dependency order, rolls back on init failure, and disposes in reverse order. Plugins communicate by:

- Direct capability calls for commands with a single receiver.
- Events for state changes and cross-plugin facts.

This split is deliberate: commands like `playback.play()` return through services/capabilities; facts like `queue:current-changed` or `volume:changed` are broadcast.

---

## 6. Application Facade

`Engine` is the UI's single handle to the runtime:

- `engine.playback` wraps queue, transport, seek, volume, shuffle, repeat.
- `engine.media` reads catalog/search/detail/comment data through the active provider.
- `engine.auth` coordinates provider auth with the credential store.
- `engine.library` reads logged-in user library features when supported.
- `engine.events` exposes kernel state events for store bridges and UI hooks.
- `engine.providers` exposes provider listing and active-provider switching.

This keeps React from resolving plugins directly or importing concrete providers.

---

## 7. UI Layer

The UI is a resident single-page shell:

- `ui/Shell.tsx` composes playback, catalog, auth, navigation, context menu, shortcuts, and screens.
- Per-concern data hooks under `ui/hooks/` (catalog, library, music-video, track content, …) read through the application services with React Query for caching; `ui/model/adapters/` maps domain models into the UI display shapes (`VibeTrack` etc.).
- `ui/store/bridge.ts` mirrors kernel events into Zustand stores.
- `ui/infra/morph` and navigation hooks manage shared-element transitions between screens.

The project intentionally does not use a route-per-screen model. Navigation is a state machine inside the shell so screens can participate in the same morph/measurement context.

---

## 8. Projection And Failure Boundaries

Three conventions at the UI ↔ domain / provider seams. Documented so they read as deliberate, not as leftover shims.

**`VibeTrack.source` — the play handoff carry (not a DTO backflow).**
Screens are pure presentation and receive `VibeTrack` view models. Playing one hands the kernel a domain `Track`; rather than re-fetch or reconstruct it, each `VibeTrack` carries the `Track` it was projected from as `source`. This is load-bearing: the play queue stores domain tracks and Now Playing re-projects them **client-side**, so a lightweight id-only ref would force a re-fetch or a parallel id→Track cache — which is exactly what `source` already is. Boundary rule: only the track adapter writes `source` (it is `readonly`), and only `toTrack()` reads it back (with a minimal-synthesis fallback for hand-built view tracks such as the placeholder). Do not "remove the domain back-reference" — keep it, named honestly.

**Collection detail hint — `fetchDetail`.**
`VibeCollection.fetchDetail` answers "should opening this collection fetch full detail from the provider?" Default (undefined) = fetch; explicit `false` = tracks are already loaded (synthetic collections like Daily Mix / Liked Songs; a chart sets it `true`). It is the only meaning of that flag — the earlier dual-purpose `_real` name (a domain carrier on tracks vs. a boolean hint on collections) was split into `source` and `fetchDetail`.

**Provider read failure — one shape, no `Result` wrapper.**
`MediaService` never lets one bad read blank the app: an unsupported capability returns its fallback silently, while a *supported* read that faults returns the same fallback but reports it through `@shared/debug.warnReadFailure` — so "endpoint down" is distinguishable from "no data" in the console. Empty-but-successful is a valid result, not a fault. The UI already has the three signals separately — `media.supports(cap)` (unsupported), React Query `isError` (failed), `data.length` (empty) — so no `Result` type is threaded through every caller.

Provider mappers share one field-normalization standard (`providers/mappers/common.ts`): `toIdString` (ids → string), `singleImage` (one URL → the `Image[]` contract), `secondsToMs` (seconds → the domain's `durationMs`). Image URL-scheme building and artist-credit shaping stay provider-specific / domain-owned respectively.

---

## 9. Quality Gates

Frontend quality checks live in `frontend/package.json`:

```bash
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn knip
yarn check:circular
yarn check:layers
```

`yarn check` runs the aggregate gate. The current tests focus on pure domain/shared/core utilities; UI and provider behavior need broader test coverage as the product stabilizes.
