import {
  type IAudioMetadata as iAudioMetadata,
} from 'music-metadata/node'

declare global {
  namespace LX {
    namespace MusicMetadataModule {
      type IAudioMetadata = iAudioMetadata
    }
  }
}
