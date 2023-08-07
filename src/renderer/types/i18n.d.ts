import { type I18n } from '@root/lang'

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: I18n['t']
  }
}
