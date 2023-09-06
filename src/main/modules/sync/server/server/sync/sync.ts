import { FeaturesList } from '../../../../../../common/constants_sync'
import { featureVersion, modules } from '../../modules'


export const sync = async(socket: LX.Sync.Server.Socket) => {
  let disconnected = false
  socket.onClose(() => {
    disconnected = true
  })
  const enabledFeatures = await socket.remote.getEnabledFeatures('desktop-app', featureVersion)

  if (disconnected) throw new Error('disconnected')
  for (const moduleName of FeaturesList) {
    if (enabledFeatures[moduleName]) {
      socket.feature[moduleName] = enabledFeatures[moduleName]
      await modules[moduleName].sync(socket).catch(_ => _)
    }
    if (disconnected) throw new Error('disconnected')
  }
  await socket.remote.finished()
}
