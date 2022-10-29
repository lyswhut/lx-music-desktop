import { computed, ref } from '@common/utils/vueTools'

export default () => {
  const tabs = computed(() => {
    return [
      {
        label: window.i18n.t('download__all'),
        id: 'all',
      },
      {
        label: window.i18n.t('download__runing'),
        id: 'runing',
      },
      {
        label: window.i18n.t('download__paused'),
        id: 'paused',
      },
      {
        label: window.i18n.t('download__error'),
        id: 'error',
      },
      {
        label: window.i18n.t('download__finished'),
        id: 'finished',
      },
    ]
  })
  const activeTab = ref('all')

  // const setActiveTab = (tab) => {
  //   activeTab.value = tab
  // }

  return {
    tabs,
    activeTab,
    // setActiveTab,
  }
}
