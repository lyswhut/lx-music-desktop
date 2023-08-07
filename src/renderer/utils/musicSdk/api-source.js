import apiSourceInfo from './api-source-info'
import { apiSource, userApi } from '@renderer/store'
import api_temp_kw from './kw/api-temp'
// import api_test_bd from './bd/api-test'
import api_test_tx from './tx/api-test'
import api_test_kg from './kg/api-test'
import api_test_kw from './kw/api-test'
import api_test_mg from './mg/api-test'
import api_test_wy from './wy/api-test'

const allApi = {
  temp_kw: api_temp_kw,
  // test_bd: api_test_bd,
  test_tx: api_test_tx,
  test_kg: api_test_kg,
  test_kw: api_test_kw,
  test_mg: api_test_mg,
  test_wy: api_test_wy,
}

const apiList = {}
const supportQuality = {}

for (const api of apiSourceInfo) {
  supportQuality[api.id] = api.supportQualitys
  for (const source of Object.keys(api.supportQualitys)) {
    apiList[`${api.id}_api_${source}`] = allApi[`${api.id}_${source}`]
  }
}

const getAPI = source => apiList[`${apiSource.value}_api_${source}`]

const apis = source => {
  if (/^user_api/.test(apiSource.value)) return userApi.apis[source]
  let api = getAPI(source)
  if (api) return api
  throw new Error('Api is not found')
}

export { apis, supportQuality }
