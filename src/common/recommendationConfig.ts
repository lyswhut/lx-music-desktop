export const LLM_DEFAULT_CONCURRENCY = 3
export const LLM_MAX_CONCURRENCY = 8

/** 导入旧配置或异常值时仍保证请求上限有效。 */
export const normalizeLlmConcurrency = (value: unknown): number => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 1
    ? Math.min(LLM_MAX_CONCURRENCY, Math.floor(n))
    : LLM_DEFAULT_CONCURRENCY
}

// ===== 平台相似推荐（docs/platform-similar-recommendation-spec.md）=====

/** 推荐引擎取值：platform=平台相似（默认，零 LLM）；ai/local=旧引擎（显式选择）。 */
export type RecommendEngine = 'platform' | 'ai' | 'local'

/** 读取持久化设置中的引擎值：兼容旧 ai/local 值；缺省/垃圾值回落 platform（平台推荐为默认路径）。 */
export const normalizeRecommendEngine = (value: unknown): RecommendEngine => {
  return value === 'ai' || value === 'local' ? value : 'platform'
}

/** 排名融合常数 k：等权倒数排名融合 Σ 1/(k + rank)，rank 从 1 开始。
 * 仅是初始排序方案，不代表声学距离或偏好概率；集中配置便于统一调整。 */
export const SIMILAR_FUSION_K = 10

/** 平台相似请求超时（毫秒）：适配层对每个平台调用设置有限超时，不无限等待。 */
export const SIMILAR_REQUEST_TIMEOUT_MS = 10_000

/** 种子定位搜索超时（毫秒）。 */
export const SIMILAR_SEED_SEARCH_TIMEOUT_MS = 10_000

/** 相似结果缓存 TTL（毫秒）：按平台 + 种子原生 id 缓存归一化结果。 */
export const SIMILAR_CACHE_TTL_MS = 30 * 60 * 1000

/** 相似结果缓存容量上限（种子条数，LRU 淘汰）。 */
export const SIMILAR_CACHE_MAX_ENTRIES = 64

/** 跨平台种子匹配的时长容差（秒）：用于版本/现场版甄别与多候选择优，不作硬性证据。 */
export const SEED_MATCH_DURATION_TOLERANCE_SEC = 15

// ===== YouTube Music 推荐接入配置 =====

/** 整条 YTM 推荐链路（种子搜索 + next/Related + 桥接解析）共享的总截止时间（毫秒）。 */
export const YTM_TOTAL_BUDGET_MS = 12_000

/** YTM 单次 InnerTube HTTP 请求超时上限（毫秒；实际受剩余总预算约束）。 */
export const YTM_REQUEST_TIMEOUT_MS = 8_000

/** 聚合搜索（all）中 YTM 增量合并软超时预算（毫秒；超时后立即取消，不影响国内源结果展示）。 */
export const YTM_AGGREGATE_SEARCH_TIMEOUT_MS = 4_000

/** 设置页「测试 YouTube Music 连通性」总超时预算（毫秒；覆盖代理冷握手与并行探测）。 */
export const YTM_CONNECTION_TEST_TIMEOUT_MS = 15_000

/** YTM 独有曲目懒解析国内可播音源的并发上限。 */
export const YTM_BRIDGE_CONCURRENCY = 3

/** YTM 懒解析目标冗余数（maxItems + 本值，避免单次把整页 25 首全部发国内搜索）。 */
export const YTM_BRIDGE_TARGET_EXTRA = 4

/** 单个种子最多向 YTM 拉取的 continuation 页数上限。 */
export const YTM_MAX_PAGES = 5

/** YTM → 国内可播条目桥接缓存容量上限（按 videoId + domesticProvider 计数）。 */
export const YTM_BRIDGE_CACHE_MAX_ENTRIES = 256

/** YTM 区域可达性探测缓存 TTL（毫秒；按实际代理上下文隔离）。 */
export const YTM_REGION_CACHE_TTL_MS = 10 * 60 * 1000
