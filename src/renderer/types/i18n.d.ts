import { I18n } from '@/lang'

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: I18n['t']
  }
}
