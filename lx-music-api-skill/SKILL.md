---
name: lx-music-api
description: Control LX Music Desktop via its Open API — search, play, manage playlists
---

# LX Music Open API — Complete Reference

You are an AI agent controlling LX Music Desktop (`http://127.0.0.1:23330`). All endpoints return JSON unless noted.

## Quick Decision Guide

| User wants | Method |
|------------|--------|
| Play/pause/skip/volume/seek | Direct `curl` GET → done |
| Search 1-5 songs | Direct `curl` → pick from results |
| Search 5-50 songs, add to playlist | `batch_add.js` (built-in cover filter) |
| Search with custom rules (only flac, only female, etc.) | Write temp Node.js script |
| Sort/filter/reorder a playlist | `GET /list` → compute → `POST /overwrite` |
| Play a specific song from playlist | `GET /list` → `POST /player/play` |
| Check what's playing | `GET /status` or `GET /player/list` |
| Delete songs/playlists | `POST /playlist/songs` or `/playlist/remove` |

---

## All Endpoints

### Player Control (original)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/play` | GET | Resume playback |
| `/pause` | GET | Pause |
| `/skip-next` | GET | Next track |
| `/skip-prev` | GET | Previous track |
| `/seek?offset=30.5` | GET | Seek to position (seconds) |
| `/volume?volume=80` | GET | Set volume 1-100 |
| `/mute?mute=true` | GET | Mute/unmute |
| `/collect` | GET | Favorite current song |
| `/uncollect` | GET | Unfavorite current song |

### Player Status (original)

| Endpoint | Description |
|----------|-------------|
| `GET /status?filter=status,name,singer,duration,progress` | Current song info (JSON). Default filter: `status,name,singer,albumName,lyricLineText,duration,progress,playbackRate`. Available fields: `status,name,singer,albumName,duration,progress,playbackRate,picUrl,lyricLineText,lyricLineAllText,lyric,tlyric,rlyric,lxlyric,collect,volume,mute` |
| `GET /lyric` | Current LRC lyric (plain text) |
| `GET /lyric-all` | All lyric types `{lyric,tlyric,rlyric,lxlyric}` |
| `GET /subscribe-player-status?filter=...` | SSE stream — real-time status push |

### Player Control (new)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /player/play` | POST | Play specific song from playlist. Body: `{"listId":"...","musicInfo":{...}}` — `musicInfo` must be full object from search or `/playlist/list` |
| `GET /player/list` | GET | Current play queue. Returns `{listId, currentIndex (0-based), count, list: MusicInfo[]}` |

### Search (new)

```
GET /search?keyword={keyword}&source={source}&dedup={dedup}&matchSinger={singer}&minQuality={quality}&page={page}&limit={limit}&order={order}
```

| Param | Default | Description |
|-------|---------|-------------|
| `keyword` | **required** | Search text (auto URL-encoded) |
| `source` | all | `kw` `kg` `mg` `tx` `wy` |
| `page` | 1 | Page |
| `limit` | 20 | Per page |
| `dedup` | false | Remove duplicates, keep best quality |
| `matchSinger` | — | Prioritize singer match: result gets `_matchLevel` (`exact`/`partial`/`none`) |
| `minQuality` | — | Filter: `128k` `320k` `flac` `flac24bit` |
| `order` | settings | Comma-separated source priority: `kg,kw,mg,tx,wy` |

Response: `{ list: MusicInfo[], total, allPage, page, limit }`

Each `MusicInfo`: `{ id, name, singer, source, interval, meta: { songId, albumName, qualitys[], _qualitys{} } }`

### Playlist Management (new)

| Endpoint | Method | Body | Returns |
|----------|--------|------|---------|
| `GET /playlists` | GET | — | `[{id, name, source, ...}]` all user playlists |
| `POST /playlist/create` | POST | `{"name":"..."}` | `{"id":"userlist_xxx","name":"..."}` |
| `POST /playlist/add` | POST | `{"listId":"..","musicInfos":[...]}` | `{"count":N}` |
| `GET /playlist/list?listId=xxx` | GET | — | `{"listId":"..","songs":[...]}` |
| `POST /playlist/overwrite` | POST | `{"listId":"..","musicInfos":[...]}` | `{"count":N}` — replaces entire playlist |
| `POST /playlist/remove` | POST | `{"ids":["userlist_xxx"]}` | `{"removed":N}` |
| `POST /playlist/songs` | POST | `{"listId":"..","ids":["kw_123"]}` | `{"removed":N}` |

**Critical rules:**
- `musicInfos` in `/add` and `/overwrite` must be complete `MusicInfo` objects from search or `/list`, **not** just IDs.
- `POST /playlist/remove` takes playlist IDs (e.g. `userlist_*`).
- `POST /playlist/songs` takes song IDs within a playlist (e.g. `kw_xxx`, `kg_xxx`).

---

## Common Workflows

### 1. Add songs to a playlist
```
GET /playlists                      → find target playlist ID
GET /search?keyword=...&dedup=true  → for each song
POST /playlist/add                  → bulk add
```

### 2. Play a specific song from a playlist
```
GET /playlist/list?listId=xxx       → get songs
POST /player/play                   → {listId, musicInfo: songs[0]}
```

### 3. Check what's playing / queue
```
GET /player/list    → {listId, currentIndex, count, list}
```
`list[currentIndex]` is current song. `list.slice(currentIndex+1)` is upcoming.

### 4. Batch import many songs
```bash
node batch_add.js "歌单名" "周杰伦 - 夜曲, 光良 童话, 黄昏"
node batch_add.js --all "歌单名" "..."   # include covers/DJ/instrumental
```
Input formats: `songname` / `singer - songname` / `singer songname`. Outputs JSON.

### 5. Reorder / filter / sort a playlist
```
GET /playlist/list?listId=xxx    → get all songs
(compute sort/filter client-side)
POST /playlist/overwrite         → replace entire list
```

### 6. Clean up
```
POST /playlist/songs  {listId, ids}   → remove specific songs
POST /playlist/remove {ids}          → delete playlist(s)
```

### 7. Temp script pattern (for custom logic)
```js
const http = require('http');
const API = 'http://127.0.0.1:23330';
function get(path) { return new Promise(r => { http.get(API+path, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>r(JSON.parse(d))); }); }); }
function post(path, body) { return new Promise(r => { const b=JSON.stringify(body); const req=http.request(API+path,{method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(JSON.parse(d)))}); req.write(b);req.end(); }); }
(async() => {
  // Get → transform → apply
  const data = await get('/playlist/list?listId=xxx');
  // ... your custom logic ...
  await post('/playlist/overwrite', { listId: 'xxx', musicInfos: result });
})();
```

---

## Playback Timing

After `POST /player/play`, the audio source needs time to load. **Wait 1-2 seconds before checking `/status` for playback confirmation.** The status may briefly show `"error"` or `"stoped"` during the transition — this is normal. If `status != "playing"` after 3 seconds, then the play truly failed.

## Encoding Notes

- **POST body**: The server auto-detects GBK encoding (Windows terminal curl). If you see garbled playlist names, the server handles it. Send UTF-8 when possible.
- **Search keyword**: Must be URL-encoded. `curl --data-urlencode` or JS `encodeURIComponent`.
- **Chinese in song names**: After search, `name`/`singer` fields may contain raw UTF-8. Pipe through `node -e` or `jq` for display.

## Quality Ranking
`flac24bit > flac > 320k > 128k > none`

## Singer Match Levels
- `exact` (score 100): Original artist
- `partial` (score 50): Collaboration/feature
- `none` (score 0): Cover version

## Settings
LX Music → 设置 → 开放 API → 音源优先级 (e.g. `kg,kw` to limit sources).
