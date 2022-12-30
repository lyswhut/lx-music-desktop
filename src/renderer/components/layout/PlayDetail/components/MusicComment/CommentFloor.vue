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
            time(:class="$style.label" v-if="item.timeStr") {{timeFormat(item.timeStr)}}
            div(:class="$style.label" v-if="item.location") {{item.location}}
            div(:class="$style.likes" v-if="item.likedCount != null")
              svg(:class="$style.likesIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 512 512' space='preserve')
                use(xlink:href='#icon-thumbs-up')
              | {{item.likedCount}}
          div.select(:class="$style.comment_text")
            p(v-for="text in item.text") {{text}}
          div(v-if="item.images?.length" :class="$style.comment_images")
            img(v-for="url in item.images" :src="url" loading="lazy" decoding="async")
      comment-floor(v-if="item.reply && item.reply.length" :class="$style.reply_floor" :comments="item.reply")
</template>

<script>
import commentDefImg from '@renderer/assets/images/defaultUser.jpg'

export default {
  name: 'CommentFloor',
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

// .container {

// }

.listItem {
  border-bottom: 1px dashed var(--color-primary-alpha-700);
}

.content {
  padding: 12px 0;
  font-size: 13px;
  color: var(--color-font);
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
  gap: 6px;
  color: var(--color-450);
}
.name {
  flex: 0 1 auto;
  min-width: 0;
  .mixin-ellipsis-1;
  color: var(--color-650);
}
.label {
  flex: none;
  font-size: 12px;
  // margin-left: 5px;
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
  color: var(--color-primary-alpha-500);
}
.comment_text {
  text-align: justify;
  font-size: 14px;
  padding-top: 5px;
  p {
    line-height: 1.5;
    word-break: break-all;
    overflow-wrap: break-word;
  }
}
.comment_images {
  display: flex;
  flex-flow: row wrap;
  gap: 5px;
  margin-top: 5px;

  img {
    max-width: 240px;
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

  background-color: var(--color-primary-light-500-alpha-700);
}


</style>
