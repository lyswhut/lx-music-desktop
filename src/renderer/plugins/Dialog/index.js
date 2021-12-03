import Dialog from './Dialog'
import i18n from '../i18n'
import store from '@renderer/store'
import { createApp } from 'vue'


const defaultOptions = {
  message: '',
  showCancel: false,
  cancelButtonText: '',
  confirmButtonText: '',
}

const dialog = {
  install(Vue, options) {
    const dialog = function(options) {
      const { message, showCancel, cancelButtonText, confirmButtonText } =
        Object.assign({}, defaultOptions, typeof options == 'string' ? { message: options } : options || {})
      return new Promise((resolve, reject) => {
        let app = createApp(Dialog, {
          afterLeave() {
            app?.unmount()
            app = null
          },
        }).use(i18n).use(store)

        let instance = app.mount(document.createElement('div'))

        // 属性设置
        instance.visible = true
        instance.message = message
        instance.showCancel = showCancel
        instance.cancelButtonText = cancelButtonText
        instance.confirmButtonText = confirmButtonText

        // 挂载
        document.getElementById('container').appendChild(instance.$el)

        instance.handleCancel = () => {
          instance.visible = false
          resolve(false)
        }

        instance.handleComfirm = () => {
          instance.visible = false
          resolve(true)
        }
      })
    }
    dialog.confirm = options => dialog(
      typeof options == 'string'
        ? { message: options, showCancel: true }
        : { ...options, showCancel: true },
    )

    Vue.config.globalProperties.$dialog = dialog
  },
}

export default dialog
