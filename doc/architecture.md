# Planet 架构总览

Planet 是一个 Wails 桌面音乐播放器。Go 端主要提供桌面壳、窗口配置和 Wails bridge；业务逻辑、播放编排、数据源接入和界面状态主要在前端完成。例外是**本地音乐库**：文件夹扫描、SQLite 元数据、音频流服务在 Go 侧（`backend/` 包，与 `frontend/` 对称），经 Wails 桥接暴露给前端的 `LocalMusic` provider。根目录只保留 `main.go`（入口 + `backend.New()` 组装）。

本文只描述当前代码事实，最后核对日期为 2026-07-11。演进目标与执行进度见 `doc/ddd-clean-architecture-roadmap.md`，更细的前端工作约定见 `frontend/CLAUDE.md`。

---

## 1. 项目定位

- 桌面壳：Wails v2 + Go，入口 `main.go`（根目录唯一 `.go`），后端在 `backend/`（组合根 `backend.App` + 音乐库适配器）。
- 前端：React 19 + TypeScript + Vite + Tailwind v4。
- 数据：所有外部音乐数据经按上下文拆分的 Catalog/Playback/Identity/Account Library/Engagement 端口进入，具体实现位于 `frontend/src/providers`。
- 播放：浏览器侧 `<audio>` + Web Audio；领域和应用层只依赖端口，浏览器资源由 `infrastructure/audio` 创建并注入 Kernel。
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
│  │ Engine · context use cases · explicit QueryResult       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Planet kernel                                          │  │
│  │ PluginContext · CapabilityRegistry · EventEmitter      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Runtime plugins + outer adapters                       │  │
│  │ Playback · Queue · Lyrics · Web Audio · NCM · QQ       │  │
│  │ Spotify · Local/Wails · credentials · random           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

`Local` reaches down into the Go `backend` package (below) over the Wails bridge;
the others are network API adapters.

---

## 2. 顶层目录

```
planet_new/
├─ main.go                       Wails entry (root's only .go; assembles via backend.New)
├─ backend/                      Go desktop-shell side, clean-architecture layers:
│    domain/                       framework-free entities, value objects, ports
│    application/                  use-case service (orchestration, FolderPicker port)
│    sqlite/ scan/ media/          port implementations (repo, scanner, loopback server)
│    app.go / library.go / dto.go  composition root + Wails-bound adapter + wire DTOs
├─ build/                        Wails packaging assets (incl. darwin ATS plist)
├─ doc/                          Project docs
├─ go.mod / wails.json           Go and Wails config
└─ frontend/
   ├─ package.json               Frontend scripts and dependencies
   ├─ vite.config.ts             Vite, Tailwind, aliases, test config
   ├─ src/
   │  ├─ shared/                 Pure framework-free utilities
   │  ├─ domain/                 Models and ports
   │  ├─ core/                   Kernel, events, runtime plugins, internal use-case implementations
   │  ├─ contexts/               Bounded-context public APIs and shared contracts
   │  ├─ providers/              Infrastructure adapters for music sources
   │  ├─ infrastructure/         Web Audio and random-source adapters
   │  ├─ ui/                     React interface
   │  ├─ app/                    Composition root
   │  └─ main.tsx                React entry
   └─ wailsjs/                   Wails generated JS bridge
```

---

## 3. Frontend Layers

The dependency graph is one-way; arrows point toward dependencies:

```
shared <- domain <- core/contexts
providers/infrastructure -> core/contexts
ui                       -> core/contexts
app                      -> providers/infrastructure + ui + core/contexts
```

UI and infrastructure adapters are siblings: both depend inward on context contracts, and UI may not import concrete providers. The app composition root is the only layer that knows both sides and wires them together.

| Layer          | Path                 | Role                                                                                           |
| -------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| Shared         | `src/shared`         | Small pure utilities with no framework dependency.                                             |
| Domain         | `src/domain`         | Music entities, value objects, provider/auth/library ports.                                    |
| Core           | `src/core`           | Planet kernel, typed event bus, plugin system and internal application services.               |
| Contexts       | `src/contexts`       | Stable public APIs for bounded contexts/modules and cross-context contracts.                   |
| Providers      | `src/providers`      | Concrete data-source adapters and anti-corruption mappers for NCM, QQMusic, Spotify and Local. |
| Infrastructure | `src/infrastructure` | Browser/runtime adapters such as `WebAudioRuntime` and `SystemRandom`.                         |
| UI             | `src/ui`             | React screens, components, hooks, i18n, shell navigation, Zustand bridges.                     |
| App            | `src/app`            | Runtime composition: create providers, plugins, kernel, and `Engine`.                          |

The rule is enforced by `frontend/scripts/check-layers.mjs`. New code should move dependencies inward through ports, services, events, or capabilities instead of importing outward.

Playback, Catalog, Identity and Engagement have context/module-level public surfaces under `frontend/src/contexts/{playback,catalog,identity,engagement}`. The Go-owned Local Library, Account Library and shared ProviderId/TrackKey/QueryResult contracts publish through the same directory. UI and the application composition root consume use cases, stable snapshots/value objects and ports through `@contexts/<context>`; direct imports of guarded domain/application/plugin/Wails internals are rejected by the architecture check. `@core` is now only the runtime/kernel facade and no longer re-exports business contexts.

### 3.1 Bounded contexts and public surfaces

| Public surface              | Owns                                                                      | Main collaborators                                    |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| `@contexts/catalog`         | Track/Album/Artist/Playlist/MV snapshots, catalog ports and queries       | Provider catalog adapters                             |
| `@contexts/playback`        | PlayQueue, playback intent/policy, transport ports and playback use cases | Kernel runtime plugins, provider resolvers, Web Audio |
| `@contexts/identity`        | Account/session, identity gateway and credential contract                 | Provider auth adapter, local credential store         |
| `@contexts/engagement`      | Likes, comments and provider-backed play history                          | Provider engagement ports                             |
| `@contexts/account-library` | Logged-in user's remote playlists/tracks                                  | Provider user-library port                            |
| `@contexts/local-library`   | Stable Wails error/result protocol for the Go-owned local library         | Wails adapter and Local provider                      |
| `@contexts/contracts`       | Cross-context ProviderId, TrackKey and QueryResult                        | All contexts at explicit seams                        |

The context folders are the stable import boundary; some implementation files still physically live under `domain/` and `core/application/`. This is intentional current structure, not a second public API. Moving implementation files is not required for dependency inversion, and external consumers may not deep-import them.

---

## 4. Domain And Providers

`domain/ports/provider.ts` defines `MusicSource`, an infrastructure registration composed from context ports. Application services do not consume this composition directly: `MediaService` receives `CatalogSource`, `PlaybackService` receives `PlaybackResolverRegistry`, and identity/library services receive their dedicated source ports.

- playlist / album / artist detail
- lyrics
- playable URLs
- personalized home data
- search
- toplists
- comments

Each source registers its actual implementations in `CatalogPorts` and `EngagementPorts` plus Playback/Lyrics/Identity/User Library slots. A null slot means unsupported; there is no parallel capability string and the provider base class has no empty optional implementations. `MediaService.availability` and `EngagementService.availability` project registered ports into named UI booleans, so navigation/query gating uses the same truth source as execution.

Concrete providers:

| Provider            | Notes                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `NeteaseCloudMusic` | Local NCM API service, supports richer real catalog/playback flows; the default/fallback provider.  |
| `QQMusic`           | Local QQ Music API service.                                                                         |
| `Spotify`           | Spotify Web API; playback is preview-limited where available.                                       |
| `LocalMusic`        | On-device library via the Go `backend` package over the Wails bridge; full playback of local files. |

Provider construction starts in `frontend/src/app/planet.ts`; the real plugin graph is assembled by `frontend/src/app/composePlanet.ts`. NCM, QQ Music and Local are always mounted, while Spotify is mounted only when credentials exist. `ProviderRegistry` chooses the active source by stable `ProviderId` (`netease`, `qqmusic`, `spotify`, `local`). Runtime switching goes through the registry, not through UI imports of concrete adapters. Provider `name` is diagnostic/display metadata only; credentials, React Query caches and plugin ids use `ProviderId`, so localization or renaming cannot mix source state.

**On-device library (Go `backend` package).** The Go side mirrors the frontend's clean-architecture layering, one package per layer with the dependency rule pointing inward: `domain` (framework-free entities, value objects `TrackID`/`Duration`/`Cover`, scan-completeness rules, tag normalization, and ports) ← `application` (framework-free scan/read use cases, depending only on ports including `FolderPicker`, `Clock`, scanner and catalog) ← `sqlite` (repository), `scan` (filesystem + tag reader), `media` (loopback server) as port implementations ← the `backend` package itself (composition root `App` + Wails-bound `Library` adapter).

Detail lookups cross Wails as explicit `found` / `notFound` results; scans cross as `cancelled` / `partial` / `complete`, while a missing desktop bridge is `unavailable` in the frontend contract. Errors retain their Go cause internally but cross Wails only as stable `code + operation` data (`notFound`, `unavailable`, `incomplete`, `cancelled`, `failed`). Wails lifecycle context is propagated through application, scanner, SQLite and outbound HTTP work. An incomplete filesystem observation may upsert readable tracks but can never prune unseen rows; only a complete `ScanSnapshot` has deletion authority. Scan writes are transactional and cancellation rolls back the transaction.

SQLite startup applies ordered, transactional migrations tracked by `PRAGMA user_version`; it validates the expected table shape after migration and rejects databases created by a newer application version. `App` owns the SQLite catalog and HTTP server, rolls back partially initialized infrastructure, and closes resources in reverse order through Wails `OnShutdown`. Audio + cover art are streamed by the loopback server (`http.ServeContent`, so Range/seek work); each local track gets an absolute `http://127.0.0.1:<port>/media/<id>` URL. Remote URLs used only by the Web Audio analysis probe go through an authenticated `/stream` proxy with private-network blocking, guarded DNS dialing, redirect limits, and connection/header timeouts. A standalone server is used because the Wails asset handler diverges on media/range requests between dev and platforms. macOS needs the loopback ATS exception in `build/darwin/Info*.plist`. The `LocalMusic` provider reaches the Go service through the guarded Wails adapter, maps generated neutral wire DTOs into domain entities, and receives already-resolved local playback URLs. Settings triggers scans through the native folder-dialog adapter.

---

## 5. Core Kernel

The kernel is centered on three pieces:

| Piece               | Path                        | Purpose                                                                      |
| ------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| Event bus           | `core/event`                | Strongly typed publish/subscribe for state facts and internal choreography.  |
| Capability registry | `core/kernel/capability.ts` | Plugins publish typed capabilities; services resolve them by capability key. |
| Plugin lifecycle    | `core/kernel/plugin.ts`     | `init` / `dispose` with shared `PluginContext`.                              |

`Planet` installs plugins in dependency order, rolls back on init failure, and disposes in reverse order. Plugins communicate by:

- Direct capability calls for commands with a single receiver.
- Events for state changes and cross-plugin facts.

This split is deliberate: commands like `playback.play()` return through services/capabilities; facts like `queue:current-changed` or `volume:changed` are broadcast.

`Planet` does not construct browser resources. `WebAudioRuntime` owns the audible element, analysis elements and `AudioContext`; it is injected through `AudioRuntimePort` and disposed exactly once on normal teardown or startup rollback. `PlayQueue` receives a `RandomSource`, so shuffle tests do not depend on ambient randomness. Pending `audio.play()` continuations are generation-guarded and cannot publish through a disposed plugin.

---

## 6. Application Facade

`Engine` is the UI's single handle to the runtime:

- `engine.playback` wraps queue, transport, seek, volume, shuffle, repeat.
- `engine.media` reads catalog/search/detail data through the active provider.
- `engine.identity` coordinates the active identity gateway with validated on-device session storage.
- `engine.engagement` owns provider-backed Likes, Comments and PlayRecord use cases; session-only history remains a UI projection.
- `engine.library` reads logged-in user library features when supported.
- `engine.events` exposes kernel state events for store bridges and UI hooks.
- `engine.providers` exposes provider listing and active-provider switching.

This keeps React from resolving plugins directly or importing concrete providers.

### 6.1 Frontend core flow

```text
React UI
  -> Engine context use case
  -> minimal context port / kernel capability
  -> active provider adapter or runtime plugin
  -> domain snapshot / QueryResult / state event
  -> UI projection + React Query/Zustand
```

Browse-source selection and queue identity are deliberately separate. Switching the active provider changes future catalog queries, but an existing queue item retains its own `ProviderId`; playback URL resolution therefore selects the resolver by the queued item's source, not by the current browse source.

### 6.2 Local-library flow

```text
Settings / LocalMusic
  -> guarded Wails adapter
  -> backend.Library wire adapter
  -> application.Service (context + use-case policy)
  -> scanner / SQLite ports
  -> transactional persistence
  -> neutral wire DTO
  -> Local provider mapper
  -> Catalog domain snapshot
```

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

The following conventions define the UI ↔ domain/provider seams and are load-bearing parts of the current architecture.

**`VibeTrack.source` — the play handoff carry (not a DTO backflow).**
Screens are pure presentation and receive `VibeTrack` view models. Playing one hands the kernel a domain `Track`; rather than re-fetch or reconstruct it, each `VibeTrack` carries the `Track` it was projected from as `source`. This is load-bearing: the play queue stores domain tracks and Now Playing re-projects them **client-side**, so a lightweight id-only ref would force a re-fetch or a parallel id→Track cache — which is exactly what `source` already is. Boundary rule: only the track adapter writes `source` (it is `readonly`), and only `toTrack()` reads it back (with a minimal-synthesis fallback for hand-built view tracks such as the placeholder). Do not "remove the domain back-reference" — keep it, named honestly.

**Collection detail hint — `fetchDetail`.**
`VibeCollection.fetchDetail` answers "should opening this collection fetch full detail from the provider?" Default (undefined) = fetch; explicit `false` = tracks are already loaded (synthetic collections like Daily Mix / Liked Songs; a chart sets it `true`). It is the only meaning of that flag — the earlier dual-purpose `_real` name (a domain carrier on tracks vs. a boolean hint on collections) was split into `source` and `fetchDetail`.

**Provider read failure — explicit application result.**
`MediaService` returns an application `QueryResult`: `success(data)` (including valid empty data), `unsupported`, `notFound`, `failed(error)`, or `partial(data, errors)` for useful multi-request results. The UI adapter maps unsupported/not-found to each view's chosen empty state, uses partial data, and throws failed results into React Query/error handling. Result wrappers stop at this application/UI boundary; domain entities and provider ports continue to use ordinary domain values.

**Track identity vs playback key.**
Cross-source identity is `TrackKey = (ProviderId, Track.id)` and is used for queue matching, history, likes, navigation identity and cache isolation. Stream URL resolution uses `Track.playbackId` within that provider instead. `id` and `playbackId` are often the same (NCM / Spotify), but not guaranteed: QQ chart rows may expose a numeric `songId` while playback resolution needs `songmid`. A track without `playbackId` is not provider-resolvable even if it has an `id`; this keeps list UI from promising playback that the provider cannot actually start.

**Audible playback vs analysis source.**
The playback plugin always loads `Track.playUrl` directly into the audible `<audio>` element. Web Audio visualization is a separate analysis-only path: `AudioEngine` owns a hidden probe element, and only that probe may use a `MediaAnalysisSourceResolver` to resolve a CORS-clean loopback/proxy URL. Do not route the audible player through the analysis resolver — provider playback compatibility is more important than sampling convenience, and the probe can fail back to idle motion without muting the real player.

**MV availability is separate from track playback availability.**
`MusicVideo.playbackAvailability(video, policy)` owns MV-specific rules (missing MV id, provider unsupported, URL not yet resolved, resolved-but-missing URL, provider licence unavailable). Do not fold MV state into `Track.isUnavailable()`; songs and official music videos are related media, but their playback resolution paths and failure reasons differ.

Provider mappers share one field-normalization standard (`providers/mapping.ts`): `toIdString` (ids → string), `singleImage` (one URL → the `Image[]` contract), `secondsToMs` (seconds → the domain's `durationMs`). Image URL-scheme building and artist-credit shaping stay provider-specific / domain-owned respectively.

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

The repository-wide gate is `make check`. It builds the production bundle before compiling the root Go package (which embeds `frontend/dist`), runs Go vet/race and `govulncheck` with the patch toolchain declared by `go.mod`, and then runs the frontend aggregate checks. The standalone Go targets have the same frontend-build prerequisite, so a clean checkout and a developer tree use the same dependency graph. For frontend-only work use `yarn run check`; bare `yarn check` is a Yarn Classic built-in and must not be used as the project gate.

Vitest enforces separate coverage thresholds for domain, application, Local provider, Local Library contract and Web Audio adapter code; a global average cannot hide a critical-layer gap. Architecture checks reject outward dependencies, cross-context deep imports, old context paths/Provider APIs, direct Wails access outside approved adapters, browser audio construction in core, and ambient clock/random access in domain/application. Core E2E coverage exercises a real two-source Engine graph (browse → play → switch source → continue old queue → dispose) and a real local WAV flow (Scanner → Application → SQLite → Wails read → shutdown).

CI uses the same `make check` entrypoint on macOS for pushes to `main` and pull requests. Remote-run evidence and the current closure status are recorded separately in the roadmap.
