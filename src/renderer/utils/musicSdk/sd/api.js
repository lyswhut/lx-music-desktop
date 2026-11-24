import { httpFetch } from '../../request'
import { sign } from './sign'

export const buildParams = (extra = {}, now = Date.now()) => ({
  device_platform: 'android',
  os: 'android',
  ssmix: 'a',
  _rticket: String(now),
  channel: 'tengxun_8478_64',
  aid: '8478',
  app_name: 'luna',
  version_code: '100206030',
  version_name: '20.6.0',
  manifest_version_code: '100206030',
  update_version_code: '100206030',
  resolution: '1600*900',
  dpi: '240',
  device_brand: 'SAMSUNG',
  language: 'zh',
  os_api: '35',
  os_version: '15',
  ac: 'wifi',
  package: 'com.luna.music',
  charge: '0',
  save_power: '0',
  font_size: '1.00',
  luna_apk_type: 'normal_apk',
  luna_first_launch_apk_type: 'normal_apk',
  output_device_type: 'Phone',
  diversion_channel_name: 'tengxun_8478_64',
  is_car_play: '0',
  battery: '0.70',
  network_speed: '332',
  volume: '1.00',
  hybrid_version_code: '100206030',
  brightness: '0.08',
  tz_name: 'Asia/Shanghai',
  tz_offset: '28800',
  need_personal_recommend: '1',
  is_teen_mode: '0',
  sim_region: 'cn',
  android_device_type: 'pad',
  iid: '1',
  device_id: '1',
  ...extra,
})

export const buildHeaders = (now = Date.now()) => ({
  'User-Agent': 'com.luna.music/100206030 (Linux; U; Android 15; zh_CN; Unknown; Build/SQ1A.220205.002;tt-ok/3.12.13.19)',
  'x-ss-req-ticket': String(now),
  'x-luna-api-version': '2023-01-04',
  'x-luna-is-background-req': '0',
  'x-luna-personal-recommend-status': '1',
  'x-luna-base-mode': '0',
  'x-luna-teen-mode': '0',
  'x-webcast-sdk-version': '4370',
  'x-luna-is-login': '0',
  'x-luna-is-android-pad': '1',
  'x-vc-bdturing-sdk-version': '4.0.5.cn',
  'sdk-version': '2',
})

export const request = (path, { params, body } = {}) => {
  const now = Date.now()
  const query = Object.entries(buildParams(params, now)).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
  const bodyString = body ? JSON.stringify(body) : ''
  const requestObj = httpFetch(`https://api.qishui.com${path}?${query}`, {
    method: body ? 'post' : 'get',
    headers: {
      ...buildHeaders(now),
      ...(body || path == '/luna/comments' ? sign(query, bodyString, Math.floor(now / 1000)) : {}),
      ...(body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
    },
    ...(body ? { body: bodyString } : {}),
  })
  requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
    if (statusCode != 200 || !body || typeof body != 'object') throw new Error('汽水音乐请求失败')
    const status = body.status_info
    const code = body.status_code || status?.code
    if (code) throw new Error(status?.status_msg || status?.message || status?.msg || `汽水音乐请求失败 (${code})`)
    return body
  })
  return requestObj
}

export const search = (type, keyword, cursor = '') => request(`/luna/search/${type}`, {
  body: {
    ab_param: '{"enable_search_all_video":1,"enable_search_video":1}',
    q: keyword,
    search_id: `${Date.now()}${Math.random().toString(16).slice(2)}`,
    search_method: 'input',
    search_scene: 'main',
    ...(cursor ? { cursor: String(cursor) } : {}),
  },
})


export const trackDetail = songId => request('/luna/track_v2', {
  params: {
    device_id: '467720581219066',
    iid: '1202197119145354',
    cdid: '5d00171e-6745-4c9b-8dfc-a8fdce3ae65a',
  },
  body: { track_id: String(songId) },
})
