// 这个文件导出的方法将暴露给客户端调用，第一个参数固定为当前 socket 对象
// import { getUserSpace } from '@/user'
import { FeaturesList } from '../../../../../../common/constants_sync'
import { modules } from '../../modules'

const handler: LX.Sync.ServerSyncHandlerActions<LX.Sync.Server.Socket> = {
  async onFeatureChanged(socket, feature) {
    // const userSpace = getUserSpace(socket.userInfo.name)
    const beforeFeature = socket.feature

    for (const name of FeaturesList) {
      const newStatus = feature[name]
      if (newStatus == null) continue
      beforeFeature[name] = feature[name]
      socket.moduleReadys[name] = false
      if (feature[name]) await modules[name].sync(socket).catch(_ => _)
    }
  },
}

export default handler
