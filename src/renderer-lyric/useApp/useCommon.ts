import { watch } from '@common/utils/vueTools'
import { setting } from '@lyric/store/state'

export default () => {
  watch(() => setting['common.langId'], (id) => {
    if (!id) return
    window.i18n.setLanguage(id)
    window.setLang(id)
  })
}
