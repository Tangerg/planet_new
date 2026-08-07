# PLANET

一个 **Wails 桌面音乐播放器** —— Go 壳 + React 19 / TypeScript 前端。微内核 + 插件架构,所有数据经 provider 端口接入(网易云 / QQ / Spotify / 本地音乐可切换)。

> 架构法则与开发约定见 [`frontend/CLAUDE.md`](frontend/CLAUDE.md)。

---

## 环境要求

- **Go** 1.25+(确保 `go` 在 `PATH`,通常需 `/usr/local/go/bin` 与 `~/go/bin`)
- **Node** 22+ 与 **Yarn**(classic 1.x)
- **Wails CLI v3**（`go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-beta.4`，命令名是 `wails3`）
- 一个**数据源后端**(见下)；只使用本地音乐时不需要

> Wails v3 用 `Taskfile.yml` 编排构建(go-task 已内置在 `wails3` 里，无需单独安装 `task`)，
> 构建步骤都是可读可改的任务，不再是 CLI 黑盒。

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

### 2. 选择 provider(`frontend/.env.local`)

```ini
# 网易云(默认)
VITE_PROVIDER=netease
VITE_NETEASE_HOST=http://localhost:3300

# 切到 QQ 音乐:
# VITE_PROVIDER=qqmusic
# VITE_QQMUSIC_HOST=http://localhost:3200

# 使用本地音乐库:
# VITE_PROVIDER=local
```

`VITE_PROVIDER` 取值:`netease` | `qqmusic` | `spotify` | `local`，缺省回退 `netease`。`VITE_*_HOST` 必须与数据后端实际监听的端口一致。

### 3. 启动应用(前后端一起)

在**仓库根目录**跑 `wails3 dev` —— 它会自动起 Vite(前端 HMR)+ Go(桌面壳),并生成 Go↔JS 绑定:

```bash
export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"
wails3 dev
```

- 桌面窗口会自动打开;Vite 开发服务器跑在 `:9245`(可用 `WAILS_VITE_PORT` 改)。
- 后端数据服务没起时,相关页面会显示诚实空态(不会崩);想要有数据的体验就启动 provider 后端，或切到 `VITE_PROVIDER=local` 扫描本地音乐。

#### 只跑前端(可选)

```bash
cd frontend
yarn install
yarn dev          # Vite 开发服务器 :9245
```

> 注意:单跑 `yarn dev` 不会启动 Go 壳与原生窗口(无边框窗口 / 红绿灯等桌面能力缺失),
> 本地音乐库也会诚实报告 “桥不可用”。日常开发请用根目录的 `wails3 dev`。

---

## 构建

```bash
wails3 build      # 产出裸二进制(bin/PLANET)
wails3 package    # 产出可分发的 PLANET.app(bin/PLANET.app)
```

Go↔JS 绑定(`frontend/bindings/`)由 `wails3 generate bindings` 生成并**入库**,
这样前端门禁不依赖 Go 工具链。改动 `backend` 的绑定方法或 DTO 后,记得跑:

```bash
make bindings     # == wails3 task bindings
```

---

## 质量门禁

提交前在仓库根目录运行唯一全量门禁：

```bash
make check         # production build + Go vet/race/vuln + 前端 check
```

根 Go 包会嵌入 `frontend/dist`，因此 `make check` 以及单独的 `make test`、`make test-race`、`make vet`、`make vuln` 都会先构建前端。Go 检查统一使用 `go.mod` 声明的补丁版本；漏洞扫描工具也由 module tool directive 固定版本。

只验证前端时使用 `cd frontend && yarn run check`。必须写 `run`，因为 `yarn check` 是 Yarn Classic 自带的依赖完整性命令，不是本项目脚本。
