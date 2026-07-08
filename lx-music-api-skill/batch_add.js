#!/usr/bin/env node
// batch_add.js — 批量搜索并添加歌曲到 LX Music 歌单
// 用法: node batch_add.js "歌单名" "歌曲1, 歌曲2, ..."
//       node batch_add.js "歌单名" "周杰伦 - 夜曲, 光良 童话, 黄昏"
//       node batch_add.js --all "歌单名" "歌曲1, 歌曲2"   ← 不过滤翻唱/纯音乐

const http = require('http');
const API = 'http://127.0.0.1:23330';
const MAX_PARALLEL = 5;
const ADD_BATCH = 30;
const TIMEOUT = 10000;

const badPatterns = /Live|DJ|R&B版|cover|翻唱|新版|合唱|空灵鼓|练习曲|Remix|Mix|片段|现场|串烧|DJ版|慢摇|演唱会|伴奏|纯音乐/;

// ========= 工具 =========

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, API);
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method, timeout: TIMEOUT,
      headers: { 'Content-Type': 'application/json' } };
    if (body) {
      const b = JSON.stringify(body);
      opts.headers['Content-Length'] = Buffer.byteLength(b);
    }
    const req = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { resolve(d) } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const get = url => request('GET', url);
const post = (path, body) => request('POST', path, body);

// ========= 解析输入 =========

function parseSong(raw) {
  // "周杰伦 - 夜曲" → { song: "夜曲", artist: "周杰伦" }
  // "周杰伦 夜曲"  → { song: "夜曲", artist: "周杰伦" }
  // "夜曲"         → { song: "夜曲", artist: null }
  let s = raw.trim();
  if (!s) return null;
  // "singer - song"
  const sep = s.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (sep) return { song: sep[2].trim(), artist: sep[1].trim(), includeAll: false };
  // "singer song" — if two parts and second part looks like a song name
  const parts = s.split(/\s+/);
  if (parts.length === 2 && parts[1].length >= 2) return { song: parts[1], artist: parts[0], includeAll: false };
  return { song: s, artist: null, includeAll: false };
}

// ========= 搜索 =========

async function searchSong(song, artist, includeAll) {
  const q = encodeURIComponent(song);
  let path = `/search?keyword=${q}&dedup=true&limit=10`;
  if (artist) path += `&matchSinger=${encodeURIComponent(artist)}`;
  
  const data = await get(path);
  if (!data || !data.list || !data.list.length) return { song, found: false, reason: 'no_results' };
  
  let good = includeAll ? data.list : data.list.filter(i => !badPatterns.test(i.name) && !badPatterns.test(i.singer));
  if (!good.length) good = data.list;
  
  const pick = good[0];
  const matchLevel = pick._matchLevel || (artist ? 'unknown' : 'unspecified');
  const issues = [];
  if (artist && matchLevel !== 'exact') issues.push(`singer_${matchLevel}`);
  
  return { song, found: true, name: pick.name, singer: pick.singer, source: pick.source,
    matchLevel, issues, musicInfo: pick };
}

async function parallelSearch(songs, concurrency) {
  const results = [];
  const queue = [...songs];
  
  async function worker() {
    while (queue.length) {
      const s = queue.shift();
      if (!s) break;
      try {
        const r = await searchSong(s.song, s.artist, s.includeAll);
        process.stderr.write(r.found ? '.' : 'x');
        results.push(r);
      } catch(e) {
        process.stderr.write('E');
        results.push({ song: s.song, found: false, reason: 'error', error: e.message });
      }
    }
  }
  
  process.stderr.write(`搜索中 `);
  await Promise.all(Array(Math.min(concurrency, songs.length)).fill(0).map(() => worker()));
  process.stderr.write('\n');
  return results;
}

async function incrementalAdd(playlistId, musicInfos, batchSize) {
  let total = 0;
  for (let i = 0; i < musicInfos.length; i += batchSize) {
    const batch = musicInfos.slice(i, i + batchSize);
    const r = await post('/playlist/add', { listId: playlistId, musicInfos: batch });
    if (r && r.count) total += r.count;
    process.stderr.write(`+${batch.length} `);
  }
  process.stderr.write('\n');
  return total;
}

// ========= 主流程 =========

(async () => {
  let includeAll = false;
  let plName = process.argv[2];
  let rawStart = 3;
  if (plName === '--all') { includeAll = true; plName = process.argv[3]; rawStart = 4; }
  const raw = process.argv.slice(rawStart).join(' ');
  if (!plName || !raw) {
    console.error('用法: node batch_add.js [--all] "歌单名" "歌曲1, 歌曲2, ..."');
    console.error('      --all  不过滤翻唱/Live/DJ/纯音乐');
    process.exit(1);
  }

  // 解析歌曲列表
  const parsed = raw
    .split(/[，,\n]/)
    .map(parseSong)
    .filter(s => s);

  if (!parsed.length) {
    console.error('未解析到有效歌曲');
    process.exit(1);
  }

  // 1. 创建歌单
  process.stderr.write(`创建歌单 "${plName}"... `);
  const pl = await post('/playlist/create', { name: plName });
  if (!pl || !pl.id) { console.error('创建失败'); process.exit(1); }
  process.stderr.write(`ID: ${pl.id}\n`);

  // 2. 搜索
  const results = await parallelSearch(parsed, MAX_PARALLEL);

  // 3. 统计
  const found = results.filter(r => r.found);
  const failed = results.filter(r => !r.found);
  const uncertain = found.filter(r => r.issues.length > 0);

  // 4. 增量添加
  process.stderr.write(`添加中 `);
  const count = await incrementalAdd(pl.id, found.map(r => r.musicInfo), ADD_BATCH);

  // 5. JSON 输出
  console.log(JSON.stringify({
    playlist: { id: pl.id, name: pl.name },
    summary: { total: parsed.length, found: found.length, added: count, failed: failed.length, uncertain: uncertain.length },
    failed: failed.map(r => ({ song: r.song, reason: r.reason })),
    uncertain: uncertain.map(r => ({
      song: r.song, picked: r.name, singer: r.singer, source: r.source,
      matchLevel: r.matchLevel, issues: r.issues,
    })),
    found: found.map(r => ({ song: r.song, name: r.name, singer: r.singer, source: r.source, matchLevel: r.matchLevel })),
  }, null, 2));
})();
