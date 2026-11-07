import { onMounted, useCssModule, type Ref } from '@common/utils/vueTools'


export default ({ dom_lists_list }: {
  dom_lists_list: Ref<HTMLElement | null>
}) => {
  const styles = useCssModule()

  const setListsScroll = () => {
    if (!dom_lists_list.value) return
    const target = dom_lists_list.value.querySelector<HTMLElement>('.' + styles.active)
    if (!target) return
    let offsetTop = target.offsetTop
    let location = offsetTop - 150
    if (location > 0) dom_lists_list.value.scrollTop = location
  }

  onMounted(() => {
    setListsScroll()
  })
}
