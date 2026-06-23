# 音乐 Provider 接入方案

> 本文档回答两件事:**① 市面上各音乐平台有哪些可用的 API(官方 / 成熟第三方)**;**② 要把它们(尤其是官方开放平台)接进 PLANET,抽象层该怎么扩、分几步落地。**
>
> 结论先行:现有 `IProvider`(`@domain/ports/provider.ts`)为「**自建逆向 API**」模型(无登录、吐 mp3 直链)设计,这一类零改即用;**官方开放平台**在「用户授权」与「播放方式」两个维度上不匹配,需扩展抽象。国内三家(网易/QQ)官方仅 B2B、对个人不开放,正经播放只能走自建逆向。

---

## 目录

- [一、音乐 Provider 生态(调研结论)](#一音乐-provider-生态调研结论)
- [二、现有抽象评估:两个不匹配维度](#二现有抽象评估两个不匹配维度)
- [三、三种接入模型](#三三种接入模型)
- [四、抽象扩展设计](#四抽象扩展设计)
- [五、分阶段落地清单](#五分阶段落地清单)
- [六、官方平台接入手册](#六官方平台接入手册)
- [七、推荐执行顺序](#七推荐执行顺序)
- [参考来源](#参考来源)

---

## 一、音乐 Provider 生态(调研结论)

### 1. 有官方 API(国际,文档齐全)

| 平台 | 官方 API | 能力 | 真正出声播放的前提 |
|---|---|---|---|
| **Spotify** | Web API(REST,元数据/歌单/搜索/推荐/播放控制)+ Web Playback SDK(浏览器内播放) | 完整 | **用户本人 Spotify Premium** + Web Playback SDK;免费号只能拿元数据/控制别处设备 |
| **Apple Music** | MusicKit(Apple/Android/Web)+ Apple Music API | 完整 | **用户 Apple Music 订阅** + MusicKit;需 Apple Developer Program |
| **YouTube** | 仅 YouTube **Data** API(搜索/视频/播放列表,配额严格) | 无「Music」专用官方 API | —— |

**Spotify 2025 关键政策**:2025-05-15 起扩展访问(extended access)门槛大幅提高,新建 app 默认困在 development mode(≤25 个测试用户),公开上线极难 → 现在更适合自用/实验,不适合面向公众的产品。

### 2. 成熟第三方(逆向接口,功能强但灰色)

| 平台 | 项目 | 语言 | 说明 |
|---|---|---|---|
| **YouTube Music** | [sigma67/ytmusicapi](https://github.com/sigma67/ytmusicapi) ⭐ | Python(MIT,活跃) | 最成熟的非官方库;搜索/歌手/歌单/歌词/上传;有 PHP/TS 移植 |
| **网易云** | [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) | Node(MIT) | 最知名;**GitHub 已停更**,npm 仍更 |
| **网易云** | [NeteaseCloudMusicApiEnhanced/api-enhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced) ⭐ | Node(MIT) | 续命增强版,持续维护,推荐 |
| **QQ 音乐** | [jsososo/QQMusicApi](https://github.com/jsososo/QQMusicApi) | Express | 社区最活跃、文档全 |
| **QQ 音乐** | [Rain120/qq-music-api](https://github.com/Rain120/qq-music-api) | Koa2+TS | 带 API Explorer 调试台;**本项目 QQ provider 对接的就是它(:3200)** |
| **聚合** | [metowolf/Meting](https://github.com/metowolf/Meting-API) ⭐ | PHP(Docker) | 一套 API 聚合网易/QQ/酷狗/酷我,返回统一字段 + mp3 直链 |
| **聚合/播放器** | [maotoumao/MusicFree](https://github.com/maotoumao/MusicFree) | RN/Electron(AGPL) | 插件化播放器,插件协议思路值得抄 |

逆向接口共性:仅供学习、**禁止商用**、依赖 cookie/VIP、平台一更新就可能失效,**不能作为生产基础**。

### 3. 国内官方开放平台(存在,但 B2B 门槛)

- **QQ 音乐**:[developer.y.qq.com](https://developer.y.qq.com/),QPlay Auth 授权(本质是投屏/控制官方 App 的播放流,非直链),面向商业合作方。
- **网易云**:[developer.music.163.com](https://developer.music.163.com/),`openapi.music.163.com` partner 接口。
- 两者均需**企业资质 + 实名 + 商务洽谈审核**,非自助流程 → **个人/业余项目基本接不了**。

### 4. 一句话总结

| 维度 | 现实 |
|---|---|
| **元数据/搜索** | 官方或第三方几乎都能拿到 |
| **真正出声播放** | 最大的墙:官方正版播放一律要**订阅会员** + **SDK**(无 URL);国内官方对个人不开放;能"白嫖直链 + 不登录"的只有自建逆向 API |

---

## 二、现有抽象评估:两个不匹配维度

`IProvider` 隐含前提:**provider 无状态、不需用户登录、播放 = 返回 mp3 URL(`TrackPlayUrl.playUrl`)塞进 `<audio>`。** 这完美契合自建逆向 API,但官方开放平台在两点上不匹配:

| 维度 | 现有模型 | 官方平台(Spotify/Apple)现实 |
|---|---|---|
| **授权** | 无用户态(QQ/网易匿名;Spotify 现为 client-credentials 应用态) | 必须**用户 OAuth 登录**拿 user token,且要会员 |
| **播放** | `playUrl: string` → `<audio src>` | **没有 URL**,音频由官方 **SDK**(Web Playback SDK / MusicKit)内部解码,DRM 保护 |

→ 接入官方平台 = 抽象层补上**用户授权**与**SDK 播放**两个现在不存在、且彼此正交的概念,且都做成可选,不破坏现有 4 个 provider。

---

## 三、三种接入模型

按**接入模型**而非平台归类,设计才清晰:

| 模型 | 代表 | 授权 | 能拿播放直链? | 适配现有 `IProvider`? |
|---|---|---|---|---|
| **A. 自建逆向 API** | QQ(:3200)、网易、Meting 聚合、自建 ytmusicapi | 匿名/cookie | ✅ mp3 直链 | ✅ **零改动** |
| **B. 官方应用态(无用户)** | Spotify Client-Credentials(已实现) | app token | ❌ 仅 30s preview | ✅ 当 `previewPlayback` |
| **C. 官方用户态 + SDK** | Spotify Premium、Apple Music | 用户 OAuth + 会员 | ❌ 无 URL,SDK 接管 | ⚠️ **需扩展抽象** |

**A 是唯一"白嫖直链 + 不登录"且现架构原生支持的路子。** B 残废(只试听),C 强大但要动内核 + 有 DRM 坑。

---

## 四、抽象扩展设计

两个正交维度,均可选,不污染现有契约。依赖方向遵守 `@shared ← @domain ← @core ← @providers ← ui ← app`。

### 维度 1:用户授权(新增独立端口)

取数与登录是两件事,别揉进 `IProvider`。新增 `@domain/ports/auth.ts`:

```ts
export type AuthSession = {
  authed: boolean
  expiresAt?: number
  displayName?: string
}

// 需登录的 provider 才实现;用 capability "userAuth" 声明
export interface IAuthProvider {
  authorize(): Promise<void>                          // 拉起 OAuth(开系统浏览器)
  handleRedirect(callbackUrl: string): Promise<void>  // code → token
  signOut(): Promise<void>
  get session(): AuthSession | null
}
```

`ProviderCapability` 加 `"userAuth"`。Spotify/Apple 实现;QQ/网易/Mock 不动。

**Token 存储(关键决策)**:refresh token 敏感,**不进 localStorage**。落 **Go 侧**(Wails,keychain 或加密文件),新增极少量后端方法(`SaveToken/LoadToken/DeleteToken`)。这是项目首次真正用到 Go 后端 + Wails binding(目前 `app.go` 是空壳)。前端只持内存态。

### 维度 2:播放方式(动内核,谨慎)

现 `Track.playUrl?: string` + Control 插件喂 `<audio>`。官方全曲无 URL,把"播放"抽象成判别联合(`@domain/model/track.ts`):

```ts
type Playback =
  | { kind: "url"; url: string }   // 现有:<audio src>
  | { kind: "sdk"; uri: string }   // 交给 SDK device
```

`playUrls(ids): TrackPlayUrl[]` 泛化为 `resolvePlayback(ids): Playback[]`。Control 插件加第二播放后端:`kind:"url"` 走现有路径;`kind:"sdk"` 把 play/pause/seek/volume 转发给 SDK 控制器,进度从 SDK 事件回灌 `play_time_changed`/`track_duration_changed`(**复用事件总线,不在 UI 复制播放态**)。capability 加 `"sdkPlayback"`。

> ⚠️ 这是唯一会碰内核播放核心的维度,爆炸半径最大。**默认不做**,只在确认要官方全曲、且 DRM 验证通过后启动(见阶段 D)。

---

## 五、分阶段落地清单

### 阶段 A —— Meting 聚合 provider(零改内核,先拿可播放成果)

| 项 | 内容 |
|---|---|
| **新增** | `providers/Meting.ts` + `providers/mappers/meting.ts` |
| **改动** | `app/planet.ts` 工厂加 `case "meting"`;`providers/index.ts` 导出 |
| **端口契约** | 不变(完全落进现有 `IProvider`) |
| **爆炸半径** | 极小 |

接口映射(Meting 统一返回 `id/name/artist/album/source/url/pic/lrc`):

| `IProvider` 方法 | Meting 调用 | capability |
|---|---|---|
| `search(q)` | `?type=search&keyword=` | `search` |
| `playUrls(ids)` | `?type=url&id=` → 直链 | `fullPlayback` |
| `lyric(id)` | `?type=lyric&id=` | `lyric` |
| `playlistDetail/albumDetail` | `?type=playlist/album&id=` | … |

- `source`(netease/tencent/kugou/kuwo)必须进 `Track.id` 命名空间(如 `netease:xxx`),否则跨源 id 撞车 —— Meting 聚合的唯一新约束,记进 mapper 注释。
- 自建服务用 `metowolf/Meting-API` Docker 镜像;`VITE_METING_HOST` 配置,缺省回退 MOCK。
- **验收**:`VITE_PROVIDER=meting` 下 search→点歌→出声→歌词滚动全通;`yarn typecheck && yarn build && yarn test` 全绿。

### 阶段 B —— 用户授权抽象(auth port)

1. 新增 `@domain/ports/auth.ts`(见维度 1);`ProviderCapability` 加 `"userAuth"`。
2. Token 存储落 Go 侧(首次引入 Wails binding:`SaveToken/LoadToken/DeleteToken`)。
3. UI:provider 若 `supports("userAuth")` 显示账户入口;登录逻辑放 `hooks.ts`,vibe 屏幕保持纯展示。

| 爆炸半径 | 中。新增端口 + 首次 Go binding;现有 4 provider 不实现该接口、不受影响。 |
|---|---|

**验收**:Mock/QQ/网易仍 typecheck 通过;Go binding 能存取一个假 token。

### 阶段 C —— Spotify 官方用户授权(Auth Code + PKCE)

> 在阶段 B 之上把现有 `Spotify.ts` 从 client-credentials 升级到用户态。**播放仍是 preview**(不上 SDK)。

1. Dashboard 建 app 拿 `clientId`,登记 redirect URI(Wails 用自定义 scheme 或本地回环 `http://127.0.0.1:<port>/callback`)。
2. `Spotify.ts` 实现 `IAuthProvider`:`authorize()` 走 PKCE(生成 `code_verifier`/`challenge`,开系统浏览器到 `/authorize`);`handleRedirect()` 用 code+verifier 换 token;scope 先只读(`user-read-email user-read-private`)。
3. `capabilities` 加 `userAuth`;用户态接口(最近播放等)可用。
4. **卡点**:2025-05-15 后扩展访问门槛极高,新 app 困在 dev mode(≤25 用户)—— 自用 OK,产品化基本不可行。

| 爆炸半径 | 小~中。只改 `Spotify.ts` + 工厂;依赖阶段 B 的 token 存储。 |
|---|---|

### 阶段 D —— 官方全曲 SDK 播放(维度 2,默认不做)

> 仅在确认要 Spotify Premium / Apple Music 全曲、且通过 DRM 验证后启动。

- **D-0 前置验证(必须先做)**:在 Wails(WKWebView)跑最小 demo 验证 SDK 能否出声。
  - **Spotify Web Playback SDK** 依赖 EME + **Widevine**,WKWebView 只支持 **FairPlay** → **大概率放不出声**。
  - **Apple MusicKit** 用 **FairPlay**,WKWebView 原生支持 → **可行性高,优先它**。
- **D-1** `Track` 引入 `Playback` 判别联合;`playUrls` → `resolvePlayback`(同步改 4 provider + mapper)。
- **D-2** Control 插件加 SDK 播放后端,事件回灌进度。
- **D-3** capability 加 `"sdkPlayback"`。

| 爆炸半径 | **大**。动 `Track` 模型 + 全 provider `playUrls` + Control 播放链路 + 事件。 |
|---|---|

---

## 六、官方平台接入手册

| 平台 | 自助申请? | 拿到 | 最小可播放链路 | 致命卡点 |
|---|---|---|---|---|
| **Spotify** | ✅ 个人可注册 | clientId(+secret) | Auth Code+PKCE 登录 → Web Playback SDK 注册 device → `PUT /v1/me/player/play` | 需 Premium;2025 扩展访问封死公开;**WKWebView Widevine 大概率不可** |
| **Apple Music** | ✅ 需 Developer Program($99/年) | Media ID + 私钥 → 签 ES256 Developer Token | MusicKit JS `configure` → `authorize()` 拿 Music User Token → `music.play()` | 需订阅;user token ~6 月过期且无 refresh;FairPlay → **WKWebView 可行** |
| **网易云开放平台** | ❌ B2B,企业资质审核 | partner appkey/secret | `openapi.music.163.com` partner 接口 | **个人接不了**;实际走自建逆向 |
| **QQ 开放平台** | ❌ B2B,商务洽谈 | QPlay 授权 | QPlay = 投屏/控制官方 App,非直链 | **个人接不了**;实际走自建逆向 |

---

## 七、推荐执行顺序

```
A(Meting,马上能播)  →  B(auth port,小代价铺路)  →  C(Spotify 用户态,仍 preview)
                                                        └─ D(SDK 全曲)仅在 D-0 验证通过后,优先 Apple
```

- 国内三家(网易/QQ)**正经播放只能走模型 A 自建逆向**;官方开放平台对个人不开放,别再投入精力试官方申请。
- 主力 = 模型 A(Meting 聚合,抄 MusicFree 插件协议思路);Spotify/Apple 当"元数据 + 试听"provider(模型 B);官方全曲(模型 C/阶段 D)留作可选,优先 Apple(FairPlay)而非 Spotify(Widevine + 公开访问被封)。

---

## 参考来源

- Spotify Web API / Web Playback SDK — <https://developer.spotify.com/documentation/web-api> · <https://developer.spotify.com/documentation/web-playback-sdk>
- Spotify 2025 扩展访问政策 — <https://spotify.leemartin.com/>
- Apple MusicKit / Apple Music API — <https://developer.apple.com/musickit/> · <https://developer.apple.com/documentation/applemusicapi>
- ytmusicapi — <https://github.com/sigma67/ytmusicapi>
- NeteaseCloudMusicApi(原版/增强) — <https://github.com/Binaryify/NeteaseCloudMusicApi> · <https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced>
- QQMusicApi — <https://github.com/jsososo/QQMusicApi> · <https://github.com/Rain120/qq-music-api>
- Meting / MusicFree — <https://github.com/metowolf/Meting-API> · <https://github.com/maotoumao/MusicFree>
- QQ / 网易云官方开放平台 — <https://developer.y.qq.com/> · <https://developer.music.163.com/>
</content>
</invoke>
