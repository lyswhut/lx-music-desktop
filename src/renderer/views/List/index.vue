<template>
  <div id="my-list" :class="$style.container" @click="handleContainerClick">
    <h1 :class="$style.title"><img :class="$style.avatar" src="https://q1.qlogo.cn/g?b=qq&nk=619113277&s=640" alt="avatar"> 14K的音乐库</h1>
    <Favorite list-id="love" />
    <div :class="$style.lists">
      <div :class="$style.listsTitle">
        <span>我的歌单</span>
        <button
        :class="$style.tabButton"
        @click="visibleOpenNewListModal = true"
        ><base-svg-icon :class="$style.plus" icon-class="plus2" /> {{ $t('list__new_list_btn') }}
      </button>
      </div>
      <MyList />
    </div>

    <open-new-list-modal
      v-model="visibleOpenNewListModal"
      @update:model-submit="createList"
    />
  </div>
</template>

<script>
import Favorite from './Favorite/index.vue'
import MyList from './List/index.vue'
import OpenNewListModal from './components/OpenNewListModal.vue'
import { ref } from 'vue'
import { createUserList } from '@renderer/store/list/action'

export default {
  name: 'List',
  components: {
    Favorite,
    OpenNewListModal,
    MyList,
  },
  setup() {
    const visibleOpenNewListModal = ref(false)
    const createList = async(name) => {
      await createUserList({ name })
      visibleOpenNewListModal.value = false
    }
    return {
      visibleOpenNewListModal,
      createList,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.tab-button {
  color: var(--color-text);
  border-radius: 8px;
  padding: 0 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.2s;
  opacity: 0.68;
  font-weight: 500;
  outline: none;
  border: none;
  cursor: pointer;
  background: none;
  height: 40px;
  .plus{
    width: 14px;
    height: 14px;
    margin-right: 8px;
  }
  &:hover {
    opacity: 1;
    background: var(--color-primary-alpha-900);
  }
  &:active {
    opacity: 1;
    transform: scale(0.92);
  }
}

.container {
  overflow: hidden;
  height: 100%;
  position: relative;
  padding-top: 24px;
}
.lists{
  padding-top: 24px;
  .listsTitle{
    font-size: 24px;
    font-weight: 600;
    padding: 24px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.title{
  font-size: 42px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  font-weight: 600;
  .avatar {
    height: 44px;
    margin-right: 12px;
    vertical-align: -7px;
    border-radius: 50%;
    border: rgba(0, 0, 0, 0.2);
  }
}
</style>
