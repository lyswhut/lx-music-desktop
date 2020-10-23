<template lang="pug">
  div(:class="$style.container")
    ul
      li(v-for="(item, index) in comments" :key="item.id" :class="$style.listItem")
        div(:class="$style.content")
          div(:class="$style.left")
            img( :class="$style.avatar" :src="item.avatar || commentDefImg" @error="handleUserImg")
          div(:class="$style.right")
            div(:class="$style.info")
              div(:class="$style.name") {{item.userName}}
              time(:class="$style.time") {{timeFormat(item.time)}}
              div(:class="$style.likes") {{item.likedCount}}
            div(:class="$style.comment_text")
              p(v-for="text in item.text") {{text}}
        material-comment-floor(v-if="item.reply && item.reply.length" :class="$style.reply_floor" :comments="item.reply")
</template>

<script>
import commentDefImg from '../../assets/images/defaultUser.jpg'

export default {
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
@import '../../assets/styles/layout.less';

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
}
.name {
  flex: auto;
  min-width: 0;
  .mixin-ellipsis-1;
}
.time {
  flex: none;
  color: @color-theme_2-font-label;
  font-size: 11px;
  margin-left: 10px;
}
.likes {
  flex: none;
  margin-left: 10px;
  color: @color-theme_2-font-label;
  font-size: 11px;
  align-self: flex-end;
}
.comment_text {
  text-align: justify;
  font-size: 14px;
  p {
    line-height: 1.5;
    margin-top: 8px;
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

</style>
