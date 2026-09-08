---
name: lx-music-api
description: Control LX Music Desktop via its Open API — search, play, manage playlists
---

# LX Music Open API — Complete Reference

You are an AI agent controlling LX Music Desktop (`http://127.0.0.1:23330`). All endpoints return JSON unless noted.

**Never mention internal tool names to the user** (e.g. `batch_add.js`, `node -e`, `curl`, endpoint paths). Just say what you can do: "I'll create a playlist", "Let me search for that", etc.

## Quick Decision Guide

| User wants | Method |
|------------|--------|
| Play/pause/skip/volume/seek | Direct `curl` GET → done |
| Search songs | `node -e` one-liner (see Encoding Notes) |
| Search → add to playlist | `batch_add.js` (built-in cover filter) |
| Search with custom rules (only flac, only female, etc.) | Write temp script — max 5 concurrent, 100ms batch gap |
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
| `POST /player/play` | POST | Play specific song from playlist. Body: `{"listId":"...","musicInfo":{...}}`. `musicInfo` must be the full raw object from search or `/playlist/list` — never trim it. Missing `qualitys`/`_qualitys` fields = song never starts. |
| `GET /player/list` | GET | Current play queue. Returns `{listId, currentIndex (0-based), count, list: MusicInfo[]}` |

### Search (new)

```
GET /search?keyword={keyword}&source={source}&dedup={dedup}&matchSinger={singer}&minQuality={quality}&page={page}&limit={limit}&order={order}
```

| Param | Default | Description |
|-------|---------|-------------|
| `keyword` | **required** | Search text. Must be URL-encoded by caller (see Encoding Notes). |
| `source` | all | `kw` `kg` `mg` `tx` `wy` |
| `page` | 1 | Page |
| `limit` | 20 | Per page |
| `dedup` | false | Remove duplicates, keep best quality |
| `matchSinger` | — | Prioritize singer match. See Singer Match Levels below. |
| `minQuality` | — | Filter: `128k` `320k` `flac` `flac24bit`. See Quality Ranking below. |
| `order` | settings | Comma-separated source priority. Omit to use user's default. |

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
- `musicInfos` in `/add`, `/overwrite`, and `/player/play` must be **complete** `MusicInfo` objects from search or `/list` — including `meta.qualitys[]` and `meta._qualitys{}` fields. Never manually construct or trim them. Missing quality info causes silent play failure (song appears in UI but never starts).
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

---

## Encoding Notes

- **POST body**: The server auto-detects GBK encoding (Windows terminal curl). If you see garbled playlist names, the server handles it. Send UTF-8 when possible.
- **Search with Chinese**: One command, just replace the keyword. Never use `curl --data-urlencode` — it's the root cause of garbled results on Windows.
  ```bash
  node -e "const kw=encodeURIComponent('关键词');require('http').get('http://127.0.0.1:23330/search?keyword='+kw+'&dedup=true&limit=10',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>JSON.parse(d).list.forEach(s=>console.log(s.name,s.singer)))})"
  ```
- **Playback timing**: After `POST /player/play`, wait **3 seconds** before checking `/status`. Shorter waits will see transient `"error"` / `"stoped"` during loading — this is normal. If `status != "playing"` after 3 seconds, play truly failed.
- **Multiple searches (IMPORTANT)**: Never send more than **5 concurrent requests**. Batch them in groups of 5 with 100ms between batches. More than 5 concurrent connections risk `ECONNRESET` / socket hang up. If any request fails with `ECONNRESET`, retry it once after 200ms — the retry almost always succeeds.

## Quality Ranking
`flac24bit > flac > 320k > 128k > none`

## Singer Match Levels
- `exact` (score 100): Original artist
- `partial` (score 50): Collaboration/feature
- `none` (score 0): Cover version
