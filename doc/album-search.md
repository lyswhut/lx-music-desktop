# 专辑搜索功能开发文档

> 日期：2026-08-19
> 范围：lx-music-desktop（v2.12.2）搜索结果页新增「专辑」子页签
> 说明：本文档以**实际代码**为准。

---

## 1. 需求概述

在搜索结果页（`/search`）新增「专辑」子页签，支持：

- 按关键词搜索专辑，覆盖各音乐源；
- 专辑结果以网格卡片展示，点击进入专辑详情（复用歌单详情页）；
- 支持多源联合搜索（`all`）与单源搜索；
- 记忆搜索设置（源/类型），刷新页面后恢复。

---

## 2. 总体架构

### 2.1 路由与 URL 参数

沿用搜索结果页的 URL query 驱动模式：

```
/search?source=kw&type=album&page=1&text=xxx
```

- `source`：音乐源 id（`wy` / `kw` / `kg` / `tx` / `mg` / `all`）；
- `type`：子页签类型（`music` / `songlist` / `album`）；
- `page`：页码；
- `text`：搜索关键词。

由 `views/Search/index.vue` 的 `verifyQueryParams`（`beforeRouteEnter` / `beforeRouteUpdate`）解析。

### 2.2 专辑 id 前缀分发（无新路由复用歌单详情页）

专辑列表项 id 统一为 `album__${平台id}` 格式（在各源搜索 SDK 组装）。进入详情时复用 `/songList/detail` 路由，由 `store/songList/action.ts` 新增的 `getListDetailData()` 用正则 `/^album__/` 分发：

```js
const getListDetailData = (id, source, page) => {
  return /^album__/.test(id)
    ? (musicSdk)[source]?.album.getAlbumDetail(id.replace('album__', ''), page)
    : musicSdk[source]?.songList.getListDetail(id, page)
}
```

> 注：`musicSdk` 为 JS 模块，TS 联合类型推断下 `album` / `albumSearch` 非公共属性，访问时需 `(music as any)[source]` 断言（共 3 处：`store/search/album/action.ts`、`store/search/album/state.ts`、`store/songList/action.ts`）。

### 2.3 按能力过滤源列表

`store/search/album/state.ts` 遍历 `music.sources`，仅保留实现了 `albumSearch` 的源，并在尾部追加 `all`（多源联合）：

```ts
sources = [...music.sources.filter(id => music[id]?.albumSearch), 'all']
```

实际支持专辑搜索的源：**wy / kw / kg / tx**（mg 未实现，界面在 mg 页签下隐藏专辑子页签）。

### 2.4 数据流

```
Search/index.vue (URL query)
  └─ AlbumList/index.vue（网格展示，复用 SongList.vue 组件）
      └─ useList.ts
          └─ store/search/album/action.ts search()
              ├─ 单源：musicSdk[source].albumSearch.search(text, page, limit)
              └─ all：Promise.all 并发各源，单源失败降级为空壳
          └─ 排序：similar(keyword, item.name) + sortInsert
```

---

## 3. 各源搜索接口实现

统一入参：`search(text, page, limit = 20)`；统一出参：`{ list, limit, total, source }`，其中 `list` 项字段为：

```js
{
  id: 'album__xxx',     // 带前缀的平台专辑 id
  name: '专辑名',
  author: '歌手',
  time: '发行时间（Y-M-D）',
  img: '封面图 url',
  total: 歌曲数,
  desc: 简介（可为 null）,
  play_count: '',
  source: '源 id',
}
```

### 3.1 网易云（wy）— `musicSdk/wy/albumSearch.js`

- 接口：eapi `/api/cloudsearch/pc`，POST 参数 `{ s: text, type: 10, limit, total: page == 1, offset: limit * (page - 1) }`（`type: 10` 为专辑）。
- 响应：`body.result.albums`（数组）、`body.result.albumCount`（总数）。
- 字段：`artists → author`（`formatSingerName`）、`publishTime → time`（`dateFormat`）、`picUrl → img`、`size → total`。

### 3.2 酷我（kw）— `musicSdk/kw/albumSearch.js`

- 接口：`http://search.kuwo.cn/r.s`，query：`all=${text}&pn=${page-1}&rn=${limit}&ft=album&rformat=json&encoding=utf8&ver=mbox&vipver=MUSIC_8.7.7.0_BCS37&plat=pc&devid=28156413&pay=0&needliveshow=0`。
- 响应：需经 `objStr2JSON(body)` 解析；`body.albumlist`（数组）、`body.total ?? body.SHOW`（总数）。
- 字段：`albumid → id`、`artist → author`（`decodeName`）、`pub → time`、`hts_img || img || pic → img`、`musiccnt → total`、`info → desc`。

### 3.3 酷狗（kg）— `musicSdk/kg/albumSearch.js`

- 接口：`http://msearchretry.kugou.com/api/v3/search/album`，query：`keyword=${text}&page=${page}&pagesize=${limit}&showtype=10&filter=0&version=7910&sver=2`。
- 校验：`body.errcode != 0` 时 `throw new Error('filed')`。
- 响应：`body.data.info`（数组）、`body.data.total`（总数）。
- 字段：`albumid → id`、`singername → author`（`decodeName`）、`publishtime → time`（`dateFormat`，毫秒时间戳）、`imgurl.replace('{size}', 240) → img`、`songcount → total`。

### 3.4 腾讯（tx）— `musicSdk/tx/albumSearch.js`

- 接口：`musicu.fcg` 签名接口（`signRequest`），`req_0` 中 `search_type: 2`（0 单曲 / 1 歌手 / 2 专辑 / 3 歌单），`query = text`，`num_per_page = limit`，`page_num = page`，`singerid = 1`，`grp = 1`，`onlysong = 0`。
- 响应：`body.req.data.body.item_album`（数组）、`body.req.data.body.c_total`（总数）。
- 字段：`albummid → id`（`album__albummid`）、`singer → author`、`name → 专辑名`、`publish_date → time`、`pic → img`、`song_num → total`。

---

## 4. 各源专辑详情实现

统一入参：`getAlbumDetail(id, page)`（id 为已去除 `album__` 前缀的平台 id）；统一出参复用歌单详情结构 `{ list, page, limit, total, source, info: { name, img, desc, author } }`，`list` 为可直接播放的标准歌曲信息。

### 4.1 网易云（wy）— `musicSdk/wy/album.js`

- 接口：weapi POST `https://music.163.com/weapi/v1/album/${id}`，表单 `{ id }`（weapi 加密）。
- 校验：`body.code != 200 || !body.album` 时重试（最多 2 次）。
- 解析：`body.album`（名称/封面/简介/歌手）、`body.songs`（经 `filterList` 转标准歌曲信息），`limit: 1000`。

### 4.2 酷我（kw）— `musicSdk/kw/album.js`

- 接口：`http://search.kuwo.cn/r.s`，query：`pn=${page-1}&rn=1000&stype=albuminfo&albumid=${id}&show_copyright_off=0&encoding=utf&vipver=MUSIC_9.1.0`。
- 校验：`statusCode != 200 || !body.musiclist` 时重试（最多 2 次）。
- 解析：`body.musiclist`（经 `filterListDetail` 转标准歌曲信息）、`body.name / img / info / artist`、`limit: 1000`。
- 挂载方式（`musicSdk/kw/index.js`）为包装器：`album: { getAlbumDetail: (id, page) => album.getAlbumListDetail(id, page) }`。

### 4.3 酷狗（kg）— `musicSdk/kg/album.js`

- 两步请求：
  1. 专辑曲目：`http://mobiles.kugou.com/api/v3/album/song?version=9108&albumid=${id}&plat=0&pagesize=${limit=200}&area_code=0&page=${page}&with_res_tag=0`，经 `getMusicInfosByList` 转标准歌曲信息；
  2. 专辑信息：`http://kmrserviceretry.kugou.com/container/v1/album`（POST，`data: [{ album_id: id }]`，取 `album_name / sizable_cover / intro / author_name`）。
- `albumList.info` 为空时 `Promise.reject`。

### 4.4 腾讯（tx）— `musicSdk/tx/album.js`

- 接口：`https://c.y.qq.com/v8/fcg-bin/fcg_v8_album_detail_cp.fcg?albummid=${id}&format=json&newsong=1`（带 UA/Referer）。
- 校验：`body.code != 0 || !body.data` 时重试（最多 2 次）。
- 解析：曲目 `data.getSongInfo ?? data.songlist`（复用 `songList.filterListDetail`）；专辑信息 `data.getAlbumInfo ?? data.albumInfo`；封面由 id 拼 `https://y.gtimg.cn/music/photo_new/T002R500x500M000${id}.jpg`；`limit: list.length + 1`。

---

## 5. Store 实现（`store/search/album/`）

### 5.1 state.ts

- `sources`：支持专辑搜索的源列表（见 2.3），尾部追加 `'all'`；
- `listInfos`：按源存放 `{ list, page, maxPage, total, source, allList, isEnd }`；
- `maxPages`：各源最大页数。

### 5.2 action.ts

- `search()`：根据 `sourceId` 决定请求模式。
  - 单源：`musicSdk[sourceId].albumSearch.search(text, page, limit)`；
  - `all`：`Promise.all` 并发各源 `search(text, page, limit_all)`（`limit_all = 15`），**单源失败降级为空壳**（返回 `{ list: [], total: 0 }`），保证整体不因个别源失败而中断；
  - 缓存键：`${page}__${sourceId}__${text}`（对称 `store/search/songlist` 实现）。
- `setList(s)`：写入 `listInfos[source]`，维护分页信息。
- `resetListInfo()`：搜索词变化时清空全部缓存与列表。
- `handleSortList()`：按 `similar(keyword, item.name)` 打分后 `sortInsert` 排序（`all` 模式多源结果合并排序）。

### 5.3 排序细节

```ts
const limitMap = { all: 15 }  // 单源 limit 默认 18
```

---

## 6. 界面实现

### 6.1 `views/Search/index.vue`（入口）

- 模板新增页签与分支：

```html
<base-tab v-model="searchType" :list="searchTypes" @change="handleTypeChange" />
<album-list v-else-if="searchType == 'album'" v-show="searchText" :page="page" :source-id="source" />
```

- `searchTypes` computed：`music / songlist / album` 三项；**mg 源时过滤掉 album 项**（`source.value == 'mg'`）。
- `getSupportList(type)`：`type == 'songlist' ? _songlistSources : type == 'album' ? _albumSources : _sources`（`_sources` 为 music 源列表）。
- `verifyQueryParams`：URL 中 `type` 指定源的专辑但当前源不支持时，自动回退到 `music` 类型。
- `handleSourceChange`：切源时若当前类型该源不支持，自动回退到 `music`。
- `handleTypeChange`：切类型时若当前源不支持，取该类型支持列表第一个源。
- 顶栏 `sources` 仍基于 `_sources`（music 源列表）展示——源支持度差异由上面几处动态纠正兜底。

### 6.2 `views/Search/AlbumList/index.vue` + `useList.ts`

- 直接复用 `views/songList/List/components/SongList.vue` 网格组件（通过 `visible-source` 属性、`toggle-page` 事件、`scrollTo` / `getScrollTop` expose）。
- `useList.ts` 监听 `searchText` / `sourceId` / `page` 变化触发 `search()`；带守卫 `if (!sourceListInfo) return`，避免切换至不支持专辑的源时因 `listInfos[source]` 为 undefined 崩溃。
- 滚动位置恢复：`onBeforeRouteLeave` 时保存 `searchKey` / `searchPosition`，返回时恢复。

### 6.3 国际化

新增键 `search__type_album`：zh-cn `专辑` / zh-tw `專輯` / en-us `Album`。

---

## 7. 问题与修复记录

| # | 问题 | 修复方案 |
|---|------|----------|
| 1 | TS2339：`albumSearch` / `album` 不在 musicSdk 联合类型中 | 3 处访问点加 `(music as any)[source]` 断言 |
| 2 | 网易专辑详情返回空 | 由 eapi 改为 weapi POST `https://music.163.com/weapi/v1/album/{id}`，参数 `{ id }` |
| 3 | 运行时崩溃 `Cannot read properties of undefined (reading 'list')`（切到不支持专辑的源时） | 双保险：`useList.ts#search` 加守卫 + `Search/index.vue` 用 `getSupportList` 纠正非法源 |
| 4 | eslint 误报 `_songlistSources` / `_albumSources` 未使用 | 删除 `node_modules/.cache/eslint-webpack-plugin` 后重启 dev |
| 5 | 腾讯旧版 `client_search` 接口失效返回空 body | 改为 `musicu.fcg` 签名接口（`signRequest`，`search_type: 2`），解析 `body.req.data.body.item_album` |

---

## 8. 文件清单

**新增文件**

| 文件 | 说明 |
|------|------|
| `src/renderer/utils/musicSdk/wy/albumSearch.js` | 网易云专辑搜索（eapi type:10） |
| `src/renderer/utils/musicSdk/kw/albumSearch.js` | 酷我专辑搜索（r.s?ft=album） |
| `src/renderer/utils/musicSdk/kg/albumSearch.js` | 酷狗专辑搜索（v3/search/album） |
| `src/renderer/utils/musicSdk/tx/albumSearch.js` | 腾讯专辑搜索（musicu.fcg search_type:2） |
| `src/renderer/utils/musicSdk/wy/album.js` | 网易云专辑详情（weapi v1/album） |
| `src/renderer/utils/musicSdk/kw/album.js` | 酷我专辑详情（r.s?stype=albuminfo） |
| `src/renderer/utils/musicSdk/kg/album.js` | 酷狗专辑详情（v3/album/song + container/v1/album） |
| `src/renderer/utils/musicSdk/tx/album.js` | 腾讯专辑详情（fcg_v8_album_detail_cp） |
| `src/renderer/store/search/album/index.ts` | Store 出口 |
| `src/renderer/store/search/album/state.ts` | 状态与源能力过滤 |
| `src/renderer/store/search/album/action.ts` | 搜索动作（单源/all、缓存、排序） |
| `src/renderer/views/Search/AlbumList/index.vue` | 专辑子页签视图 |
| `src/renderer/views/Search/AlbumList/useList.ts` | 列表逻辑（分页/守卫/滚动恢复） |

**修改文件**

| 文件 | 改动 |
|------|------|
| `src/renderer/utils/musicSdk/{wy,kw,kg,tx}/index.js` | 挂载 `albumSearch` + `album`（kw 为包装器形式） |
| `src/renderer/views/Search/index.vue` | 「专辑」页签、`<album-list>` 分支、`getSupportList`、`handleTypeChange` / `handleSourceChange`、`searchTypes` mg 过滤 |
| `src/renderer/store/songList/action.ts` | 新增 `getListDetailData()` 按 `album__` 前缀分发详情 |
| `src/lang/{zh-cn,zh-tw,en-us}.json` | 新增 `search__type_album` |

---

## 9. 遗留事项 / 后续优化

- **mg 专辑搜索**：未实现 `albumSearch`，如后续补充需新增 SDK 并按能力过滤自动接入；
- **接口字段实测**：各源分页数、`total` 准确性（尤其 tx `c_total`、kg `data.total`）未做大规模回归；
- **封面防盗链**：部分源封面（如酷我 `sycdn` 图床、腾讯 `y.gtimg.cn`）在无 UA/Referer 环境下可能加载失败，尚未统一处理；
- **搜索设置边界**：`getSearchSetting` / `setSearchSetting` 对 `type: 'album'` 的兼容（旧设置缺少该键时回退路径）；
- **回归点**：`/songList/detail` 歌单详情正常路径、`all` 模式多源并发稳定性、切换源/类型时非法参数兜底。
