declare namespace LX {
  namespace SoundEffect {
    interface EQPreset {
      id: string
      name: string
      hz31: number
      hz62: number
      hz125: number
      hz250: number
      hz500: number
      hz1000: number
      hz2000: number
      hz4000: number
      hz8000: number
      hz16000: number
    }
    interface ConvolutionPreset {
      id: string
      name: string
      source: string
      mainGain: number
      sendGain: number
    }
    // interface PitchShifterPreset {
    //   id: string
    //   name: string
    //   playbackRate: number
    // }
  }
}
