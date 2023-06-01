import { STORE_NAMES } from '@common/constants'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainOn, mainHandle } from '@common/mainIpc'
import getStore from '@main/utils/store'

export default () => {
  mainHandle<LX.SoundEffect.EQPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.get_sound_effect_eq_preset, async() => {
    return getStore(STORE_NAMES.SOUND_EFFECT).get('eqPreset') as LX.SoundEffect.EQPreset[] | null ?? []
  })
  mainOn<LX.SoundEffect.EQPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.save_sound_effect_eq_preset, ({ params }) => {
    getStore(STORE_NAMES.SOUND_EFFECT).set('eqPreset', params)
  })

  mainHandle<LX.SoundEffect.ConvolutionPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.get_sound_effect_convolution_preset, async() => {
    return getStore(STORE_NAMES.SOUND_EFFECT).get('convolutionPreset') as LX.SoundEffect.ConvolutionPreset[] | null ?? []
  })
  mainOn<LX.SoundEffect.ConvolutionPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.save_sound_effect_convolution_preset, ({ params }) => {
    getStore(STORE_NAMES.SOUND_EFFECT).set('convolutionPreset', params)
  })

  // mainHandle<LX.SoundEffect.PitchShifterPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.get_sound_effect_pitch_shifter_preset, async() => {
  //   return getStore(STORE_NAMES.SOUND_EFFECT).get('pitchShifterPreset') as LX.SoundEffect.PitchShifterPreset[] | null ?? []
  // })
  // mainOn<LX.SoundEffect.PitchShifterPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.save_sound_effect_pitch_shifter_preset, ({ params }) => {
  //   getStore(STORE_NAMES.SOUND_EFFECT).set('pitchShifterPreset', params)
  // })
}
