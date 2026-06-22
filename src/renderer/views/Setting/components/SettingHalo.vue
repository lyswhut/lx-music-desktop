<template lang="pug">
dt#halo {{ $t('setting__halo') }}
dd.gap-top
  div
    .p
      base-checkbox(id="setting_halo_enable" :model-value="appSetting['halo.enable']" :label="$t('setting__halo_enable')" @update:model-value="updateSetting({ 'halo.enable': $event })")
dd.gap-top
  div
    h3 {{ $t('setting__halo_display') }}
    .p
      span.small {{ $t('setting__halo_layout') }}
      div
        select(:value="appSetting['halo.layout']" @change="onLayoutChange")
          option(value="center") {{ $t('setting__halo_layout_center') }}
          option(value="left") {{ $t('setting__halo_layout_left') }}
          option(value="right") {{ $t('setting__halo_layout_right') }}
          option(value="stretch") {{ $t('setting__halo_layout_stretch') }}
          option(value="scroll_left_to_right") {{ $t('setting__halo_layout_scroll_lr') }}
          option(value="scroll_right_to_left") {{ $t('setting__halo_layout_scroll_rl') }}
    .p
      span.small {{ $t('setting__halo_max_chars', { num: appSetting['halo.maxCharsPerLine'] }) }}
      div
        input(type="range" min="8" max="50" step="1" :value="appSetting['halo.maxCharsPerLine']" @input="onMaxCharsChange")
    .p
      base-checkbox(id="setting_halo_show_progress" :model-value="appSetting['halo.showProgress']" :label="$t('setting__halo_show_progress')" @update:model-value="updateSetting({ 'halo.showProgress': $event })")
dd.gap-top
  div
    .p.small
      | {{ $t('setting__halo_tip') }}
</template>

<script>
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingHalo',
  setup() {
    const onLayoutChange = event => {
      updateSetting({ 'halo.layout': event.target.value })
    }
    const onMaxCharsChange = event => {
      updateSetting({ 'halo.maxCharsPerLine': parseInt(event.target.value, 10) })
    }

    return {
      appSetting,
      updateSetting,
      onLayoutChange,
      onMaxCharsChange,
    }
  },
}
</script>
