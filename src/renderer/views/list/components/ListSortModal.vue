<template>
<material-modal :show="visible" @close="closeModal" teleport="#view" bg-close @after-leave="handleAfterLeave">
  <main :class="$style.main">
    <div :class="$style.header">
      <h2>{{listInfo.name}}</h2>
    </div>
    <section>
      <h3 :class="$style.title">{{$t('list_sort_modal_by_field')}}</h3>
      <ul :class="$style.list">
        <li :class="$style.listItem">
          <base-checkbox id="list_sort_modal_field_name" name="list_sort_modal_field" need="need"
            v-model="sortField" value="name" :label="$t('list_sort_modal_by_name')" />
        </li>
        <li :class="$style.listItem">
          <base-checkbox id="list_sort_modal_field_singer" name="list_sort_modal_field" need="need"
            v-model="sortField" value="singer" :label="$t('list_sort_modal_by_singer')" />
        </li>
        <li :class="$style.listItem">
          <base-checkbox id="list_sort_modal_field_album" name="list_sort_modal_field" need="need"
            v-model="sortField" value="album" :label="$t('list_sort_modal_by_album')" />
        </li>
        <li :class="$style.listItem">
          <base-checkbox id="list_sort_modal_field_time" name="list_sort_modal_field" need="need"
            v-model="sortField" value="time" :label="$t('list_sort_modal_by_time')" />
        </li>
        <li :class="$style.listItem">
          <base-checkbox id="list_sort_modal_field_source" name="list_sort_modal_field" need="need"
            v-model="sortField" value="source" :label="$t('list_sort_modal_by_source')" />
        </li>
      </ul>
    </section>
    <section>
      <h3 :class="$style.title">{{$t('list_sort_modal_by_type')}}</h3>
      <ul :class="$style.list">
        <li :class="$style.listItem">
          <base-checkbox id="list_sort_modal_type_up" name="list_sort_modal_type" need="need"
            v-model="sortType" value="up" :label="$t('list_sort_modal_by_up')" />
        </li>
        <li :class="$style.listItem">
          <base-checkbox id="list_sort_modal_type_down" name="list_sort_modal_type" need="need"
            v-model="sortType" value="down" :label="$t('list_sort_modal_by_down')" />
        </li>
      </ul>
    </section>
    <div :class="$style.footer">
      <base-btn :class="$style.btn" @click="closeModal">{{$t('music_sort__btn_cancel')}}</base-btn>
      <base-btn :class="$style.btn" @click="handleSort">{{$t('music_sort__btn_confirm')}}</base-btn>
    </div>
  </main>
</material-modal>
</template>

<script>
import { ref, useCommit } from '@renderer/utils/vueTools'
// import { dialog } from '@renderer/plugins/Dialog'
import { getList } from '@renderer/core/share/utils'

const getIntv = (musicInfo) => {
  if (!musicInfo.interval) return 0
  if (musicInfo._interval) return musicInfo._interval
  let intvArr = musicInfo.interval.split(':')
  let intv = 0
  let unit = 1
  while (intvArr.length) {
    intv += (intvArr.pop()) * unit
    unit *= 60
  }
  return parseInt(intv)
}
export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    listInfo: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    // const { t } = useI18n()
    const sortField = ref(null)
    const sortType = ref(null)
    const setList = useCommit('list', 'setList')
    const closeModal = () => {
      emit('update:visible', false)
    }
    const handleAfterLeave = () => {
      sortField.value = null
      sortType.value = null
    }
    const verify = () => {
      return !!sortField.value && !!sortType.value
    }
    const handleSort = async() => {
      if (!verify()) return
      // if (!await dialog.confirm({
      //   message: t('list_sort_modal_tip_confirm'),
      //   cancelButtonText: t('cancel_button_text'),
      //   confirmButtonText: t('confirm_button_text'),
      // })) return

      const list = [...getList(props.listInfo.id)]
      let fieldName
      switch (sortField.value) {
        case 'name':
          fieldName = 'name'
          break
        case 'singer':
          fieldName = 'singer'
          break
        case 'album':
          fieldName = 'albumName'
          break
        case 'time':
          fieldName = 'interval'
          break
        case 'source':
          fieldName = 'source'
          break
      }
      console.log(sortType.value, sortField.value)
      if (sortType.value == 'up') {
        if (fieldName == 'interval') {
          list.sort((a, b) => {
            if (a.interval == null) {
              return b.interval == null ? 0 : -1
            } else return b.interval == null ? 1 : getIntv(a) - getIntv(b)
          })
        } else {
          list.sort((a, b) => {
            if (a[fieldName] == null) {
              return b[fieldName] == null ? 0 : -1
            } else return b[fieldName] == null ? 1 : a[fieldName].localeCompare(b[fieldName])
          })
        }
      } else {
        if (fieldName == 'interval') {
          list.sort((a, b) => {
            if (a.interval == null) {
              return b.interval == null ? 0 : 1
            } else return b.interval == null ? -1 : getIntv(b) - getIntv(a)
          })
        } else {
          list.sort((a, b) => {
            if (a[fieldName] == null) {
              return b[fieldName] == null ? 0 : 1
            } else return b[fieldName] == null ? -1 : b[fieldName].localeCompare(a[fieldName])
          })
        }
      }
      closeModal()
      setList({ ...props.listInfo, list })
    }
    return {
      sortField,
      sortType,
      closeModal,
      handleSort,
      handleAfterLeave,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.header {
  flex: none;
  padding: 15px;
  text-align: center;
  h2 {
    color: @color-theme_2-font;
    word-break: break-all;
  }
}

.main {
  padding: 0 15px;
  width: 320px;
  display: flex;
  flex-flow: column nowrap;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
}
.title {
  font-size: 14px;
  color: @color-theme_2-font-label;
  padding: 10px 0 8px;
}
.list {
  display: flex;
  flex-flow: row wrap;
  font-size: 14px;
}
.listItem {
  width: (100% / 3);
  padding-left: 10px;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.footer {
  margin: 20px 0 15px auto;
}
.btn {
  // box-sizing: border-box;
  // margin-left: 15px;
  // margin-bottom: 15px;
  // height: 36px;
  // line-height: 36px;
  // padding: 0 10px !important;
  min-width: 70px;
  // .mixin-ellipsis-1;

  +.btn {
    margin-left: 10px;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .header {
      h2 {
        color: ~'@{color-@{value}-theme_2-font}';
      }
    }
    .title {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }
  }
})

</style>
