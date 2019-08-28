<template lang="pug">
  div
    h2 推荐
</template>

<script>
export default {
  name: 'SongList',
  data() {
    return {
      count: 0,
    }
  },
  methods: {
    add() {
      this.count++
    },
  },
}
</script>
