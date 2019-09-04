// import api from 'api/connom'
import { httpGet } from '../utils/request'
import { author, name } from '../../../package.json'

export default {
  getVersionInfo() {
    return new Promise((resolve, reject) => {
      httpGet(`https://raw.githubusercontent.com/${author.name}/${name}/master/publish/version.json`, (err, resp, body) => {
        if (!err) {
          return resolve({
            version: '0.0.0',
            desc: '<h3>版本信息获取失败</h3><ul><li>更新信息获取失败，可能是无法访问Github导致的，请手动检查更新！</li><li>检查方法：去设置-关于洛雪音乐打开<strong>开源地址</strong>或<strong>网盘地址</strong>查看<strong>版本号</strong>与当前版本对比是否最新</li></ul>',
            history: [],
          })
        }
        resolve(body)
      })
    })
  },
}
