<template lang="pug">
div(:class="$style.container")
  ul
    li(v-for="(item, index) in comments" :key="item.id" :class="$style.listItem")
      div(:class="$style.content")
        div(:class="$style.left")
          img( :class="$style.avatar" :src="item.avatar || commentDefImg" @error="handleUserImg")
        div(:class="$style.right")
          div(:class="$style.info")
            div.select(:class="$style.name") {{item.userName}}
            time(:class="$style.time" v-if="item.timeStr") {{timeFormat(item.timeStr)}}
            div(:class="$style.likes" v-if="item.likedCount != null")
              svg(:class="$style.likesIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 512 512' space='preserve')
                use(xlink:href='#icon-thumbs-up')
              | {{item.likedCount}}
          div.select(:class="$style.comment_text")
            p(v-for="text in item.text") {{text}}
      comment-floor(v-if="item.reply && item.reply.length" :class="$style.reply_floor" :comments="item.reply")
</template>

<script>
import commentDefImg from '@renderer/assets/images/defaultUser.jpg'

export default {
  name: 'commentFloor',
  props: {
    comments: {
      type: Array,
      default() {
        return []
      },
    },
  },
  data() {
    return {
      commentDefImg,
    }
  },
  methods: {
    timeFormat(time) {
      return time
      // return formatTime(new Date(time), true)
    },
    handleUserImg(event) {
      event.target.src = this.commentDefImg
    },
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@padding: 15px;

.container {

}

.listItem {
  border-bottom: 1px dashed @color-theme_2-line;
}

.content {
  padding: 12px 0;
  font-size: 13px;
  color: @color-theme_2-font;
  display: flex;
}
.left {
  flex: none;
}
.avatar {
  width: 40px;
  border-radius: 4px;
  box-shadow: 0 0 2px rgba(0, 0, 0, .15);
}
.right {
  flex: auto;
  min-width: 0;
  margin-left: 10px;
}

.info {
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  min-width: 0;
  line-height: 1.3;
  color: @color-theme_2-font-label;
}
.name {
  flex: 0 1 auto;
  min-width: 0;
  .mixin-ellipsis-1;
}
.time {
  flex: none;
  font-size: 11px;
  margin-left: 5px;
}
.likes {
  flex: 1 0 auto;
  margin-left: 10px;
  font-size: 11px;
  align-self: flex-end;
  text-align: right;
}
.likesIcon {
  width: 12px;
  height: 12px;
  margin-right: 3px;
  color: @color-theme-active;
}
.comment_text {
  text-align: justify;
  font-size: 14px;
  padding-top: 5px;
  p {
    line-height: 1.5;
    word-break: break-all;
  }
}

.reply_floor {
  padding: 0 0 0 @padding;
  margin-left: @padding * 2;
  border-radius: .5rem;
  &:last-child {
    margin-bottom: 12px;
  }
  .listItem:last-child {
    border-bottom: none;
  }
  .right {
    margin-right: 10px;
  }

  background-color: @color-reply-floor;
}


each(@themes, {
  :global(#root.@{value}) {
    .listItem {
      border-bottom-color: ~'@{color-@{value}-theme_2-active}';
    }
    .content {
      color: ~'@{color-@{value}-theme_2-font}';
    }
    .info {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }
    .likesIcon {
      color: ~'@{color-@{value}-theme-active}';
    }
    .reply_floor {
      background-color: ~'@{color-@{value}-reply-floor}';
    }
  }
})

</style>
