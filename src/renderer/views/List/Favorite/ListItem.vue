<template>
    <div :class="$style.song">
      <div :class="$style.cover">
        <img :src="cover" alt="cover" />
      </div>
      <div :class="$style.info">
        <div :class="$style.name">{{ name }}</div>
        <div :class="$style.singer">{{ singer }}</div>
      </div>
    </div>
</template>

<script setup lang="ts">
defineProps({
  cover: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  singer: {
    type: String,
    required: true,
  },
})
</script>

  <style lang="less" module>
  @import '@renderer/assets/styles/layout.less';
    .song{
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 10px;
        height: 36px;
        user-select: none;
        .cover{
            height: 100%;
            img{
                border-radius: 6px;
                height: 36px;
                width: 36px;
                margin-right: 12px;
            }
            img.hover {
                filter: drop-shadow(100 200 0 black);
            }

        }

        &:hover{
                background-color: var(--color-050);
            }

        .info{
            .name{
                font-size: 16px;
                font-weight: 600;
                color: var(--color-text);
                cursor: default;
                padding-right: 16px;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 1;
                overflow: hidden;
                word-break: break-all;
            }
            .singer{
                margin-top: 2px;
                font-size: 12px;
                opacity: 0.68;
                color: var(--color-text);
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 1;
                overflow: hidden;
            }
        }
    }
  </style>
