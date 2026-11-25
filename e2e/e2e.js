/**
 * e2e 全流程：启动 → 许可协议 → T-B2 探索页/播放栏 → T-A1 歌单链接识别 → T-A3 更新弹窗 → 设置 AI → 搜索播放 → 探索会话。
 * 用法: node e2e/e2e.js
 *
 * 说明：
 * - 每步独立 try/catch，任何一步失败不阻断后续步骤；最终输出 PASS/FAIL 汇总。
 * - 默认使用正式歌曲来源名称（酷我音乐 kw、网易云音乐 wy、QQ音乐 tx、酷狗音乐 kg、咪咕音乐 mg），与默认设置一致。
 */
const { launchApp, collectErrors, screenshot, ART_DIR } = require('./harness')
const { dismissOverlayModal } = require('./pathProbe')
const fs = require('fs')

const results = []
function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`)
}

async function step(window, errors, name, fn) {
  try {
    await fn()
    record(name, true)
  } catch (err) {
    record(name, false, `${err.message}`)
    const file = await screenshot(window, `fail_${name.replace(/[^\w\u4e00-\u9fff]+/g, '_')}`)
    console.log(`      screenshot: ${file}`)
    if (errors.length) console.log(`      recent errors:\n${errors.slice(-5).join('\n')}`)
  }
}

/** 等待协议弹窗倒计时结束并点击“接受”，随后关闭开源声明弹窗。 */
async function acceptAgreement(window) {
  const btn = window.locator('button').filter({ hasText: /^接受/ }).first()
  await btn.waitFor({ timeout: 15000 })
  for (let i = 0; i < 25; i++) {
    const text = await btn.textContent()
    if (!/\d/.test(text)) break
    await window.waitForTimeout(1000)
  }
  await btn.click()
  await window.waitForTimeout(2000)
  const okBtn = window.locator('button').filter({ hasText: '好的 (OK)' }).first()
  if (await okBtn.isVisible().catch(() => false)) {
    await okBtn.click()
    await window.waitForTimeout(1000)
  }
}

/** 点击任意 modal 的 header 关闭按钮（header > button 仅存在于 modal）。 */
async function closeModal(window) {
  await window.evaluate(() => {
    document.querySelector('header button')?.click()
  })
  await window.waitForTimeout(600)
}

/** 直接改 hash 导航（页面被弹窗遮罩时也能切换路由）。 */
async function nav(window, hash) {
  await window.evaluate(h => { window.location.hash = h }, hash)
  await window.waitForTimeout(800)
}

/** 当前页面上是否有 Modal 遮挡。 */
async function modalOpen(window) {
  return window.evaluate(() => !!document.querySelector('header button'))
}

// 正式歌曲来源名称（默认设置 common.sourceNameType = real）
const ALIAS = { wy: '网易云音乐', tx: 'QQ音乐', kg: '酷狗音乐', kw: '酷我音乐', mg: '咪咕音乐' }
const testUrl = { wy: 'https://music.163.com/#/playlist?id=1234567890', tx: 'https://y.qq.com/n/ryqq/playlist/5437801861', kg: 'https://www.kugou.com/special/single/12345678.html' };

(async() => {
  fs.mkdirSync(ART_DIR, { recursive: true })
  const { app, window } = await launchApp()
  const errors = collectErrors(window)
  await window.waitForTimeout(3000)

  await step(window, errors, '启动-许可协议签署', async() => {
    await acceptAgreement(window)
  })

  await step(window, errors, '启动-主界面无白屏', async() => {
    const rootChildren = await window.evaluate(() => document.querySelector('#root')?.childElementCount ?? 0)
    if (rootChildren < 2) throw new Error(`root 子元素 ${rootChildren}`)
  })

  // ---------- T-B2 探索入口（未播放时） ----------
  await step(window, errors, '探索页-空态与入口', async() => {
    await window.getByRole('tab', { name: '探索' }).click()
    await window.waitForTimeout(1200)
    await window.getByText('请先播放一首歌曲，再开始探索').first().waitFor({ timeout: 5000 })
    // 页面内开始按钮（getByText 只匹配文本，播放栏按钮仅有 aria-label）
    const startBtn = window.getByText('从此歌出发').first()
    const disabled = await startBtn.isDisabled().catch(() => false)
    if (!disabled) throw new Error('未播放时开始按钮应为禁用')
  })

  // ---------- T-A1 打开歌单弹窗：链接自动识别音源 ----------
  await step(window, errors, 'A1-弹窗打开与网易云链接识别', async() => {
    await nav(window, '#/songList/list')
    await window.getByRole('button', { name: '打开歌单' }).click()
    await window.waitForTimeout(800)
    const input = window.getByPlaceholder('输入歌单链接或歌单 ID')
    await input.fill(testUrl.wy)
    await window.waitForTimeout(600)
    const selText = await window.locator('.label-content').last().textContent()
    if (selText.trim() !== ALIAS.wy) throw new Error(`识别后音源=${selText.trim()}，期望 ${ALIAS.wy}`)
  })

  await step(window, errors, 'A1-腾讯/酷狗链接识别', async() => {
    const input = window.getByPlaceholder('输入歌单链接或歌单 ID')
    await input.fill(testUrl.tx)
    await window.waitForTimeout(600)
    let selText = await window.locator('.label-content').last().textContent()
    if (selText.trim() !== ALIAS.tx) throw new Error(`腾讯识别=${selText.trim()}`)
    await input.fill(testUrl.kg)
    await window.waitForTimeout(600)
    selText = await window.locator('.label-content').last().textContent()
    if (selText.trim() !== ALIAS.kg) throw new Error(`酷狗识别=${selText.trim()}`)
  })

  await step(window, errors, 'A1-无效输入不改变音源', async() => {
    const input = window.getByPlaceholder('输入歌单链接或歌单 ID')
    await input.fill('123456')
    await window.waitForTimeout(600)
    const selText = await window.locator('.label-content').last().textContent()
    if (selText.trim() !== ALIAS.kg) throw new Error(`音源被改变=${selText.trim()}`)
  })

  await step(window, errors, 'A1-关闭弹窗', async() => {
    await closeModal(window)
    if (await modalOpen(window)) throw new Error('弹窗未关闭')
  })

  // ---------- T-A3 列表更新管理弹窗 ----------
  await step(window, errors, 'A3-列表更新管理弹窗', async() => {
    await nav(window, '#/list')
    await window.getByRole('button', { name: '列表更新管理' }).click()
    await window.waitForTimeout(1200)
    if (!(await window.getByText('列表更新管理').first().isVisible().catch(() => false))) throw new Error('弹窗标题未显示')
    await closeModal(window)
  })

  // ---------- 设置 AI 页 ----------
  await step(window, errors, '设置-AI推荐页渲染与开关', async() => {
    await nav(window, '#/setting')
    await window.waitForTimeout(1000)
    await window.getByText('AI 推荐').first().click()
    await window.waitForTimeout(800)
    // base-checkbox 的 input 是视觉隐藏，仅校验 DOM 存在
    const checkbox = await window.evaluate(() => !!document.querySelector('#setting_ai_enable'))
    if (!checkbox) throw new Error('AI 启用复选框缺失')
    const radius = await window.evaluate(() => !!document.querySelector('#setting_recommend_auto_refill'))
    if (!radius) throw new Error('自动续补复选框缺失')
  })

  // ---------- 搜索并播放一首歌（外部网络依赖） ----------
  await step(window, errors, '搜索-周杰伦(网络)', async() => {
    await nav(window, '#/search')
    await window.waitForTimeout(800)
    const input = window.getByPlaceholder('Search for something...').first()
    await input.fill('周杰伦')
    await input.press('Enter')
    await window.waitForTimeout(9000)
    const rowText = await window.evaluate(() => document.body.innerText)
    if (!/周杰伦/.test(rowText) || /没有找到|暂无相关/.test(rowText)) throw new Error('搜索结果未见（疑似网络受限）')
  })

  await step(window, errors, '播放-双击第一首(网络)', async() => {
    // 关闭搜索联想下拉，避免遮挡结果行
    await window.keyboard.press('Escape')
    await window.waitForTimeout(800)
    await dismissOverlayModal(window)
    let ok = false
    for (let idx = 0; idx < 3; idx++) {
      const row = window.locator('.list-item').nth(idx)
      if (!(await row.isVisible().catch(() => false))) break
      await row.dblclick({ position: { x: 250, y: 10 } })
      await window.waitForTimeout(6000)
      const paused = await window.locator('[aria-label="暂停"]').isVisible().catch(() => false)
      const body = await window.evaluate(() => document.body.innerText)
      if (paused || /(0[1-9]|[1-5]\d):\d{2}\s*\/\s*\d{2}:\d{2}/.test(body)) { ok = true; break }
    }
    if (!ok) throw new Error('前三行均未能播放（疑似网络/源受限）')
  })

  await step(window, errors, '探索-播放栏按钮与会话', async() => {
    const btn = window.locator('[aria-label="从此歌出发"]')
    const disabled = await btn.isDisabled().catch(() => true)
    if (disabled) throw new Error('播放栏探索按钮仍禁用')
    await btn.click()
    await window.waitForTimeout(1000)
    await window.getByText('你在这里').first().waitFor({ timeout: 15000 })
  })

  await step(window, errors, '探索-本地引擎计划完成', async() => {
    await window.getByText(/本地计划|AI 计划|这次计划没有完成|自动续补失败/).first().waitFor({ timeout: 45000 })
    const body = await window.evaluate(() => document.body.innerText)
    if (/这次计划没有完成|自动续补失败/.test(body) || !/(本地计划|AI 计划)/.test(body)) {
      throw new Error('计划未完成:' + body.slice(0, 300))
    }
    if (!/队列剩余/.test(body)) throw new Error('未见队列剩余计数')
    // 应有至少一条路径项
    if (!/守住|挖深|打开|转向|落地/.test(body)) throw new Error('未见角色标签（路径为空）')
  })

  await step(window, errors, '探索-反馈与结束', async() => {
    await window.getByRole('button', { name: '就这个方向' }).click().catch(() => {})
    await window.waitForTimeout(1200)
    await window.getByRole('button', { name: '结束会话' }).click()
    await window.waitForTimeout(800)
    const after = await window.evaluate(() => document.body.innerText)
    if (/队列剩余|你在这里/.test(after)) throw new Error('结束会话后仍显示会话卡片')
  })

  console.log('\n===== 汇总 =====')
  const fails = results.filter(r => !r.ok)
  console.log(`PASS ${results.length - fails.length}/${results.length}，FAIL ${fails.length}`)
  console.log('===== ERRORS (' + errors.length + ') =====')
  errors.slice(0, 30).forEach(e => console.log(e))

  await screenshot(window, 'final')
  await app.close()
  process.exit(fails.length ? 1 : 0)
})().catch(err => {
  console.error('E2E CRASHED:', err)
  process.exit(2)
})
