# DSH Bridge（非官方分支说明）

> [!WARNING]
> 本仓库是 [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) 在官方 `v2.12.6`（`master`）基础上的**非官方魔改分支**（分支名 `dsh-bridge`），**仅为 DSH 插件 `dsh-music-dj` 提供“真正的搜索 + 按 id 播放”的后台接口**。本分支与官方项目及原作者没有任何隶属关系，**请勿与官方版本混淆**，也不要把本分支的问题反馈到官方仓库。
>
> 本分支**不内置、不硬编码任何音源**，**不修改音源脚本机制**，也**不提供任何绕过付费、会员或版权限制的能力**。所有搜索/播放能力都来自 LX Music 原有的实现，桥接层只做"HTTP 请求 → 渲染进程"的转发。

## 1. 概览

LX Music 的官方开放 API（`src/main/modules/openApi/index.ts`）只提供播放控制、播放器状态读取等能力，**没有搜索接口**，也不能按歌曲 `id` 直接播放。本分支在同一个本地 HTTP 服务上追加 4 个 `GET /dsh/*` 端点：

| 端点 | 作用 | 是否开始播放 |
| --- | --- | --- |
| `GET /dsh/ping` | 识别是否为魔改版 | 否 |
| `GET /dsh/search` | 关键词搜索候选歌曲 | 否 |
| `GET /dsh/play` | 按 musicInfo（含 `source` + `songmid` 等）播放 | 是 |
| `GET /dsh/play-search` | 按歌名/歌手跨源匹配并播放，返回实际播放的歌曲 | 是 |

前提：在 LX Music 中开启「设置 → 其他设置 → 开放 API」（默认关闭）。默认端口 `23330`，关闭 `bindLan` 时仅监听 `127.0.0.1`。所有响应均为 `application/json; charset=utf-8`。

## 2. 端点详情

### 2.1 `GET /dsh/ping`

用于插件确认对端是带 DSH Bridge 的魔改版。

```bash
curl "http://127.0.0.1:23330/dsh/ping"
```

```json
{
  "ok": true,
  "bridge": true,
  "version": 1,
  "appVersion": "2.12.6"
}
```

- `bridge: true` 表示支持 DSH Bridge；`version` 是桥接协议版本（当前 `1`，以后新增端点时递增）。
- 该端点完全在主进程内处理，不经过渲染进程。

### 2.2 `GET /dsh/search`

参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `keywords` | 是 | 搜索关键词，最长 200 字符 |
| `source` | 否 | `all`（默认）或 `kw` / `kg` / `tx` / `wy` / `mg` |
| `limit` | 否 | 每个源的返回条数，`1`–`30`，默认 `10` |

```bash
curl --get "http://127.0.0.1:23330/dsh/search" \
  --data-urlencode "keywords=晴天 周杰伦" \
  --data-urlencode "source=all" \
  --data-urlencode "limit=5"
```

```json
{
  "ok": true,
  "list": [
    {
      "source": "kw",
      "songmid": "440614",
      "name": "晴天",
      "singer": "周杰伦",
      "albumName": "叶惠美",
      "interval": "04:29",
      "img": null,
      "types": [
        { "type": "320k", "size": "9.9M" },
        { "type": "128k", "size": "4.0M" }
      ],
      "raw": { "...": "搜索源返回的完整 musicInfo，可直接回传给 /dsh/play 的 data" }
    }
  ]
}
```

- 只搜索，不会改变播放状态，也不会写入搜索页的列表（不影响 UI）。
- `source=all` 时会并发请求所有可用的内置搜索源，单个源失败只记日志、不导致整体失败。
- **`raw` 是搜索源返回的完整旧版 musicInfo**。不同源播放时需要的字段不同（酷狗需要 `hash`、QQ 需要 `strMediaMid`、咪咕需要 `copyrightId` 等），所以插件**应该把 `raw` 原样作为 `/dsh/play` 的 `data` 回传**，而不是只传 `source` + `songmid`。

### 2.3 `GET /dsh/play`

按指定歌曲信息开始播放。`data` 是 URL 编码后的 JSON，字段与 LX 自己的 `music/play` deeplink 接受的 musicInfo 完全一致（`name` / `singer` / `source` / `songmid` / `types`，以及各源特有字段）。

```bash
curl --get "http://127.0.0.1:23330/dsh/play" \
  --data-urlencode 'data={"name":"晴天","singer":"周杰伦","source":"kw","songmid":"440614","interval":"04:29","albumName":"叶惠美","types":[{"type":"320k","size":"9.9M"}]}'
```

```json
{ "ok": true }
```

- 复用渲染进程里 `music/play` deeplink 的同一套校验、临时播放列表与播放逻辑（`usePlayMusic`），没有第二份实现。
- 若当前没有正在播放的歌曲，会直接开始播放；若正在播放，则插入"稍后播放"顶部并切歌。

### 2.4 `GET /dsh/play-search`

参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 歌名 |
| `singer` | 否 | 歌手，建议传，能显著提高匹配准确率 |

```bash
curl --get "http://127.0.0.1:23330/dsh/play-search" \
  --data-urlencode "name=晴天" \
  --data-urlencode "singer=周杰伦"
```

```json
{
  "ok": true,
  "musicInfo": {
    "name": "晴天",
    "singer": "周杰伦",
    "source": "kw",
    "songmid": "440614",
    "interval": "04:29",
    "albumName": "叶惠美",
    "img": null,
    "types": [{ "type": "320k", "size": "9.9M" }],
    "...": "其余为源特有字段"
  }
}
```

- 复用 `music/searchPlay` deeplink 的跨源匹配逻辑（`getOtherSource` / `musicSdk.findMusic`），与手动点击 deeplink 播放完全一样。
- 返回的 `musicInfo` 已经是**实际选中并开始播放**的那首，字段格式与 `/dsh/play` 的 `data` 相同，可再次回传。
- 匹配不到时返回 HTTP `404` + `{ "ok": false, "code": "NOT_FOUND", "error": "music not found" }`。

## 3. 错误与超时

所有端点失败时都返回 JSON：`{ "ok": false, "code": "...", "error": "..." }`。

| HTTP 状态 | `code` | 含义 |
| --- | --- | --- |
| `400` | `INVALID_PARAMS` | 参数缺失/非法 |
| `404` | `NOT_FOUND` | 未知端点，或 `/dsh/play-search` 没有匹配到歌曲 |
| `405` | `METHOD_NOT_ALLOWED` | 非 GET 请求 |
| `500` | `INTERNAL_ERROR` / `IPC_ERROR` | 渲染进程执行出错 / 主进程转发失败 |
| `504` | `TIMEOUT` | 渲染进程未在超时时间内响应 |

超时时间（主进程等待渲染进程回包）：`/dsh/play` 5 秒，`/dsh/search` 15 秒，`/dsh/play-search` 20 秒（跨源匹配内部还有一个 15 秒上限）。插件侧建议把 HTTP 超时设为略大于上述值。

## 4. 用 PowerShell 调用

```powershell
Invoke-RestMethod "http://127.0.0.1:23330/dsh/ping"
Invoke-RestMethod "http://127.0.0.1:23330/dsh/search?keywords=%E6%99%B4%E5%A4%A9&limit=5"

$data = '{"name":"晴天","singer":"周杰伦","source":"kw","songmid":"440614","types":[{"type":"320k","size":"9.9M"}]}'
Invoke-RestMethod ("http://127.0.0.1:23330/dsh/play?data=" + [uri]::EscapeDataString($data))
```

## 5. 与官方版的差异

**只新增后台能力，不修改任何 UI 行为、不修改音源脚本机制。** 改动文件：

| 文件 | 说明 |
| --- | --- |
| `src/main/modules/openApi/dshBridge.ts` | 新增。4 个 `/dsh/*` 端点的 HTTP 处理、请求转发与超时管理 |
| `src/main/modules/openApi/index.ts` | 在 HTTP server 里把 `/dsh/*` 请求分流给 `dshBridge.ts`，原有端点逻辑不变 |
| `src/main/modules/winMain/rendererEvent/openAPI.ts` | 注册渲染进程回包监听（`dsh_bridge_response`） |
| `src/common/ipcNames.ts` | 新增 `winMain_dsh_bridge_request` / `winMain_dsh_bridge_response` 事件名 |
| `src/common/types/dsh_bridge.d.ts` | 新增。桥接协议的类型声明 |
| `src/common/types/common.d.ts`（main/renderer 各一处） | 引入上面的类型声明 |
| `src/renderer/core/useApp/useDshBridge.ts` | 新增。渲染进程侧：执行搜索/播放并把结果回传主进程 |
| `src/renderer/core/useApp/index.ts` | 启动时注册上面的监听 |
| `src/renderer/core/useApp/useDeeplink/useMusicAction.js` | 导出 `usePlayMusic` / `useSearchPlayMusic` 并让后者返回实际播放的歌曲，供桥接复用；deeplink 行为不变 |
| `README.md` / `docs/DSH_BRIDGE.md` | 增加非官方分支说明与本文件 |

其余与官方 `v2.12.6` 完全一致。没有新增依赖，没有改动构建配置、没有改动任何音源实现。

## 6. 实现方式与原因

搜索与播放逻辑都只存在于渲染进程（依赖 `@renderer/utils/musicSdk`、Vue store、播放器状态），主进程无法直接调用。因此桥接采用和 LX 现有 `sendTaskbarButtonClick` 一致的单向 IPC 模式，只是补了一条回程：

```
HTTP client
   │  GET /dsh/search?...
   ▼
main: openApi/dshBridge.ts
   │  1. 生成 requestId，登记 pending response（带超时）
   │  2. winMain_dsh_bridge_request { id, action, params }
   ▼
renderer: useDshBridge.ts
   │  3. action=search → 调用内置搜索源（musicSdk[source].musicSearch.search）
   │     action=play   → 复用 usePlayMusic（= music/play deeplink）
   │     action=searchPlay → 复用 useSearchPlayMusic（= music/searchPlay deeplink）
   │  4. winMain_dsh_bridge_response { id, ok, data }
   ▼
main: 按 id 找到挂起的 HTTP 响应并写回 JSON
```

这样做的理由：

- **零重复实现**：播放走的是与 deeplink 完全相同的函数，不会出现"桥接播的和手动播的不一样"。
- **不侵入 UI**：搜索直接调用搜索源，不经过搜索页的 `listInfos` 状态；播放复用临时播放列表逻辑，和 deeplink 行为一致。
- **主进程保持轻量**：主进程只做 HTTP/路由/超时，不引入渲染进程依赖，也不把音源逻辑搬到主进程。
- 之所以不用 SSE / 轮询：单次请求-响应足够，用 `id` 关联的 pending map + 超时最简单可靠。

## 7. 构建与安装

与官方项目相同：

```bash
npm install     # 国内网络可加 --registry=https://registry.npmmirror.com
npm run dev     # 开发模式（webpack watch + electron）
npm run build   # 仅编译 main / renderer / renderer-lyric / renderer-scripts
npm run pack    # 打包（按平台见 package.json 中 pack:* 脚本）
```

使用步骤：

1. 用本分支源码构建并启动（或使用自行打包的安装包）。
2. 打开「设置 → 其他设置 → 开放 API」，确认端口（默认 `23330`），保持 `bindLan` 关闭。
3. `curl http://127.0.0.1:23330/dsh/ping`，返回 `bridge: true` 即表示魔改版生效。
4. 在 DSH 插件 `dsh-music-dj` 中把基地址配置为 `http://127.0.0.1:<端口>`，插件应先用 `/dsh/ping` 探测，再使用其它端点。

> 官方开放 API 默认是关闭的；如果 `/dsh/ping` 连不上，先检查该开关和端口占用。

## 8. 安全与风险声明

- **仅本机回环**：沿用官方 `bindLan` 行为，关闭时只监听 `127.0.0.1`。若用户手动开启 `bindLan`，服务会监听 `0.0.0.0`，届时**同一局域网内任何人都能调用这些接口**（包括搜索与播放控制）。
- **无鉴权**：桥接端点没有 token/密码，同机上的任意进程都可以调用。请不要在不信任的机器上开启开放 API。
- **不内置音源**：所有搜索结果都来自 LX Music 内置/用户自行配置的搜索实现与第三方接口，本分支不新增、不硬编码任何音源地址或密钥。
- **不绕过付费/会员/版权限制**：桥接只转发 LX 已有的搜索与播放能力，不提供任何破解、去广告、解锁会员音质之类的功能。
- **接口稳定性**：第三方音源接口随时可能失效或变更，`/dsh/search` 与 `/dsh/play-search` 的结果依赖这些外部因素。
- 本项目仅用于个人学习与研究，请遵守当地法律法规与各音乐平台的服务条款，支持正版。

## 9. 已知限制 / 未验证项

- 本分支的验证方式是 TypeScript 类型检查 + webpack 生产构建，**未在真实 Electron 窗口中逐一人工点测**四个端点（接口路径与 IPC 通道已按仓库现有实现核对）。
- `/dsh/search` 固定查每个源的**第 1 页**（`limit` ≤ 30），没有分页能力。
- `/dsh/play-search` 直接复用跨源匹配逻辑，匹配结果以 LX 的启发式规则为准，不保证一定命中用户想要的那一版。
- 未监听/未处理「用户在设置里关闭开放 API → 服务关闭」期间挂起的请求（服务关闭时连接会被销毁，客户端会收到网络错误）。
- 未新增任何 UI 入口或提示，插件能否连上需要用户自己用 `/dsh/ping` 确认。
