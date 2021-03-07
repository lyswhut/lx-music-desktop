<template lang="pug">
material-modal(:show="show" :bg-close="bgClose" @close="handleClose")
  main(:class="$style.main")
    h2
      | {{$t('material.list_add_modal.' + (isMove ? 'title_first_move' : 'title_first_add'))}}&nbsp;
      span(:class="$style.name") {{this.musicInfo && `${musicInfo.name}`}}
      | &nbsp;{{$t('material.list_add_modal.title_last')}}
    div.scroll(:class="$style.btnContent")
      material-btn(:class="$style.btn" :tips="$t('material.list_add_modal.btn_title', { name: item.name })" :key="item.id" :disabled="item.isExist" @click="handleClick(index)" v-for="(item, index) in lists") {{item.name}}
      material-btn(:class="[$style.btn, $style.newList, isEditing ? $style.editing : null]" @click="handleEditing($event)" :tips="$t('view.list.lists_new_list_btn')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 42 42' space='preserve')
          use(xlink:href='#icon-addTo')
        input.key-bind(:class="$style.newListInput" :value="newListName" type="text" :placeholder="$t('view.list.lists_new_list_input')" @keyup.enter="handleSaveList($event)" @blur="handleSaveList($event)")
      span(:class="$style.btn" v-for="i in spaceNum")
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    musicInfo: {
      type: Object,
    },
    bgClose: {
      type: Boolean,
      default: true,
    },
    excludeListId: {
      type: Array,
      default() {
        return []
      },
    },
    listName: {
      type: String,
      default: '',
    },
    fromListId: {
      type: String,
      default: null,
    },
    isMove: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isEditing: false,
      newListName: '',
    }
  },
  computed: {
    ...mapGetters('list', ['defaultList', 'loveList', 'userList']),
    lists() {
      if (!this.musicInfo) return []
      return [
        this.defaultList,
        this.loveList,
        ...this.userList,
      ].filter(l => !this.excludeListId.includes(l.id)).map(l => ({ ...l, isExist: l.list.some(s => s.songmid == this.musicInfo.songmid) }))
    },
    spaceNum() {
      return this.lists.length < 2 ? 0 : (3 - this.lists.length % 3 - 1)
    },
  },
  methods: {
    ...mapMutations('list', ['listAdd', 'listMove', 'createUserList']),
    handleClick(index) {
      this.isMove
        ? this.listMove({ fromId: this.fromListId, toId: this.lists[index].id, musicInfo: this.musicInfo })
        : this.listAdd({ id: this.lists[index].id, musicInfo: this.musicInfo })
      this.$nextTick(() => {
        this.handleClose()
      })
    },
    handleClose() {
      this.$emit('close')
    },
    handleEditing(event) {
      if (this.isEditing) return
      if (!this.newListName) this.newListName = this.listName
      this.isEditing = true
      this.$nextTick(() => event.currentTarget.querySelector('.' + this.$style.newListInput).focus())
    },
    handleSaveList(event) {
      let name = event.target.value
      this.newListName = event.target.value = ''
      this.isEditing = false
      if (!name) return
      this.createUserList({ name })
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.main {
  // padding: 15px 0;
  max-width: 530px;
  min-width: 200px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  h2 {
    font-size: 13px;
    color: @color-theme_2-font;
    line-height: 1.3;
    text-align: center;
    padding: 15px;
  }
}

.name {
  color: @color-theme;
}

.btn-content {
  flex: auto;
  max-height: 100%;
  padding-right: 15px;
  display: flex;
  flex-flow: row wrap;
  justify-content: space-evenly;
}

.btn {
  box-sizing: border-box;
  margin-left: 15px;
  margin-bottom: 15px;
  height: 36px;
  line-height: 36px;
  padding: 0 10px !important;
  width: 150px;
  .mixin-ellipsis-1;
}

.newList {
  border: 1px dashed @color-theme-hover;
  background-color: @color-theme_2-background_2;
  color: @color-theme-hover;
  opacity: .7;

  svg {
    height: 18px;
    margin-top: 9px;
  }

  &.editing {
    opacity: 1;

    svg {
      display: none;
    }
    .newListInput {
      display: block;
    }
  }
}
.newListInput {
  width: 100%;
  height: 34px;
  border: none;
  padding: 0;
  line-height: 34px;
  background: none;
  outline: none;
  font-size: 14px;
  text-align: center;
  font-family: inherit;
  display: none;
}

each(@themes, {
  :global(#container.@{value}) {
    .main {
      h2 {
        color: ~'@{color-@{value}-theme_2-font}';
      }
    }
    .name {
      color: ~'@{color-@{value}-theme}';
    }
    .newList {
      border-color: ~'@{color-@{value}-theme-hover}';
      color: ~'@{color-@{value}-theme-hover}';
      background-color: ~'@{color-@{value}-theme_2-background_2}';
    }
  }
})

</style>
