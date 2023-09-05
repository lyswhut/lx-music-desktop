// 这个文件导出的方法将暴露给服务端调用，第一个参数固定为当前 socket 对象

// import { getUserSpace } from '@/user'
// import { modules } from '../modules'

import { featureVersion } from '../modules'


export const getEnabledFeatures = async(socket: LX.Sync.Client.Socket, serverType: LX.Sync.ServerType, supportedFeatures: LX.Sync.SupportedFeatures): Promise<LX.Sync.EnabledFeatures> => {
  // const userSpace = getUserSpace(socket.userInfo.name)
  switch (serverType) {
    case 'server':
      return {
        list: featureVersion.list == supportedFeatures.list,
        dislike: featureVersion.dislike == supportedFeatures.dislike,
      }
    case 'desktop-app':
    default:
      return {
        list: featureVersion.list == supportedFeatures.list,
        dislike: featureVersion.dislike == supportedFeatures.dislike,
      }
  }
}
