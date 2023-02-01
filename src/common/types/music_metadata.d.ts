import {
  type IAudioMetadata as iAudioMetadata,
} from 'music-metadata'

declare global {
  namespace LX {
    namespace MusicMetadataModule {
      type IAudioMetadata = iAudioMetadata
    }
  }
}
