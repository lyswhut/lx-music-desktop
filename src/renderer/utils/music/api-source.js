import kw_api_temp from './kw/api-temp'
import kw_api_test from './kw/api-test'
// import tx_api_messoer from './tx/api-messoer'
import kg_api_test from './kg/api-test'
import wy_api_test from './wy/api-test'
import bd_api_test from './bd/api-test'
// import kw_api_internal from './kw/api-internal'
// import tx_api_internal from './tx/api-internal'
// import kg_api_internal from './kg/api-internal'
// import wy_api_internal from './wy/api-internal'
// import bd_api_internal from './bd/api-internal'

const apis = {
  kw_api_test,
  // tx_api_messoer,
  kg_api_test,
  wy_api_test,
  bd_api_test,
  // kw_api_internal,
  // tx_api_internal,
  // kg_api_internal,
  // wy_api_internal,
  // bd_api_internal,
  kw_api_temp,
}


const getAPI = source => {
  switch (window.globalObj.apiSource) {
    // case 'messoer':
    //   return apis[`${source}_api_messoer`]
    case 'test':
      return apis[`${source}_api_test`]
    case 'temp':
      return apis[`${source}_api_temp`]
  }
}

export default source => {
  switch (source) {
    case 'tx':
      return getAPI('tx')
    case 'kg':
      return getAPI('kg')
    case 'wy':
      return getAPI('wy')
    case 'bd':
      return getAPI('bd')
    default:
      return getAPI('kw')
  }
}
