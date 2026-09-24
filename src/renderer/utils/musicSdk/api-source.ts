import apiSourceInfo from './api-source-info'
import { apiSource, userApi } from '@renderer/store'
// import api_temp_kw from './kw/api-temp'
// // import api_test_bd from './bd/api-test'
// import api_test_tx from './tx/api-test'
// import api_test_kg from './kg/api-test'
// import api_test_kw from './kw/api-test'
// import api_test_mg from './mg/api-test'
// import api_test_wy from './wy/api-test'

const allApi: Record<string, any> = {}

const apiList: Record<string, any> = {}
const supportQuality: Record<string, Partial<Record<LX.OnlineSource, LX.Quality[]>>> = {}

for (const api of apiSourceInfo) {
  supportQuality[api.id] = api.supportQualitys
  for (const source of Object.keys(api.supportQualitys)) {
    apiList[`${api.id}_api_${source}`] = allApi[`${api.id}_${source}`]
  }
}

const getAPI = (source: string): any => apiList[`${apiSource.value}_api_${source}`]

const apis = (source: string): any => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- eslint 上下文（根 tsconfig）类型退化为 any 会误判断言多余，渲染进程 tsc 需要它们
  if (/^user_api/.test(apiSource.value!)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- 同上
    return userApi.apis[source as keyof typeof userApi.apis]
  }
  let api = getAPI(source)
  if (api) return api
  throw new Error('Api is not found')
}

export { apis, supportQuality }
