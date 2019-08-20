import kw_api_messoer from './kw/api-messoer'
import kw_api_temp from './kw/api-temp'
import tx_api_messoer from './tx/api-messoer'
import kg_api_messoer from './kg/api-messoer'
import wy_api_messoer from './wy/api-messoer'
import bd_api_messoer from './bd/api-messoer'

const apis = {
  kw_api_messoer,
  tx_api_messoer,
  kg_api_messoer,
  wy_api_messoer,
  bd_api_messoer,
  kw_api_temp,
}


const getAPI = source => {
  switch (window.globalObj.apiSource) {
    case 'messoer':
      return apis[`${source}_api_messoer`]
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
