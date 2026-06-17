---
name: lx-music-api
description: Control LX Music Desktop via its Open API - search music, create playlists, add songs
---

# LX Music Open API Skill

You are an AI agent that controls LX Music Desktop via its Open API HTTP server.

## Decision: How to execute

Evaluate each task and choose the best method:

| Task | Method | Why |
|------|--------|-----|
| 1-5 songs, any logic | Direct `curl` / `bash` | Overhead not worth a script |
| 5-50 songs, **want original versions only** (default) | `batch_add.js` | Built-in cover filter |
| 5-50 songs, **want everything including covers** | `batch_add.js --all` | Skips filter |
| Any number of songs, **custom filter** (only instrumental, only female singer, prefer flac, exclude certain artists, etc.) | **Write temp script** | `batch_add.js` can't express these rules |
| Custom sort/reorder/filter of existing playlist | `GET /list` → compute → `POST /overwrite` | No script needed |

### batch_add.js usage boundaries

`batch_add.js` is ONLY for simple "search → add" with two modes: original-priority (default) or include-everything (`--all`).

**If the user wants anything beyond these two modes** — e.g. "only instrumental versions", "female singer covers", "prefer 320k or higher", "exclude DJ versions but keep live" — **write a temp script instead**. The filtering logic in a temp script can be as specific as needed.

Temp script template:
```js
const http = require('http');
const API = 'http://127.0.0.1:23330';
function get(path) { /* return JSON promise */ }
function post(path, body) { /* return JSON promise */ }

(async () => {
  // 1. Get data: await get('/playlist/list?listId=xxx')
  // 2. Transform: sort/filter/shuffle as needed
  // 3. Apply: await post('/playlist/overwrite', { listId, musicInfos })
  console.log(JSON.stringify({ result: 'done' }));
})();
```

## Prerequisites

- LX Music Desktop running with "开放 API 服务" enabled
- Default address: `http://127.0.0.1:23330`

## API Reference

### Search
```
GET /search?keyword={keyword}&source={source}&dedup={dedup}&matchSinger={singer}&minQuality={quality}&page={page}&limit={limit}&order={order}
```

Parameters:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| keyword | string | **required** | Search keyword |
| source | string | all | `kw`(酷我) `kg`(酷狗) `mg`(咪咕) `tx`(QQ) `wy`(网易) |
| page | number | 1 | Page number |
| limit | number | 20 | Results per page |
| dedup | boolean | false | Remove duplicates, keep best quality |
| matchSinger | string | - | Sort by singer match (exact > partial > none) |
| minQuality | string | - | Filter: `128k`, `320k`, `flac`, `flac24bit` |
| order | string | 设置页值 | Source priority, e.g. `mg,kw,kg,tx,wy` |

Response: `{ list: MusicInfo[], total, allPage, page, limit }`

Each `MusicInfo` has: `id, name, singer, source, interval, meta: { songId, albumName, qualitys[], _qualitys{} } }`
When `matchSinger` used: `_matchLevel` ("exact"/"partial"/"none"), `_matchScore`

### Playlist CRUD

| Endpoint | Method | Body | Returns |
|----------|--------|------|---------|
| `/playlist/create` | POST | `{"name":"..."}` | `{"id":"userlist_xxx","name":"..."}` |
| `/playlist/add` | POST | `{"listId":"..","musicInfos":[...]}` | `{"count": N}` |
| `/playlist/list?listId=xxx` | GET | - | `{"listId":"..","songs":[...]}` |
| `/playlist/overwrite` | POST | `{"listId":"..","musicInfos":[...]}` | `{"count": N}` |
| `/playlist/songs` | POST | `{"listId":"..","ids":["kw_123"]}` | `{"removed": N}` |
| `/playlist/remove` | POST | `{"ids":["userlist_xxx"]}` | `{"removed": N}` |

**Important:** `/playlist/add` requires full `MusicInfo` objects from search, not just ids. `/playlist/overwrite` replaces the entire playlist content.

### Other
| Endpoint | Description |
|----------|-------------|
| `GET /status` | Player status (playlist IDs: `default`, `love`, `userlist_*`) |

## Common Workflows

### Add songs to a playlist
1. `POST /playlist/create {"name":"..."}` (or get existing id via `/status`)
2. For each song: `GET /search?keyword=...&dedup=true` (add `&matchSinger=...` if artist known)
3. `POST /playlist/add {"listId":"..","musicInfos":[...]}`

### Batch import many songs
Use the bundled script:
```bash
node .reasonix/skills/lx-music-api/batch_add.js "歌单名" "歌曲1, 周杰伦 - 夜曲, 光良 童话"
```
Supports: `songname` or `singer - songname` or `singer songname` format. Outputs structured JSON with summary.

### Reorder / filter playlist
1. `GET /playlist/list?listId=xxx` → get all songs
2. Sort/filter/group as needed in AI logic
3. `POST /playlist/overwrite {"listId":"..","musicInfos":sorted}` → replace entire list

### Remove songs / playlists
- `POST /playlist/songs {"listId":"..","ids":["kw_123"]}` → remove specific songs
- `POST /playlist/remove {"ids":["userlist_xxx"]}` → delete entire playlist

## Quality Ranking
`flac24bit > flac > 320k > 128k`

## Singer Match Levels
- `exact` (score 100): Exact match — original version
- `partial` (score 50): Partial match — may be collaboration/feature
- `none` (score 0): No match — likely a cover

Always prefer `exact` matches. `partial` or `none` may be covers.

## Settings
In LX Music: 设置 → 开放 API → 音源优先级 (comma-separated source order, e.g. `kg,kw,mg,tx,wy`). Fewer sources = faster search. API `?order=` parameter overrides this.
