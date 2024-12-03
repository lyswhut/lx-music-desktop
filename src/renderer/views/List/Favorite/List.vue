<template>
    <div>
        <div :style="listStyles">
            <ListItem
            v-for="item in list"
                :key="item.id"
                :cover="item.meta.picUrl"
                :name="item.name"
                :singer="item.singer"
            />
        </div>
    </div>
</template>

<script>
import useListInfo from './useListInfo'
import ListItem from './ListItem.vue'
export default {
  name: 'List',
  components: {
    ListItem,
  },
  props: {
    listId: {
      type: String,
      required: true,
    },
    columnNumber: {
      type: Number,
      default: 4,
    },
  },
  emits: ['show-menu'],
  setup(props, { emit }) {
    const {
      list,
    } = useListInfo({ props, maxCount: props.columnNumber * 3 })

    return {
      list,
    }
  },
  data() {
    return {
      listStyles: {},
    }
  },
  created() {
    this.listStyles = {
      display: 'grid',
      gap: '4px',
      gridTemplateColumns: `repeat(${this.columnNumber - 1}, 1fr)`,
    }
  },
}


</script>

  <style lang="less" module>
  @import '@renderer/assets/styles/layout.less';

  .list {
    overflow: hidden;
    height: 100%;
    flex: auto;
    display: flex;
    flex-flow: column nowrap;

    :global(.list-item) {
      &.active {
        color: var(--color-button-font);
      }
    }
    :global {
      .label-source {
        color: var(--color-primary);
        padding: 5px;
        font-size: .8em;
        line-height: 1.2;
        opacity: .75;
        display: inline-block;
      }
    }
  }
  .num {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .playIcon {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--color-button-font);
    opacity: .7;
  }
  .content {
    min-height: 0;
    font-size: 14px;
    display: flex;
    flex-flow: column nowrap;
    flex: auto;
  }

  .noItem {
    position: relative;
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;

    p {
      font-size: 24px;
      color: var(--color-font-label);
    }
  }

  </style>
