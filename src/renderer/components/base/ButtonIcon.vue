
<template>
    <button class="button-icon"><slot></slot></button>
  </template>

<script>
export default {
  name: 'ButtonIcon',
}
</script>

<style lang="less" scoped>
  button {
    display: flex;
    cursor: pointer;
    justify-content: center;
    align-items: center;
    padding: 8px;
    background: transparent;
    margin: 4px;
    border-radius: 25%;
    transition: 0.2s;
    border: none;
    outline: none;
    font-size: 20px;
    cursor: pointer;
    .svg-icon {
      color: #000;
      height: 16px;
      width: 16px;
    }
    &:first-child {
      margin-left: 0;
    }
    &:hover {
      background: rgba(209, 209, 214, 0.28);
    }
    &:active {
      transform: scale(0.92);
    }
  }
  </style>
