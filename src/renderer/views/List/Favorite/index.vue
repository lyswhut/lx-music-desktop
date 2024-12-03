<!--
 * @Description: 我的最爱
 * @Author: 14K
 * @Date: 2024-12-03 15:39:40
 * @LastEditTime: 2024-12-03 20:37:54
 * @LastEditors: 14K
-->
<template>
    <div :class="$style.favorite">
        <div :class="$style.favoriteCount">
            <div :class="$style.randomLyric">
                <div>
                  <p>眼神有话要说</p>
                  <p>是不是你想要认识我</p>
                  <p>偷偷地看看你 要让我等多久</p>
                </div>
            </div>
            <div :class="$style.bottom">
                <div :class="$style.titles">
                    <div :class="$style.title">我最爱的音乐</div>
                    <div :class="$style.sub_title">666 首歌</div>
                </div>
                <button :class="$style.play">
                    <base-svg-icon :class="$style.svg" icon-class="play" />
                </button>
            </div>
        </div>

        <div :class="$style.favoriteList">
            <List :list-id="listId" />
        </div>
    </div>
</template>

<script setup lang="ts">
import List from './List.vue'

defineProps({
  listId: {
    type: String,
    required: true,
  },
})
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.favorite{
    display: flex;
    margin-top: 24px;
}
.favoriteCount {
  flex: 3;
  margin-top: 8px;
  cursor: pointer;
  border-radius: 16px;
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.4s;
  box-sizing: border-box;

  background: var(--color-primary-alpha-900);

  .bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-primary);

    .title {
      font-size: 24px;
      font-weight: 700;
    }
    .sub_title {
      font-size: 15px;
      margin-top: 2px;
    }

    button {
      margin-bottom: 2px;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 44px;
      width: 44px;
      background: var(--color-primary);
      border-radius: 50%;
      transition: 0.2s;
      box-shadow: 0 6px 12px -4px rgba(0, 0, 0, 0.2);
      cursor: default;

      .svg-icon {
        color: var(--color-primary-bg);
        margin-left: 4px;
        height: 16px;
        width: 16px;
      }
      &:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 12px -4px rgba(0, 0, 0, 0.4);
      }
      &:active {
        transform: scale(0.94);
      }
    }
  }

  .randomLyric {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    font-size: 14px;
    opacity: 0.88;
    color: var(--color-primary);
    p {
      margin-top: 2px;
    }
  }
}
.favoriteList{
    flex: 7;
    margin-top: 8px;
    margin-left: 36px;
    overflow: hidden;
}
.play {
      margin-bottom: 2px;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 44px;
      width: 44px;
      background: var(--color-primary);
      border-radius: 50%;
      transition: 0.2s;
      box-shadow: 0 6px 12px -4px rgba(0, 0, 0, 0.2);
      cursor: default;
    outline: none;
    border: none;
      .svg {
        color: var(--color-main-background);
        margin-left: 4px;
        height: 16px;
        width: 16px;
      }
      &:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 12px -4px rgba(0, 0, 0, 0.4);
      }
      &:active {
        transform: scale(0.94);
      }
    }
</style>
