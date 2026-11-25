/**
 * 多活音源 e2e（ADR-0003 播放失败回退链）。
 *
 * 预置两个假自定义源（写入 profile 的 LxDatas/user_api.json）：
 *   - 主源 e2e测试主源：所有提供方注册、musicUrl 一律失败；
 *   - 备源 e2e测试备源：仅注册 wy、musicUrl 返回本地 HTTP 音频。
 * 预写 common.apiSource=主源、common.apiSourceBackups=[备源]。
 *
 * 用例：
 *   U1 双源同时装载：主进程存在 2 个 data: 隐藏窗口（一源一窗）
 *   U2 源管理弹窗：主源标记、备源勾选、取消勾选/恢复且设置持久化
 *   U3 播放回退全链路（网络敏感）：kw 歌曲入「我的收藏」→ 列表内播放 →
 *      kw@主源失败 → 换提供方（findMusic 同曲）→ wy@主源失败 → wy@备源接管 → 成功播放
 *   U4 写回「我的列表」：love 列表中该歌曲 source 由 kw 变为 wy（DB 校验）
 *   U5 主进程和渲染进程均无未预期错误
 *   U6 macOS 关闭主窗口后重新激活，主源和备源均重新加载且可取流
 * 用法: node e2e/userApiBackups.js
 */
const { launchApp, collectErrors, screenshot, acceptAgreement, makeProfileDir, ART_DIR } = require('./harness')
const { execFileSync } = require('child_process')
const http = require('http')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const results = []
function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`)
}
async function run(window, name, fn) {
  try {
    const detail = await fn()
    record(name, true, detail ?? '')
  } catch (err) {
    record(name, false, `${err.message}`)
    const file = await screenshot(window, `fail_${name.replace(/[^\w\u4e00-\u9fff]+/g, '_')}`, err)
    console.log(`      screenshot: ${file}`)
  }
}

const PRIMARY_ID = 'user_api_e2e_pri'
const BACKUP_ID = 'user_api_e2e_bak'
const PRIMARY_NAME = 'e2e测试主源'
const BACKUP_NAME = 'e2e测试备源'

/** 假源脚本：满足 parseScriptInfo 的头注释格式 + lx.on('request') + lx.send('inited') */
const buildScript = (mode, audioUrl) => `/*!
 * @name ${mode == 'primary' ? PRIMARY_NAME : BACKUP_NAME}
 * @description e2e ${mode == 'primary' ? '总是失败的主源' : '仅 wy 可用的备源'}
 * @version 1.0.0
 * @author e2e
 */
const providers = ${mode == 'primary' ? "['kw', 'kg', 'tx', 'wy', 'mg']" : "['kg', 'tx', 'wy', 'mg']"}
const sources = {}
for (const s of providers) {
  sources[s] = { name: s, type: 'music', actions: ['musicUrl'], qualitys: ['128k', '320k', 'flac'] }
}
lx.on('request', ({ action }) => {
  if (action != 'musicUrl') return Promise.reject(new Error('e2e unsupported action'))
  ${mode == 'primary'
    ? "return new Promise((resolve, reject) => setTimeout(() => reject(new Error('e2e primary fail')), 30))"
    : "return Promise.resolve('" + audioUrl + "')"}
})
lx.send('inited', { openDevTools: false, sources })
`

const deflateScript = (script) => 'gz_' + zlib.deflateSync(Buffer.from(script, 'utf8')).toString('base64')

/** 本地音频服务器（支持 Range，供备源 musicUrl 返回） */
async function startAudioServer() {
  // 30 秒静音 PCM，避免短脉冲音频自然结束掩盖写回引起的异常跳歌。
  const rate = 8000
  const dataSize = rate * 30 * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(buf.length - 8, 4)
  buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(rate, 24)
  buf.writeUInt32LE(rate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  const server = http.createServer((req, res) => {
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '')
    if (range) {
      const start = range[1] ? Number(range[1]) : 0
      const end = range[2] ? Number(range[2]) : buf.length - 1
      res.writeHead(206, {
        'Content-Type': 'audio/wav',
        'Content-Range': `bytes ${start}-${end}/${buf.length}`,
        'Accept-Ranges': 'bytes',
      })
      res.end(buf.subarray(start, end + 1))
      return
    }
    res.writeHead(200, { 'Content-Type': 'audio/wav', 'Accept-Ranges': 'bytes' })
    res.end(buf)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return { server, url: `http://127.0.0.1:${server.address().port}/e2e.wav` }
}

/** 预置 profile：设置 + 两个假源 */
function makeProfile(audioUrl) {
  const dir = makeProfileDir({
    'common.apiSource': PRIMARY_ID,
    'common.apiSourceBackups': [BACKUP_ID],
  }, require('../package.json').version)
  const lxDataDir = path.join(dir, 'LxDatas')
  const mk = (id, name, mode) => ({
    id,
    name,
    description: `e2e ${mode}`,
    allowShowUpdateAlert: false,
    author: 'e2e',
    version: '1.0.0',
    script: deflateScript(buildScript(mode, audioUrl)),
  })
  fs.writeFileSync(path.join(lxDataDir, 'user_api.json'), JSON.stringify({
    userApis: [mk(PRIMARY_ID, PRIMARY_NAME, 'primary'), mk(BACKUP_ID, BACKUP_NAME, 'backup')],
  }), 'utf8')
  return dir
}


const nav = async(window, hash) => {
  await window.evaluate(h => { window.location.hash = h }, hash)
  await window.waitForTimeout(900)
}

async function closeSourceModal(window) {
  const heading = window.getByRole('heading', { name: '自定义源管理', exact: true })
  if (!(await heading.isVisible())) return
  await heading.locator('..').locator('..').locator('header > button').click()
  await heading.waitFor({ state: 'hidden' })
}

const getPlayStatus = (window) => window.evaluate(() => {
  const els = Array.from(document.querySelectorAll('#player div, #player span'))
  return els.map(d => d.textContent?.trim() ?? '').find(t => t && t.length < 60 && /失败|断开|停止|加载|切换/.test(t)) ?? ''
})

async function clickOpenMenuItem(window, label) {
  const ok = await window.evaluate(l => {
    const item = Array.from(document.querySelectorAll('ul[role="menu"][aria-hidden="false"] li[role="menuitem"]'))
      .find(li => li.getAttribute('aria-label') === l)
    if (!item) return false
    item.click()
    return true
  }, label)
  if (!ok) throw new Error(`菜单未打开或菜单项不存在: ${label}`)
  await window.waitForTimeout(700)
}

function sqlite(profileDir, sql) {
  const db = path.join(profileDir, 'LxDatas', 'lx.data.db')
  return execFileSync('sqlite3', [db, sql], { encoding: 'utf8' }).trim()
}

const TOLERATED_ERRORS = [
  /Autofill/i, /Electron Security Warning/i, /spellcheck/i, /DevTools/i,
  /GPU/i, /WebGL/i, /skia/i, /network service/i, /favicon/i, /ERR_/i,
  /Request Autofill/i, /e2e primary fail/,
]
const isTolerable = (e) => TOLERATED_ERRORS.some(re => re.test(e))

;(async() => {
  fs.mkdirSync(ART_DIR, { recursive: true })
  const { server, url: audioUrl } = await startAudioServer()
  const profileDir = makeProfile(audioUrl)
  const { app, window } = await launchApp({ profileDir })
  const errors = collectErrors(window)
  const mainErrors = []
  app.process().stderr.on('data', data => mainErrors.push(String(data)))
  let activeWindow = window
  const consoleMsgs = []
  window.on('console', msg => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`))
  await window.waitForTimeout(3000)
  await acceptAgreement(window)
  await window.waitForTimeout(1000)

  // ================= U1 双源同时装载 =================
  await run(window, 'U1-主源与备源双窗口装载', async() => {
    await window.waitForTimeout(2000)
    const dataWindows = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows().filter(w => {
        try { return (w.webContents.getURL() ?? '').startsWith('data:') } catch { return false }
      }).length)
    if (dataWindows != 2) throw new Error(`data: 隐藏窗口数 ${dataWindows}，期望 2（主源+备源）`)
    await app.evaluate(async({ BrowserWindow, session }, { primaryId, backupId }) => {
      const primary = session.fromPartition(`user-api-${primaryId}`)
      const backup = session.fromPartition(`user-api-${backupId}`)
      const windows = BrowserWindow.getAllWindows()
      if (primary === backup || primary === session.defaultSession || backup === session.defaultSession ||
        !windows.some(w => w.webContents.session === primary) || !windows.some(w => w.webContents.session === backup)) {
        throw new Error('音源 Session 未隔离')
      }
      await primary.cookies.set({ url: 'https://e2e.invalid', name: 'isolation', value: 'keep' })
    }, { primaryId: PRIMARY_ID, backupId: BACKUP_ID })
    return '主源与备源窗口及 Session 均独立'
  })

  // ================= U2 源管理弹窗 =================
  await run(window, 'U2-源管理：主源标记/备源勾选/持久化', async() => {
    await nav(window, '#/setting')
    await window.waitForTimeout(1500)
    const btn = window.locator('button').filter({ hasText: '自定义源管理' }).first()
    if (!(await btn.isVisible().catch(() => false))) throw new Error('未找到「自定义源管理」按钮')
    await btn.click()
    await window.waitForTimeout(1000)

    const text = await window.evaluate(() => document.body.innerText)
    if (!text.includes(PRIMARY_NAME)) throw new Error(`主源「${PRIMARY_NAME}」未出现在列表`)
    if (!text.includes(BACKUP_NAME)) throw new Error(`备源「${BACKUP_NAME}」未出现在列表`)

    // 主源行：有「主源」标记、无备选框；备源行：备选框且已勾选
    const rows = await window.evaluate(() =>
      Array.from(document.querySelectorAll('li')).map(li => ({
        text: li.textContent ?? '',
        isPrimary: !!Array.from(li.querySelectorAll('span')).find(s => s.textContent?.trim() === '主源'),
        checkbox: li.querySelector('[role="checkbox"][aria-label="作为备源"]')?.getAttribute('aria-checked') ?? null,
      })).filter(r => r.text.includes('e2e测试')))
    const primaryRow = rows.find(r => r.text.includes(PRIMARY_NAME))
    const backupRow = rows.find(r => r.text.includes(BACKUP_NAME))
    if (!primaryRow?.isPrimary) throw new Error('主源行缺少「主源」标记')
    if (primaryRow.checkbox != null) throw new Error('主源行不应出现备源勾选框')
    if (!backupRow) throw new Error('备源行未找到')
    if (backupRow.checkbox != 'true') throw new Error(`备源勾选框状态异常: ${backupRow.checkbox}`)

    // 取消勾选 → 设置持久化为空 → 恢复勾选 → 设置恢复
    const checkbox = window.locator('[role="checkbox"][aria-label="作为备源"]').first()
    await checkbox.click()
    await window.waitForTimeout(1200)
    const cfgOff = JSON.parse(fs.readFileSync(path.join(profileDir, 'LxDatas', 'config_v2.json'), 'utf8'))
    if ((cfgOff.setting['common.apiSourceBackups'] ?? []).length != 0) throw new Error('取消勾选后设置未清空')
    const cookieCount = await app.evaluate(async({ session }, id) =>
      (await session.fromPartition(`user-api-${id}`).cookies.get({ name: 'isolation' })).length, PRIMARY_ID)
    if (cookieCount !== 1) throw new Error('卸载备源清除了主源 Cookie')
    await checkbox.click()
    await window.waitForTimeout(1200)
    const cfgOn = JSON.parse(fs.readFileSync(path.join(profileDir, 'LxDatas', 'config_v2.json'), 'utf8'))
    if ((cfgOn.setting['common.apiSourceBackups'] ?? [])[0] != BACKUP_ID) throw new Error('恢复勾选后设置未还原')
    await closeSourceModal(window)
    return '主源标记/备源勾选/取消恢复均正常'
  })

  await run(window, 'U2b-备源升为主源不重复显示且配置主备互斥', async() => {
    try {
      await window.evaluate(id => window.lxData.updateSetting({ 'common.apiSource': id }), BACKUP_ID)
      await window.waitForFunction(id =>
        window.lxData.appSetting['common.apiSource'] === id && !window.lxData.appSetting['common.apiSourceBackups'].includes(id), BACKUP_ID)
      await window.locator('button').filter({ hasText: '自定义源管理' }).first().click()
      await window.waitForTimeout(800)
      const count = await window.evaluate(name =>
        Array.from(document.querySelectorAll('li')).filter(li => li.querySelector('h3')?.textContent.includes(name)).length, BACKUP_NAME)
      if (count !== 1) throw new Error(`新主源出现 ${count} 行`)
      const config = JSON.parse(fs.readFileSync(path.join(profileDir, 'LxDatas', 'config_v2.json'), 'utf8'))
      if (config.setting['common.apiSourceBackups'].includes(BACKUP_ID)) throw new Error('落盘配置仍有主备重合')
    } finally {
      await closeSourceModal(window)
      await window.evaluate(({ primaryId, backupId }) =>
        window.lxData.updateSetting({ 'common.apiSource': primaryId, 'common.apiSourceBackups': [backupId] }),
      { primaryId: PRIMARY_ID, backupId: BACKUP_ID })
      await window.waitForTimeout(1200)
    }
  })

  // ================= U3+U4 播放回退全链路 + 写回 =================
  await run(window, 'U3-主源失败→换提供方→备源接管播放（网络敏感）', async() => {
    // 搜索 kw 歌曲（默认源酷我音乐）
    await nav(window, '#/search')
    await window.waitForTimeout(800)
    const input = window.getByPlaceholder('Search for something...').first()
    await input.fill('周杰伦')
    await input.press('Enter')
    await window.waitForTimeout(9000)
    const rowCount = await window.locator('.list-item').count()
    if (rowCount < 2) throw new Error('搜索结果不足 2 行（网络受限）')

    // 两首歌曲才能暴露“删除当前条目后自动跳下一曲”的回归。
    for (const index of [0, 1]) {
      await window.locator('.list-item').nth(index).click({ button: 'right', position: { x: 250, y: 10 } })
      await window.waitForTimeout(900)
      await clickOpenMenuItem(window, '添加到...')
      await window.waitForTimeout(900)
      const added = await window.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button'))
          .find(x => x.getAttribute('aria-label') === '把该歌曲添加到「我的收藏」')
        if (!b) return false
        b.click()
        return true
      })
      if (!added) throw new Error('添加弹窗内未找到「我的收藏」项')
      await window.waitForTimeout(800)
    }
    await window.waitForTimeout(2000)
    const sourceBefore = sqlite(profileDir, "SELECT source FROM my_list_music_info WHERE listId='love' LIMIT 1")
    if (sourceBefore != 'kw') throw new Error(`入列后 source=${sourceBefore}，期望 kw`)

    // 我的收藏列表内播放 → 回退链：kw@主源✗ → findMusic 换提供方（候选 kg/tx/mg/wy 按音质排序）→ 候选@主源✗ → 候选@备源✓
    await nav(window, '#/list?id=love')
    await window.waitForTimeout(2500)
    await window.evaluate(() => {
      window.__e2eMusicToggles = 0
      window.app_event.on('musicToggled', () => { window.__e2eMusicToggles++ })
      window.__e2ePlayStatuses = []
      // eslint-disable-next-line no-undef -- This callback runs in the renderer DOM.
      window.__e2eStatusObserver = new MutationObserver(() => {
        const labels = Array.from(document.querySelectorAll('#player div, #player span'))
          .map(el => el.textContent?.trim() ?? '')
          .filter(text => text && text.length < 60 && /失败|断开|停止|加载|切换/.test(text))
        window.__e2ePlayStatuses.push(...labels)
      })
      window.__e2eStatusObserver.observe(document.querySelector('#player'), { subtree: true, childList: true, characterData: true })
    })
    const statusSeen = new Set()
    const pollStatus = setInterval(async() => {
      try { const s = await getPlayStatus(window); if (s) statusSeen.add(s) } catch {}
    }, 200)
    try {
      await window.locator('.list-item').first().dblclick({ position: { x: 250, y: 10 } })
      let played = false
      for (let i = 0; i < 30; i++) {
        await window.waitForTimeout(1000)
        if (await window.locator('[aria-label="暂停"]').isVisible().catch(() => false)) { played = true; break }
      }
      if (!played) throw new Error(`回退链未能开始播放，捕获状态: ${[...statusSeen].join(' | ') || '无'}`)
      const observedStatuses = await window.evaluate(() => window.__e2ePlayStatuses)
      for (const status of observedStatuses) statusSeen.add(status)
      record('U3a-状态栏出现回退提示', [...statusSeen].some(status => status.includes('切换')), [...statusSeen].join(' | ') || '未捕获')

      // U4 写回：love 列表中该歌曲 source 不再是 kw（换到 findMusic 候选提供方）
      let sourceAfter = ''
      for (let i = 0; i < 10; i++) {
        await window.waitForTimeout(1000)
        sourceAfter = sqlite(profileDir, "SELECT source FROM my_list_music_info WHERE listId='love' AND source<>'kw' LIMIT 1")
        if (sourceAfter) break
      }
      record('U4-自动换源写回我的列表(source 已切换)', sourceAfter != 'kw' && !!sourceAfter, `source=${sourceAfter}`)
      if (sourceAfter == 'kw' || !sourceAfter) throw new Error(`写回未生效: source=${sourceAfter}`)
      await window.waitForTimeout(2000)
      const playback = await window.evaluate(() => ({
        changes: window.__e2eMusicToggles,
        index: window.lxData.playInfo.playIndex,
        source: window.lxData.playMusicInfo.musicInfo?.source,
      }))
      if (playback.changes !== 1 || playback.index < 0 || playback.source !== sourceAfter) {
        throw new Error(`写回后播放身份异常或跳歌: ${JSON.stringify(playback)}`)
      }
      record('U4a-写回后保持播放身份且不跳歌', true, JSON.stringify(playback))
      return `播放成功（写回后 source=${sourceAfter}）；状态捕获: ${[...statusSeen].join(' | ') || '无'}`
    } finally {
      clearInterval(pollStatus)
      await window.evaluate(() => window.__e2eStatusObserver?.disconnect()).catch(() => {})
      // 链路诊断：输出回退链的 console 轨迹（try toggle / 错误信息）
      const trail = consoleMsgs.filter(m => /try toggle|find otherSource|e2e|failed|Error|换源/.test(m)).slice(-25)
      console.log('===== U3 链路 console 轨迹 =====')
      trail.forEach(m => console.log('  ' + m.slice(0, 200)))
    }
  })

  if (process.platform === 'darwin') {
    await run(window, 'U6-macOS 重开窗口恢复双音源及取流', async() => {
      await app.evaluate(({ BrowserWindow }) => {
        global.lx.appSetting['tray.enable'] = false
        BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('index.html')).close()
      })
      await new Promise(resolve => setTimeout(resolve, 1500))
      await app.evaluate(({ app }) => app.emit('activate'))
      for (let i = 0; i < 40; i++) {
        const page = app.windows().find(w => !w.isClosed() && w.url().includes('index.html'))
        if (page) {
          activeWindow = page
          break
        }
        await new Promise(resolve => setTimeout(resolve, 250))
      }
      if (activeWindow.isClosed()) throw new Error('主窗口未恢复')
      const reopenedErrors = collectErrors(activeWindow)
      await activeWindow.waitForLoadState('domcontentloaded')
      await activeWindow.waitForTimeout(3000)
      const count = await app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows().filter(w => w.webContents.getURL().startsWith('data:')).length)
      if (count !== 2) throw new Error(`重开后音源窗口数=${count}，预期 2`)
      const result = await activeWindow.evaluate(async apiId => {
        return require('electron').ipcRenderer.invoke('winMain_request_user_api', {
          requestKey: 'e2e-reopened-backup',
          data: { apiId, source: 'wy', action: 'musicUrl', info: { type: '128k', musicInfo: { songmid: '1' } } },
        })
      }, BACKUP_ID)
      if (result?.data?.url !== audioUrl) throw new Error('重开后备源未返回预期 URL')
      errors.push(...reopenedErrors)
      return '双窗口已重建，备源可正常取流'
    })
  }

  await screenshot(activeWindow, 'userApiBackups_final')
  console.log('\n===== 全部错误记录（含可容忍） =====')
  errors.slice(0, 30).forEach(e => console.log('  ' + e))
  await app.close()
  server.close()
  const bad = errors.filter(e => !isTolerable(e))
  const mainFailures = mainErrors.join('').split('\n').filter(line => /uncaught|Unhandled Rejection|Object has been destroyed/.test(line))
  record('U5-主进程及渲染进程无未预期错误', !bad.length && !mainFailures.length, [...bad, ...mainFailures].slice(0, 8).join('\n'))
  const fails = results.filter(r => !r.ok)
  console.log(`\n===== 汇总: PASS ${results.length - fails.length}/${results.length} =====`)
  process.exit(fails.length ? 1 : 0)
})().catch(e => { console.error('USER_API_BACKUPS E2E CRASHED:', e); process.exit(2) })
