// 这个文件导出的方法将暴露给客户端调用，第一个参数固定为当前 socket 对象
// import { getUserSpace } from '@/user'
import { FeaturesList } from '../../../../../../common/constants_sync'
import { modules } from '../../modules'


export const onFeatureChanged = async(socket: LX.Sync.Server.Socket, feature: LX.Sync.EnabledFeatures) => {
  // const userSpace = getUserSpace(socket.userInfo.name)
  const beforeFeature = socket.feature

  for (const name of FeaturesList) {
    if (feature[name] == beforeFeature[name]) continue
    if (feature[name]) {
      await modules[name].sync(socket).then(() => {
        beforeFeature[name] = true
      }).catch(_ => _)
    } else {
      socket.moduleReadys[name] = false
      beforeFeature[name] = false
    }
  }
}

