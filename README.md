# PLANET

一个 **Wails 桌面音乐播放器** —— Go 壳 + React 19 / TypeScript 前端。微内核 + 插件架构,所有数据经 `MusicProvider` 抽象接入(网易云 / QQ / Spotify / Mock 可切换)。

> 架构法则与开发约定见 [`frontend/CLAUDE.md`](frontend/CLAUDE.md)。

---

## 环境要求

- **Go** 1.25+(确保 `go` 在 `PATH`,通常需 `/usr/local/go/bin` 与 `~/go/bin`)
- **Node** 18+ 与 **Yarn**(classic 1.x)
- **Wails CLI** v2.12（`go install github.com/wailsapp/wails/v2/cmd/wails@latest`）
- 一个**数据源后端**(见下)——除非用 `mock`

---

## 启动

应用本身不直接抓数据,而是通过 provider 调用一个**本地运行的 API 服务**取数。所以启动分两步:**先起数据后端,再起应用**。

### 1. 数据后端(provider service)

按需选其一(默认走网易云):

#### 网易云音乐 —— NeteaseCloudMusicApiEnhanced(增强版 + 解灰,默认)

社区维护的网易云音乐 API **增强版**,带解灰(unlock)、FLAC 等能力。

- 仓库:**https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced**
- 启动(示例,跑在 `:3300`):

  ```bash
  git clone https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced.git
  cd api-enhanced
  npm install
  PORT=3300 ENABLE_FLAC=true node app.js
  ```

  端口需与前端 `VITE_NETEASE_HOST` 一致(见下)。

#### QQ 音乐(可选)—— Rain120/qq-music-api

- 仓库:**https://github.com/Rain120/qq-music-api**
- 启动后默认跑在 `:3200`。

#### Mock(无需后端)

`VITE_PROVIDER=mock`:走真实取数路径但使用内置假数据,适合纯前端 / 离线开发。

### 2. 选择 provider(`frontend/.env.local`)

```ini
# 网易云(默认)
VITE_PROVIDER=netease
VITE_NETEASE_HOST=http://localhost:3300

# 切到 QQ 音乐:
# VITE_PROVIDER=qqmusic
# VITE_QQMUSIC_HOST=http://localhost:3200

# 纯前端无后端:
# VITE_PROVIDER=mock
```

`VITE_PROVIDER` 取值:`netease` | `qqmusic` | `spotify` | `mock`(缺省回退 `mock`)。`VITE_*_HOST` 必须与数据后端实际监听的端口一致。

### 3. 启动应用(前后端一起)

在**仓库根目录**跑 `wails dev` —— 它会自动起 Vite(前端 HMR)+ Go(桌面壳),并生成 Go↔JS 绑定:

```bash
export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"
wails dev
```

- 桌面窗口会自动打开。
- 想在浏览器里调试并调用 Go 方法:打开 http://localhost:34115 。
- 后端数据服务没起时,相关页面会显示诚实空态(不会崩);想要有数据的体验就先起 provider 后端,或用 `VITE_PROVIDER=mock`。

#### 只跑前端(可选)

```bash
cd frontend
yarn install
yarn dev          # Vite 开发服务器 :5173
```

> 注意:单跑 `yarn dev` 不会启动 Go 壳与原生窗口(无边框窗口 / 红绿灯等桌面能力缺失),日常开发请用根目录的 `wails dev`。

---

## 构建

```bash
wails build       # 产出可分发的 PLANET 应用(build/bin/)
```

---

## 质量门禁

前端改动提交前需全绿(husky 预提交会对暂存文件跑 prettier + oxlint):

```bash
cd frontend
yarn check        # typecheck + lint + format:check + test + knip + check:circular + check:layers
```
