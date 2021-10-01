<template lang="pug">
Modal(:show="visible" @close="$emit('update:visible', false)" bg-close)
  div(:class="$style.header")
    h2 {{listInfo.name}}
  main.scroll(:class="$style.main")
    ul(ref="dom_list" v-if="duplicateList.length" :class="$style.list")
      li(v-for="(item, index) in duplicateList" :key="item.songmid" :class="$style.listItem")
        div(:class="$style.num") {{item.index + 1}}
        div(:class="$style.text")
          h3(:class="$style.text") {{item.musicInfo.name}} - {{item.musicInfo.singer}}
          h3(v-if="item.musicInfo.albumName" :class="[$style.text, $style.albumName]") {{item.musicInfo.albumName}}
        div(:class="$style.label") {{item.musicInfo.source}}
        div(:class="$style.label") {{item.musicInfo.interval}}
        div(:class="$style.btns")
          button(type="button" @click="handlePlay(index)" :class="$style.btn")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='50%' viewBox='0 0 287.386 287.386' space='preserve' v-once)
              use(xlink:href='#icon-testPlay')
          button(type="button" @click="handleRemove(index)" :class="$style.btn")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='50%' viewBox='0 0 212.982 212.982' space='preserve' v-once)
              use(xlink:href='#icon-delete')
    div(:class="$style.noItem" v-else)
      p(v-text="$t('view.list.no_item')")
</template>

<script>
import { mapMutations } from 'vuex'
import Modal from './Modal'
import Btn from './Btn'

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
  model: {
    prop: 'visible',
    event: 'visible',
  },
  components: {
    Modal,
    Btn,
  },
  watch: {
    visible(n) {
      if (n) this.handleFilterList()
    },
  },
  data() {
    return {
      duplicateList: [],
    }
  },
  mounted() {
    if (this.listInfo.list) this.handleFilterList()
  },
  methods: {
    ...mapMutations('list', [
      'listRemove',
    ]),
    ...mapMutations('player', {
      setPlayList: 'setList',
    }),
    handleFilterList() {
      const listMap = new Map()
      const duplicateList = []
      this.listInfo.list.forEach((musicInfo, index) => {
        if (listMap.has(musicInfo.name)) {
          const targetMusicInfo = listMap.get(musicInfo.name)
          duplicateList.push({
            index: this.listInfo.list.indexOf(targetMusicInfo),
            musicInfo: targetMusicInfo,
          }, {
            index,
            musicInfo,
          })
        } else {
          listMap.set(musicInfo.name, musicInfo)
        }
      })

      this.duplicateList = duplicateList
    },
    handleRemove(index) {
      const { musicInfo: targetMusicInfo } = this.duplicateList.splice(index, 1)[0]
      // let duplicates = []
      // for (let index = 0; index < this.duplicateList.length; index++) {
      //   const { musicInfo } = this.duplicateList[index]
      //   if (musicInfo.name == targetMusicInfo.name) {
      //     duplicates.push(index)
      //     if (duplicates.length > 1) break
      //   }
      // }
      // console.log(duplicates)
      // if (duplicates.length < 2) this.duplicateList.splice(duplicates[0], 1)

      this.listRemove({ listId: this.listInfo.id, id: targetMusicInfo.songmid })

      this.handleFilterList()
    },
    handlePlay(index) {
      const { index: musicInfoIndex } = this.duplicateList[index]
      this.setPlayList({ list: this.listInfo, index: musicInfoIndex })
    },
  },
}
</script>

<style lang="less" module>
@import '../../assets/styles/layout.less';

.header {
  flex: none;
  padding: 15px;
  text-align: center;
}
.main {
  min-height: 200px;
  width: 460px;
}

.list {
  // background-color: @color-search-form-background;
  font-size: 13px;
  transition-property: height;
  position: relative;
  .listItem {
    position: relative;
    padding: 8px 5px;
    transition: background-color .2s ease;
    line-height: 1.3;
    // overflow: hidden;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;

    &:hover {
      background-color: @color-theme_2-hover;
    }
    // border-radius: 4px;
    // &:last-child {
    //   border-bottom-left-radius: 4px;
    //   border-bottom-right-radius: 4px;
    // }
  }
}

.num {
  flex: none;
  font-size: 12px;
  width: 30px;
  text-align: center;
  color: @color-theme_2-font-label;
}

.text {
  flex: auto;
  padding-left: 5px;
  .mixin-ellipsis-1;
}
.albumName {
  font-size: 12px;
  opacity: 0.6;
  .mixin-ellipsis-1;
}
.label {
  flex: none;
  font-size: 12px;
  opacity: 0.5;
  padding: 0 5px;
  display: flex;
  align-items: center;
  // transform: rotate(45deg);
  // background-color:
}
.btns {
  flex: none;
  font-size: 12px;
  padding: 0 5px;
  display: flex;
  align-items: center;
}
.btn {
  background-color: transparent;
  border: none;
  border-radius: @form-radius;
  margin-right: 5px;
  cursor: pointer;
  padding: 4px 7px;
  color: @color-btn;
  outline: none;
  transition: background-color 0.2s ease;
  line-height: 0;
  &:last-child {
    margin-right: 0;
  }

  svg {
    height: 16px;
  }

  &:hover {
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
}

.no-item {
  position: relative;
  height: 200px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 16px;
    color: @color-theme_2-font-label;
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .listItem {
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
    }
    .num {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }
    .btn {
      color: ~'@{color-@{value}-btn}';
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
    }
    .no-item {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})

</style>
