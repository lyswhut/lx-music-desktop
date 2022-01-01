<template>
  <svg class="svg-icon" aria-hidden="true">
    <use :xlink:href="id" />
  </svg>
</template>

<script>

export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  computed: {
    id() {
      return `#icon-${this.name}`
    },
  },
}
</script>

<style>
.svg-icon {
  width: 1.2em;
  height: 1.2em;
  vertical-align: -0.25em;
  fill: currentColor;
  overflow: hidden;
}
</style>
