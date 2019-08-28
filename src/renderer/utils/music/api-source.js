import kw_api_temp from './kw/api-temp'
// import kw_api_messoer from './kw/api-messoer'
// import tx_api_messoer from './tx/api-messoer'
// import kg_api_messoer from './kg/api-messoer'
// import wy_api_messoer from './wy/api-messoer'
// import bd_api_messoer from './bd/api-messoer'
import kw_api_internal from './kw/api-internal'
import tx_api_internal from './tx/api-internal'
import kg_api_internal from './kg/api-internal'
import wy_api_internal from './wy/api-internal'
import bd_api_internal from './bd/api-internal'

const apis = {
  // kw_api_messoer,
  // tx_api_messoer,
  // kg_api_messoer,
  // wy_api_messoer,
  // bd_api_messoer,
  kw_api_internal,
  tx_api_internal,
  kg_api_internal,
  wy_api_internal,
  bd_api_internal,
  kw_api_temp,
}


const getAPI = source => {
  switch (window.globalObj.apiSource) {
    // case 'messoer':
    //   return apis[`${source}_api_messoer`]
    case 'internal':
      return apis[`${source}_api_internal`]
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
