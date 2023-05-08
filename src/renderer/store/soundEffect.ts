import { reactive, toRaw } from '@common/utils/vueTools'
import { getUserSoundEffectConvolutionPresetList, getUserSoundEffectEQPresetList, saveUserSoundEffectConvolutionPresetList, saveUserSoundEffectEQPresetList } from '@renderer/utils/ipc'

let userEqPresetList: LX.SoundEffect.EQPreset[] | null = null

export const getUserEQPresetList = async() => {
  if (userEqPresetList == null) {
    userEqPresetList = reactive(await getUserSoundEffectEQPresetList())
  }
  return userEqPresetList
}
export const saveUserEQPreset = async(preset: LX.SoundEffect.EQPreset) => {
  if (userEqPresetList == null) {
    userEqPresetList = reactive(await getUserSoundEffectEQPresetList())
  }
  const target = userEqPresetList.find(p => p.id == preset.id)
  if (target) Object.assign(target, preset)
  else userEqPresetList.push(preset)
  saveUserSoundEffectEQPresetList(toRaw(userEqPresetList))
}
export const removeUserEQPreset = async(id: string) => {
  if (userEqPresetList == null) {
    userEqPresetList = reactive(await getUserSoundEffectEQPresetList())
  }
  const index = userEqPresetList.findIndex(p => p.id == id)
  if (index < 0) return
  userEqPresetList.splice(index, 1)
  saveUserSoundEffectEQPresetList(toRaw(userEqPresetList))
}


let userConvolutionPresetList: LX.SoundEffect.ConvolutionPreset[] | null = null
export const getUserConvolutionPresetList = async() => {
  if (userEqPresetList == null) {
    userConvolutionPresetList = reactive(await getUserSoundEffectConvolutionPresetList())
  }
  return userConvolutionPresetList
}
export const saveUserConvolutionPreset = async(preset: LX.SoundEffect.ConvolutionPreset) => {
  if (userConvolutionPresetList == null) {
    userConvolutionPresetList = reactive(await getUserSoundEffectConvolutionPresetList())
  }
  const target = userConvolutionPresetList.find(p => p.id == preset.id)
  if (target) Object.assign(target, preset)
  else userConvolutionPresetList.push(preset)
  saveUserSoundEffectConvolutionPresetList(toRaw(userConvolutionPresetList))
}
export const removeUserConvolutionPreset = async(id: string) => {
  if (userConvolutionPresetList == null) {
    userConvolutionPresetList = reactive(await getUserSoundEffectConvolutionPresetList())
  }
  const index = userConvolutionPresetList.findIndex(p => p.id == id)
  if (index < 0) return
  userConvolutionPresetList.splice(index, 1)
  saveUserSoundEffectConvolutionPresetList(toRaw(userConvolutionPresetList))
}
