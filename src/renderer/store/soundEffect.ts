import { reactive, toRaw } from '@common/utils/vueTools'
import {
  getUserSoundEffectConvolutionPresetList,
  getUserSoundEffectEQPresetList,
  // getUserSoundEffectPitchShifterPresetList,
  saveUserSoundEffectConvolutionPresetList,
  saveUserSoundEffectEQPresetList,
  // saveUserSoundEffectPitchShifterPresetList,
} from '@renderer/utils/ipc'

let userEqPresetList: LX.SoundEffect.EQPreset[] | null = null

export const getUserEQPresetList = async() => {
  if (userEqPresetList == null) {
    // eslint-disable-next-line require-atomic-updates
    userEqPresetList = reactive(await getUserSoundEffectEQPresetList())
  }
  return userEqPresetList
}
export const saveUserEQPreset = async(preset: LX.SoundEffect.EQPreset) => {
  if (userEqPresetList == null) {
    // eslint-disable-next-line require-atomic-updates
    userEqPresetList = reactive(await getUserSoundEffectEQPresetList())
  }
  const target = userEqPresetList.find(p => p.id == preset.id)
  if (target) Object.assign(target, preset)
  else userEqPresetList.push(preset)
  saveUserSoundEffectEQPresetList(toRaw(userEqPresetList))
}
export const removeUserEQPreset = async(id: string) => {
  if (userEqPresetList == null) {
    // eslint-disable-next-line require-atomic-updates
    userEqPresetList = reactive(await getUserSoundEffectEQPresetList())
  }
  const index = userEqPresetList.findIndex(p => p.id == id)
  if (index < 0) return
  userEqPresetList.splice(index, 1)
  saveUserSoundEffectEQPresetList(toRaw(userEqPresetList))
}


let userConvolutionPresetList: LX.SoundEffect.ConvolutionPreset[] | null = null
export const getUserConvolutionPresetList = async() => {
  if (userConvolutionPresetList == null) {
    // eslint-disable-next-line require-atomic-updates
    userConvolutionPresetList = reactive(await getUserSoundEffectConvolutionPresetList())
  }
  return userConvolutionPresetList
}
export const saveUserConvolutionPreset = async(preset: LX.SoundEffect.ConvolutionPreset) => {
  if (userConvolutionPresetList == null) {
    // eslint-disable-next-line require-atomic-updates
    userConvolutionPresetList = reactive(await getUserSoundEffectConvolutionPresetList())
  }
  const target = userConvolutionPresetList.find(p => p.id == preset.id)
  if (target) Object.assign(target, preset)
  else userConvolutionPresetList.push(preset)
  saveUserSoundEffectConvolutionPresetList(toRaw(userConvolutionPresetList))
}
export const removeUserConvolutionPreset = async(id: string) => {
  if (userConvolutionPresetList == null) {
    // eslint-disable-next-line require-atomic-updates
    userConvolutionPresetList = reactive(await getUserSoundEffectConvolutionPresetList())
  }
  const index = userConvolutionPresetList.findIndex(p => p.id == id)
  if (index < 0) return
  userConvolutionPresetList.splice(index, 1)
  saveUserSoundEffectConvolutionPresetList(toRaw(userConvolutionPresetList))
}


// let userPitchShifterPresetList: LX.SoundEffect.PitchShifterPreset[] | null = null
// export const getUserPitchShifterPresetList = async() => {
//   if (userEqPresetList == null) {
//     userPitchShifterPresetList = reactive(await getUserSoundEffectPitchShifterPresetList())
//   }
//   return userPitchShifterPresetList
// }
// export const saveUserPitchShifterPreset = async(preset: LX.SoundEffect.PitchShifterPreset) => {
//   if (userPitchShifterPresetList == null) {
//     userPitchShifterPresetList = reactive(await getUserSoundEffectPitchShifterPresetList())
//   }
//   const target = userPitchShifterPresetList.find(p => p.id == preset.id)
//   if (target) Object.assign(target, preset)
//   else userPitchShifterPresetList.push(preset)
//   saveUserSoundEffectPitchShifterPresetList(toRaw(userPitchShifterPresetList))
// }
// export const removeUserPitchShifterPreset = async(id: string) => {
//   if (userPitchShifterPresetList == null) {
//     userPitchShifterPresetList = reactive(await getUserSoundEffectPitchShifterPresetList())
//   }
//   const index = userPitchShifterPresetList.findIndex(p => p.id == id)
//   if (index < 0) return
//   userPitchShifterPresetList.splice(index, 1)
//   saveUserSoundEffectPitchShifterPresetList(toRaw(userPitchShifterPresetList))
// }
