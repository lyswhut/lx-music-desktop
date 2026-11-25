# e2e（Playwright × Electron）

针对 T-A1~T-A3 / T-B0~T-B2 新能力的端到端测试，测试对象为 **dist 生产构建**。
当前可执行回归门禁是 `npm run test:e2e`，它会先构建并依次运行平台推荐、电台、歌单同步和多活音源四条链路。

2026-10-05 实现提交 `95472e58` 的 [三端 CI](https://github.com/lurenyi4/lx-music-desktop/actions/runs/37274748080)
已全部通过，包括三端完整测试、七架构打包检查和统一门禁；跨架构产物检查不代表目标架构实机运行。

GitHub Actions 的 `validate.yml` 在 Windows、Linux、macOS 原生 runner 上分别运行
lint、typecheck、完整单测、生产构建和这四条 Electron E2E；Linux 使用 Xvfb。
同步和多活音源套件还依赖 `sqlite3` CLI：CI 在 Linux 显式通过 apt 安装，Windows 从 Chocolatey
社区官方源安装 `sqlite` 包并把 shim 目录写入 PATH，macOS 使用系统 CLI；三端运行 E2E 前均检查 `sqlite3 --version`。
`npm run test:ci` 额外检查发布依赖关系，并在真实 Electron 中执行 SQLite 建表、插入和查询，
以检测 Node/Electron ABI 错配。`npm ci` 的 postinstall 会将锁定包对应架构的 N-API 预编译绑定放到应用实际加载的路径；缺少预编译时按 Electron 版本重建。
Windows 需要 Visual Studio C++ Build Tools；Linux 需要本地 C/C++ 工具链，macOS 需要 Xcode 命令行工具。

验证另包含 Windows x64/arm64、macOS x64/arm64、Linux x64/arm64/armv7l 的无发布打包。
跨架构打包仅验证包可生成，不表示目标架构已运行测试；Linux ARM 打包需要对应 GNU 交叉编译器。
只有 Linux ARM 打包在打包前导出目标 `CC`/`CXX`；宿主架构和 macOS/Windows 保留 runner 的默认编译器，避免空矩阵值覆盖默认环境。
每个打包 job 还检查实际包内 ASAR 的 SQLite 绑定与 Electron 可执行文件的二进制架构，防止夹带宿主架构的原生模块。
Windows 7 的旧 Electron 22 打包仍属于兼容产物，不代表 CI 在 Windows 7 实机运行过。
三端测试和打包任一失败、取消或跳过，`All platforms passed` 门禁都会失败；
release/beta 的全部发布或产物上传 job 必须等待同一次 workflow 对当前提交完成验证。
各 E2E 套件独立运行于一个 step，Windows 发布准备和多产物发布逐条检查原生命令退出码，避免后续成功覆盖先前失败。
平台推荐、电台和歌单同步 E2E 依赖外部音源，网络失败也会阻断门禁，不会忽略失败。
单项脚本可在构建后分别执行 `npm run test:e2e:platform`、`npm run test:e2e:radio`、
`npm run test:e2e:sync`、`npm run test:e2e:user-api`。

单独运行脚本前先运行
`npm run build:main && npm run build:renderer && npm run build:renderer-lyric && npm run build:renderer-scripts`。

> **⚠ 电台化演进后的过时声明（2026-09-13，探索电台 TT-1~TT-5 合入后）**
> 本目录脚本的 T-B1/T-B2 断言尚未适配电台语义，已知失效点：
> - `e2e/e2e.js`、`e2e/deep.js`、`e2e/ai.js` 中播放栏按钮定位器 `[aria-label="从此歌出发"]`
>   已不存在——该按钮演进为电台开关，aria-label 随状态在"开启探索电台/关闭探索电台"间切换（`explore__radio_start/stop`）。
> - 经 UI 开启的探索会话现在=电台开启：路径外切歌会自动跟歌重锚（约 1.2s 防抖），
>   `deep.js` D7b"切歌后再点按钮重开会话"类手序会被自动重锚抢先/干扰；点击开关按钮的语义变为"收台"。
> - 首计划与续补统一追加稍后播放**队尾**（不再置顶），任何断言队列头部顺序的校验需复核。
> - "结束会话"按钮现在经设置项（`recommend.radio`）单源收台并清场，行为结果不变（回空态）但链路不同。
> 在上述断言完成适配前，`e2e/e2e.js`、`e2e/deep.js`、`e2e/ai.js` 对电台相关场景的结果不可作为回归依据；
> 它们保留为历史探索脚本，不纳入 `npm run test:e2e`。当前门禁使用已经适配的
> `platform.js`、`radio.js`、`sync.js` 和 `userApiBackups.js`。
> `e2e/common.js`、`e2e/smoke.js`、`e2e/sync.js` 与 sameSong 相关断言不涉及上述触面。

## 运行

```bash
node e2e/e2e.js    # 基线：启动/协议/探索空态/A1 链接识别/A3 弹窗/设置 AI/搜索播放/探索会话
node e2e/deep.js   # T-B2 深度：自动续补/far 反馈/一句话约束/离开返回/幂等/结束
node e2e/sync.js   # T-A2/T-A3：导入真实歌单→元数据持久化校验→重启→启动自动同步记录
node e2e/ai.js     # T-B1：mock LLM（e2e/mockLlm.js）→ 设置 AI → AI 计划/排序请求命中（预写 recommend.engine='ai'）
node e2e/radio.js  # 探索电台（TT-1~TT-5）：跟歌重锚/约束作废/本地引擎/断网失败收台/指标落盘/重启自动开台（预写 recommend.engine='local'）
node e2e/platform.js  # 平台相似推荐（默认引擎，零 LLM）：平台推荐标识/隐藏距离与约束控件/喜欢与不再推荐反馈/来源理由/设置页不依赖 AI
node e2e/common.js  # 常用功能回归：导航/搜索/播放控制/播放详情/桌面歌词/我的列表 CRUD/收藏/榜单/设置 tab
node e2e/userApiBackups.js  # 多活音源（ADR-0003）：双假源/源管理/回退取流/两首列表写回后持续播放/macOS 重开窗口恢复/主进程与渲染进程异常检查
node e2e/smoke.js  # 仅冒烟：启动+页面文本+错误采集
```

> 2026-09-20 平台相似推荐合入后：推荐默认引擎为 platform（平台相似歌曲，零 LLM）。
> `radio.js`/`ai.js` 分别预写 `recommend.engine='local'/'ai'` 以回归旧引擎路径；
> 平台默认路径由 `platform.js` 覆盖（依赖外网 wy/tx 相似端点，见 docs/platform-similar-recommendation-p0.md）。

## 关键约定

- **数据隔离**：macOS 上 Electron 的 `userData` **不跟随 `$HOME`**，必须传
  `--user-data-dir=<临时目录>`（见 `harness.js`），否则会读写真实用户数据。
  这是踩坑后的硬性约定，请勿回退成 HOME 方案。
- 首次启动需过“许可协议”倒计时与“开源声明”弹窗，共同的 `harness.acceptAgreement()` 等待按钮真实启用并点击，
  校验同意状态和许可弹窗隐藏，再等待并确认延迟出现的声明。只有状态已同意的重启 profile 可以跳过；按钮缺失会失败。
  对无音频设备环境，只确认完整匹配的音频设备警告，其他弹窗仍会阻断；90 秒总期限不增加，期间持续检查真正启用和可点击状态。
- 四条当前门禁统一使用中文测试 profile，避免 runner 系统语言影响其他中文 UI 断言；助手也支持英文等正向接受按钮，
  不会预写同意状态。普通遮罩兜底遇到许可协议会明确失败，禁止误点第一个“不接受/Decline”按钮导致退出。
- profile 的 `setting.version` 使用生产配置版本 `2.1.0`，与外层应用版本分开；多活音源也复用同一 profile 工厂。
  CI 构建后运行 `profileLanguage.js`，在 `--lang=en-US` 环境经过真实生产迁移和 renderer 初始化，
  分别确认默认中文、显式英文及当前应用版本 metadata profile 的语言；只检查落盘 JSON 不能证明语言设置生效。
- 首启“更新日志”弹窗（`common.showChangeLog`）在版本信息网络返回后才弹出、时机不定，
  常拦截后续点击造成随机级联超时；`harness.js` 已在新建 profile 时预写
  `LxDatas/config_v2.json` 关闭它。兜底仍保留 `pathProbe.dismissOverlayModal()`。
- 播放栏按钮是 `div[aria-label]` 而非 `<button>`，选择器用 `[aria-label=…]` 通用属性匹配。
- 默认使用正式来源名称（酷我音乐=kw、网易云音乐=wy、QQ音乐=tx、酷狗音乐=kg、咪咕音乐=mg）。
- 搜索/播放依赖外网音源，偶发失败属网络波动（套件其余步骤仍会继续）。
- 截图、main/renderer console、进程 stdout/stderr、关闭/崩溃事件写入 `${RUNNER_TEMP}/lx-e2e-artifacts/`，
  本机未设置 `RUNNER_TEMP` 时使用系统临时目录；截图失败也保存错误文本。CI 测试失败时上传对应系统的诊断 artifact。
  功能断言失败另保存完整异常、DOM/text、button disabled 和遮罩布局信息，避免简短终端输出丢失 Playwright call log。
- Linux CI 安装中文字体并创建 PulseAudio null sink，保留真实播放流程且提供可枚举的虚拟音频输出。
- 电台 R9 使用单提供方的同关键词/页码缓存返回搜索页；聚合搜索重新挂载会重发请求，不能假定断网时仍有行。
  R9 仍要求真实计划失败与上限收台日志、UI 收台及恢复，并检查缓存查询没有在断网期间重发。
- R9/R10 另使用 `radioProvider.cjs` 的本地 HTTP provider fixture：KW wire 数据仍由真实 SDK 解析，
  搜索缓存、队列、重锚、计划失败计数和收台/恢复均执行生产代码。离线模式明确拒绝真实 Node provider 请求，
  因为浏览器 CDP 网络阻断不能覆盖 renderer 的 Needle/Node HTTP 搜索。
  fixture 只替换这些用例的搜索 provider，R1–R7 和平台/同步/多活音源的在线链路仍独立测试；
  R10 通过启动前 initScript 安装 fixture，保持真实应用重启，不通过重新加载 renderer 修复状态。

## 路径点击跳播探针（pathProbe.js）

`deep.js` D3b 与 `ai.js` AI-路径点击跳播共用 `e2e/pathProbe.js`：
仅断言播放栏标题切换**不足以**证明真正换歌（`setPlayMusicInfo` 会同步切标题，
但若播放器没有加载新音频，用户会看着新标题继续听旧歌）。探针叠加音频级信号：

- `playerLoadstart`（主音频元素加载了新资源）；
- 播放栏状态文本变化（URL 拉取/换源失败）；
- 标题后来被自动切歌顶走成别的歌（限流环境下换源失败后 FIFO 弹队首的证据）。

任一信号 + 标题命中即判“机制正常”；限流导致资源未加载属于外部因素。

## 历史显示文本同曲探针（sameSongRules.js）

`deep.js` D3c（路径无重复曲目）用 `pathProbe.sameSongText` 两两比对路径行。该实现与
`src/renderer/core/recommend/sameSong.ts` 物理独立，保留历史显示文本规则，不直接复用被测实现。

`e2e/sameSongRules.test.js`（`npm test` 自动收集）只对现有共享语料逐例比对两侧判定——
真实 artist 顺序/合作者变体、全部分隔符、大小写与空白差异、空艺人、`(Live)` 版本、同名异曲。
当前生产规则另外支持零宽字符、括号归一化及括号艺人别名，上述历史探针与共享语料未覆盖这些扩展，
也无法从展示文本检查首选/备用来源的完整证据。通过该语料不能证明与当前推荐去重全面一致。
当前身份规则由 `sameSong.test.ts`、`similarFusion.test.ts`、`platformAnchor.test.ts`、
`legacyIdentity.test.ts`、`queue.test.ts` 和 `submission.test.ts` 等回归覆盖；改动规则后仍应运行全量 `npm test`。
本轮实际验证范围见 [Fork 后续审查修复](../docs/fork-review-fixes.md#本轮验证与边界)。


## 播放缓存跨模块回归

`npm test` 收集 `musicUrlCache.test.ts` 与 `onlineCache.test.ts`：前者覆盖 Vue 代理通过真实结构化克隆往返，后者覆盖真实数据库缓存序列化与渲染取流入口，包括未知/损坏来源、禁止换源、刷新、持久写入等待和写入失败。这些 Vitest 测试使用 IPC/数据库替身，不能替代上面的 Electron GUI E2E。
