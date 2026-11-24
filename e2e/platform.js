/**
 * 平台相似推荐 e2e（默认引擎路径，零 LLM）：真实 UI 驱动 wy/tx 相似歌曲推荐。
 * 用法: node e2e/platform.js（需先 npm run build 产出 dist 生产构建）
 *
 * 覆盖口径（docs/platform-similar-recommendation-spec.md）：
 * - 默认引擎为平台推荐（无需 AI Key/开关）：状态行显示「平台推荐」，不显示「AI 计划/本地计划」。
 * - 平台模式隐藏无真实语义的控件：距离滑杆、一句话约束输入、弧线角色徽章（4.7）。
 * - 反馈语义：喜欢这首 / 不再推荐这首（与收藏区分），无「太远了」。
 * - 推荐入队：队列剩余 > 0，追加队尾不打断当前播放（4.5；深度口径由 vitest 覆盖）。
 * - 理由为可验证事实（来源标注），无伪声学距离数值。
 * - 设置页：推荐区提示不依赖 AI；AI 区标题标注可选。
 * 依赖外网（应用音源搜索 + wy/tx 相似端点），偶发失败属网络波动。
 */
const fs = require('fs')
const { launchApp, collectErrors, screenshot, acceptAgreement, ART_DIR } = require('./harness')
const { dismissOverlayModal, readPlaybar } = require('./pathProbe')

const results = []
function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`)
}

async function step(window, errors, name, fn, { soft = false } = {}) {
  try {
    await fn()
    record(name, true)
  } catch (err) {
    record(name, false, `${err.message}`.slice(0, 400))
    const file = await screenshot(window, `fail_${name.replace(/[^\w一-龥]+/g, '_')}`, err)
    console.log(`      screenshot: ${file}`)
    if (errors.length) console.log(`      recent errors:\n${errors.slice(-5).join('\n')}`)
    if (!soft) throw new Error(`步骤失败中止: ${name}`)
  }
}


async function nav(window, hash) {
  await window.evaluate(h => { window.location.hash = h }, hash)
  await window.waitForTimeout(800)
}

/** 等待平台计划终态（平台推荐/可区分空态/失败），返回页面全文。 */
async function waitPlatformPlanSettled(window, timeoutMs = 75000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const body = await window.evaluate(() => document.body.innerText)
    if (/平台推荐|没有可靠匹配|没有返回相似歌曲|都被过滤了|相似候选已用完|这次计划没有完成/.test(body) && !/正在计划下一段/.test(body)) return body
    await window.waitForTimeout(1500)
  }
  return window.evaluate(() => document.body.innerText)
}

async function searchAndPlay(window, keyword, offset = 0) {
  await nav(window, '#/search')
  await window.waitForTimeout(800)
  const input = window.getByPlaceholder('Search for something...').first()
  await input.fill(keyword)
  await input.press('Enter')
  await window.waitForTimeout(9000)
  await window.keyboard.press('Escape')
  await window.waitForTimeout(500)
  await dismissOverlayModal(window)
  const row = window.locator('.list-item').nth(offset)
  if (!(await row.isVisible().catch(() => false))) throw new Error(`搜索结果第 ${offset} 行不可见（网络受限？）`)
  await row.dblclick({ position: { x: 250, y: 10 } })
  await window.waitForTimeout(5000)
  const bar = await readPlaybar(window)
  if (!bar.title) throw new Error('播放栏无标题（未能播放）')
  return bar.title
}

;(async() => {
  fs.mkdirSync(ART_DIR, { recursive: true })
  const { app, window } = await launchApp()
  const errors = collectErrors(window)
  await window.waitForTimeout(3000)

  await step(window, errors, 'P1-启动与协议', async() => {
    await acceptAgreement(window)
  })

  let songTitle = ''
  await step(window, errors, 'P2-搜索并播放歌曲', async() => {
    songTitle = await searchAndPlay(window, '林俊杰')
  })

  await step(window, errors, 'P3-开台后显示平台推荐标识（默认引擎，零 AI 依赖）', async() => {
    if (!songTitle) throw new Error('前置步骤失败：无播放中歌曲')
    await nav(window, '#/explore')
    await window.locator('[aria-label="开启探索电台（跟随切歌自动推荐）"]').click()
    await window.getByText('你在这里').first().waitFor({ timeout: 20000 })
    const body = await waitPlatformPlanSettled(window)
    if (/这次计划没有完成/.test(body)) throw new Error('首计划失败（网络波动？）: ' + body.slice(0, 200))
    if (!/平台推荐/.test(body)) throw new Error('未显示平台推荐标识: ' + body.slice(0, 200))
    if (/AI 计划|本地计划/.test(body)) throw new Error('不应显示旧引擎标识')
    const remain = body.match(/队列剩余 (\d+) 首/)
    if (!remain || Number(remain[1]) <= 0) throw new Error('队列剩余为 0（平台推荐未入队）')
  })

  await step(window, errors, 'P4-平台模式隐藏无真实语义控件（距离/约束/角色徽章）', async() => {
    const slider = window.locator('.explore__radiusSlider, [class*=radiusSlider]').first()
    if (await slider.isVisible().catch(() => false)) throw new Error('距离滑杆在平台模式应隐藏')
    const input = window.getByPlaceholder('如：更冷一点、不要华语、想听纯音乐').first()
    if (await input.isVisible().catch(() => false)) throw new Error('一句话约束输入在平台模式应隐藏')
    const body = await window.evaluate(() => document.body.innerText)
    if (!/第 1 批/.test(body)) throw new Error('批次组头缺失')
    if (/守住|挖深|转向|落地/.test(body)) throw new Error('平台模式不应显示弧线角色徽章')
  })

  await step(window, errors, 'P5-反馈语义：喜欢这首/不再推荐这首（无“太远了”）', async() => {
    const like = window.getByRole('button', { name: '喜欢这首' })
    const dislike = window.getByRole('button', { name: '不再推荐这首' })
    if (!(await like.isVisible().catch(() => false))) throw new Error('「喜欢这首」按钮缺失')
    if (!(await dislike.isVisible().catch(() => false))) throw new Error('「不再推荐这首」按钮缺失')
    if (await window.getByRole('button', { name: '太远了' }).isVisible().catch(() => false)) throw new Error('平台模式不应显示「太远了」')
    await dislike.click()
    await window.waitForTimeout(3000)
    await like.click()
    await window.waitForTimeout(3000)
    const body = await window.evaluate(() => document.body.innerText)
    if (/这次计划没有完成/.test(body)) throw new Error('反馈后计划失败: ' + body.slice(0, 200))
  })

  await step(window, errors, 'P6-推荐理由为可验证事实（来源标注，无伪声学距离）', async() => {
    const rows = await window.locator('[data-explore-path-item]').evaluateAll(nodes => nodes.map(el => {
      const reasonEl = el.querySelector('[data-explore-reason]')
      const badges = Array.from(el.querySelectorAll('[data-explore-provider]')).map(b => b.getAttribute('data-explore-provider') || '')
      return {
        hasReasonEl: Boolean(reasonEl),
        text: (reasonEl?.textContent || '').trim(),
        sourceCount: Number(reasonEl?.getAttribute('data-explore-source-count') || '0'),
        badges,
      }
    }))
    if (!rows.length) throw new Error('未找到路径行节点 [data-explore-path-item]')
    const singleReasonMap = {
      wy: '网易相似歌曲推荐',
      tx: 'QQ 音乐相关歌曲推荐',
      ytm: 'YouTube Music 相关歌曲推荐',
    }
    for (const [idx, row] of rows.entries()) {
      if (!row.hasReasonEl) throw new Error(`第 ${idx + 1} 条路径行缺少推荐理由节点 [data-explore-reason]`)
      if (!row.text) throw new Error(`第 ${idx + 1} 条路径推荐理由为空`)
      if (/听感距离|节奏高度一致/.test(row.text)) throw new Error(`第 ${idx + 1} 条出现伪声学描述: ${row.text}`)
      const uniqueBadges = new Set(row.badges.filter(b => Object.prototype.hasOwnProperty.call(singleReasonMap, b)))
      if (row.sourceCount < 1 || row.sourceCount > 3 || row.badges.length !== row.sourceCount || uniqueBadges.size !== row.sourceCount) {
        throw new Error(`第 ${idx + 1} 条来源徽章数量或唯一性不匹配: sourceCount=${row.sourceCount}, badges=${JSON.stringify(row.badges)}`)
      }
      if (row.sourceCount === 3) {
        if (row.text !== '三个平台共同推荐') throw new Error(`第 ${idx + 1} 条三源理由不匹配: ${row.text}`)
      } else if (row.sourceCount === 2) {
        if (row.text !== '两个平台共同推荐') throw new Error(`第 ${idx + 1} 条双源理由不匹配: ${row.text}`)
      } else {
        const expected = singleReasonMap[row.badges[0]]
        if (!expected || row.text !== expected) {
          throw new Error(`第 ${idx + 1} 条单源理由与徽章不一致: badge=${row.badges[0]}, text=${row.text}`)
        }
      }
    }
  })

  await step(window, errors, 'P7-设置页：推荐不依赖 AI 开关', async() => {
    await nav(window, '#/setting')
    await window.waitForTimeout(1000)
    await window.getByText('AI 分析与排序（可选）').first().click()
    await window.waitForTimeout(800)
    const body = await window.evaluate(() => document.body.innerText)
    if (!/不依赖 AI Key/.test(body)) throw new Error('推荐区缺少“不依赖 AI Key”提示')
    if (!/平台相似歌曲/.test(body)) throw new Error('推荐区缺少平台相似推荐说明')
  })

  await step(window, errors, 'P8-收集页面错误', async() => {
    if (errors.length) throw new Error(`页面错误 ${errors.length} 条: ${errors.slice(3).join('\n')}`)
  })

  await app.close()
  const failed = results.filter(r => !r.ok)
  console.log(`\n===== platform e2e: ${results.length - failed.length}/${results.length} PASS =====`)
  process.exit(failed.length ? 1 : 0)
})().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
