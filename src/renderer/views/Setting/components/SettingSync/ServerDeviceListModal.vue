<template lang="pug">
material-modal(:show="modelValue" bg-close teleport="#view" @close="$emit('update:modelValue', false)")
  main(:class="$style.main")
    h2 {{ $t('setting__sync_server_device_list_title') }}
    ul.scroll(v-if="historyDeviceList.length" :class="$style.content")
      li(v-for="(device, index) in historyDeviceList" :key="device.id" :class="$style.listItem")
        div(:class="$style.listLeft")
          span(:class="$style.name")
            svg-icon(v-if="device.isMobile" name="phone" style="margin-right: 0.2rem; vertical-align: -0.2em;")
            | {{ device.name }}
          span(:class="$style.desc") {{ $t('setting__sync_server_device_list_time', { time: device.lastConnectDate }) }}
        base-btn(:class="$style.listBtn" outline :aria-label="$t('setting__sync_server_device_list_btn_remove')" @click.stop="handleRemove(index)")
          svg(v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 212.982 212.982" space="preserve")
            use(xlink:href="#icon-delete")
    div(v-else :class="$style.content")
      div(:class="$style.noitem") {{ $t('setting__sync_server_device_list_noitem') }}
  div(:class="$style.footer")
    div(:class="$style.tips") {{ $t('setting__sync_server_device_list_tips') }}
</template>

<script>
import { watch, ref } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { getSyncServerDevices, removeSyncServerDevice } from '@renderer/utils/ipc'
import { dateFormat } from '@common/utils/common'

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props) {
    const historyDeviceList = ref([])

    const getList = () => {
      void getSyncServerDevices().then((list) => {
        historyDeviceList.value = list.map(d => {
          return {
            id: d.clientId,
            name: d.deviceName,
            lastConnectDate: d.lastConnectDate ? dateFormat(d.lastConnectDate) : '-',
            isMobile: d.isMobile,
          }
        })
      })
    }

    watch(() => sync.server.status.devices.length, () => {
      if (!props.modelValue) return
      getList()
    })
    watch(() => props.modelValue, (val) => {
      if (!val) return
      getList()
    })

    const handleRemove = (index) => {
      void removeSyncServerDevice(historyDeviceList.value[index].id).then(getList)
    }

    return {
      historyDeviceList,
      handleRemove,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  // padding: 15px;
  // max-width: 400px;
  min-width: 460px;
  min-height: 200px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  // min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  h2 {
    margin: 15px;
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
  }
}

.name {
  color: var(--color-font);
  font-size: 14px;
  word-break: break-all;
  line-height: 1.2;
}

.desc {
  color: var(--color-font-label);
  margin-top: 8px;
  font-size: 12px;
  word-break: break-all;
}

.content {
  flex: auto;
  min-height: 100px;
  max-height: 100%;
}
.listItem {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  transition: background-color 0.2s ease;
  padding: 10px;
  // border-radius: @radius-border;
  &:hover {
    background-color: var(--color-primary-background-hover);
  }
}
.noitem {
  height: 100px;
  font-size: 18px;
  color: var(--color-font-label);
  display: flex;
  justify-content: center;
  align-items: center;
}
.listLeft {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
}
.listBtn {
  flex: none;
  height: 30px;
  width: 30px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 60%;
  }
}

// .footer {
//   width: @width;
// }
.tips {
  padding: 8px 15px;
  font-size: 13px;
  line-height: 1.25;
  color: var(--color-font);
}

</style>
