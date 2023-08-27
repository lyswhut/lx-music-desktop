<template>
  <material-modal :show="visible" teleport="#view" bg-close @close="closeModal" @after-leave="handleAfterLeave">
    <main :class="$style.main">
      <div :class="$style.header">
        <h2>{{ listName }}</h2>
      </div>
      <section>
        <h3 :class="$style.title">{{ $t('list_sort_modal_by_field') }}</h3>
        <ul :class="$style.list">
          <li :class="$style.listItem">
            <base-checkbox
              id="list_sort_modal_field_name" v-model="sortField" name="list_sort_modal_field" :aria-label="$t('list_sort_modal_by_name')"
              need="need" value="name" :disabled="disabledSortFislds" :label="$t('list_sort_modal_by_name')"
            />
          </li>
          <li :class="$style.listItem">
            <base-checkbox
              id="list_sort_modal_field_singer" v-model="sortField" name="list_sort_modal_field"
              need="need" value="singer" :disabled="disabledSortFislds" :label="$t('list_sort_modal_by_singer')"
            />
          </li>
          <li :class="$style.listItem">
            <base-checkbox
              id="list_sort_modal_field_album" v-model="sortField" name="list_sort_modal_field"
              need="need" value="albumName" :disabled="disabledSortFislds" :label="$t('list_sort_modal_by_album')"
            />
          </li>
          <li :class="$style.listItem">
            <base-checkbox
              id="list_sort_modal_field_time" v-model="sortField" name="list_sort_modal_field"
              need="need" value="interval" :disabled="disabledSortFislds" :label="$t('list_sort_modal_by_time')"
            />
          </li>
          <li :class="$style.listItem">
            <base-checkbox
              id="list_sort_modal_field_source" v-model="sortField" name="list_sort_modal_field"
              need="need" value="source" :disabled="disabledSortFislds" :label="$t('list_sort_modal_by_source')"
            />
          </li>
        </ul>
      </section>
      <section>
        <h3 :class="$style.title">{{ $t('list_sort_modal_by_type') }}</h3>
        <ul :class="$style.list">
          <li :class="$style.listItem">
            <base-checkbox
              id="list_sort_modal_type_up" v-model="sortType" name="list_sort_modal_type"
              need="need" value="up" :label="$t('list_sort_modal_by_up')"
            />
          </li>
          <li :class="$style.listItem">
            <base-checkbox
              id="list_sort_modal_type_down" v-model="sortType" name="list_sort_modal_type"
              need="need" value="down" :label="$t('list_sort_modal_by_down')"
            />
          </li>
          <li :class="$style.listItem">
            <base-checkbox
              id="list_sort_modal_type_random" v-model="sortType" name="list_sort_modal_type"
              need="need" value="random" :label="$t('list_sort_modal_by_random')"
            />
          </li>
        </ul>
      </section>
      <div :class="$style.footer">
        <base-btn :class="$style.btn" @click="closeModal">{{ $t('btn_cancel') }}</base-btn>
        <base-btn :class="$style.btn" @click="handleSort">{{ $t('btn_confirm') }}</base-btn>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { ref, computed } from '@common/utils/vueTools'
// import { dialog } from '@renderer/plugins/Dialog'
import { getListMusics, updateListMusicsPosition } from '@renderer/store/list/action'
import { useI18n } from '@root/lang'
import { LIST_IDS } from '@common/constants'


export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    listInfo: { // { id: '', name: '' }
      type: Object,
      required: true,
    },
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const t = useI18n()
    const sortField = ref('')
    const sortType = ref('')
    const closeModal = () => {
      emit('update:visible', false)
    }
    const handleAfterLeave = () => {
      sortField.value = ''
      sortType.value = ''
    }
    const verify = () => {
      return !!sortType.value && (!!sortField.value || sortType.value == 'random')
    }
    const handleSort = async() => {
      if (!verify()) return
      // if (!await dialog.confirm({
      //   message: t('list_sort_modal_tip_confirm'),
      //   cancelButtonText: t('cancel_button_text'),
      //   confirmButtonText: t('confirm_button_text'),
      // })) return

      let list = [...(await getListMusics(props.listInfo.id))]
      list = await window.lx.worker.main.sortListMusicInfo(list, sortType.value, sortField.value, window.i18n.locale)
      console.log(sortType.value, sortField.value)

      closeModal()
      void updateListMusicsPosition({ listId: props.listInfo.id, position: 0, ids: list.map(m => m.id) })
    }

    const listName = computed(() => {
      switch (props.listInfo.id) {
        case LIST_IDS.DEFAULT:
          return t(props.listInfo.name)
        case LIST_IDS.LOVE:
          return t(props.listInfo.name)
        default:
          return props.listInfo.name
      }
    })

    const disabledSortFislds = computed(() => {
      return sortType.value == 'random'
    })

    return {
      sortField,
      sortType,
      disabledSortFislds,
      closeModal,
      handleSort,
      handleAfterLeave,
      listName,
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
    color: var(--color-font);
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
  color: var(--color-font-label);
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


</style>
