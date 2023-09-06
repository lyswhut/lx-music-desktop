// 这个文件导出的方法将暴露给服务端调用，第一个参数固定为当前 socket 对象

// import { getUserSpace } from '@/user'
// import { modules } from '../modules'

import { featureVersion } from '../modules'

const handler: Omit<LX.Sync.ClientSyncHandlerActions<LX.Sync.Client.Socket>, 'finished'> = {
  async getEnabledFeatures(socket, serverType, supportedFeatures) {
  // const userSpace = getUserSpace(socket.userInfo.name)
    const features: LX.Sync.EnabledFeatures = {}
    switch (serverType) {
      case 'server':
        if (featureVersion.list == supportedFeatures.list) {
          features.list = { skipSnapshot: false }
        }
        if (featureVersion.dislike == supportedFeatures.dislike) {
          features.dislike = { skipSnapshot: false }
        }
        return features
      case 'desktop-app':
      default:
        if (featureVersion.list == supportedFeatures.list) {
          features.list = { skipSnapshot: false }
        }
        if (featureVersion.dislike == supportedFeatures.dislike) {
          features.dislike = { skipSnapshot: false }
        }
        return features
    }
  },
}

export default handler
