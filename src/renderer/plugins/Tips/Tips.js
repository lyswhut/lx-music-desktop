import Tips from './Tips.vue'
import Vue from 'vue'

const TipsConstructor = Vue.extend(Tips)
export default ({ position, message } = {}) => {
  if (!position) return
  let instance = new TipsConstructor().$mount(document.createElement('div'))

  // Tips实例挂载到刚创建的div
  // 属性设置
  instance.visible = true
  instance.message = message
  instance.position.top = position.top
  instance.position.left = position.left

  // 将Tips的DOM挂载到body上
  document.body.appendChild(instance.$el)

  instance.cancel = () => {
    instance.visible = false
    instance = null
  }

  instance.setTips = tips => {
    instance.message = tips
  }

  return instance
}

