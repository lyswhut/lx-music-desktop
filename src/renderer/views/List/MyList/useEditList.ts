import { ref, nextTick, useCssModule, type Ref } from '@common/utils/vueTools'
import { userLists } from '@renderer/store/list/state'
import { updateUserList, createUserList } from '@renderer/store/list/action'
import { dialog } from '@renderer/plugins/Dialog'

export default ({ dom_lists_list }: {
  dom_lists_list: Ref<HTMLElement | null>
}) => {
  const isShowNewList = ref(false)
  const isNewListLeave = ref(false)
  const editIndex = ref(-1)
  const styles = useCssModule()

  const handleRename = (index: number) => {
    // console.log(index)
    const dom = dom_lists_list.value?.querySelectorAll('.user-list')[index]
    if (!dom) return
    void nextTick(() => {
      dom.classList.add(styles.editing)
      dom.querySelector('input')?.focus()
    })
  }

  const handleSaveListName = async() => {
    let dom_target = dom_lists_list.value?.querySelector('.' + styles.editing) as HTMLElement
    if (!dom_target) return
    const dom_input: HTMLInputElement = dom_target.querySelector('.' + styles.listsInput)!
    if (!dom_input) return
    let name = dom_input.value.trim()
    if (dom_target.dataset.index == null) return
    const targetList = userLists[parseInt(dom_target.dataset.index)]
    if (name.length) await updateUserList([{ ...targetList, name }])
    dom_input.value = targetList.name
    dom_target.classList.remove(styles.editing)
  }

  const handleCreateList = async(event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.readOnly) return
    let name = target.value.trim()
    target.readOnly = true

    if (name == '' || (
      userLists.some(l => l.name == name) && !(await dialog.confirm(window.i18n.t('list_duplicate_tip'))))
    ) {
      isShowNewList.value = false
      return
    }

    await createUserList({ name })
    isNewListLeave.value = true
    void nextTick(() => {
      isShowNewList.value = false
    })
  }


  return {
    isShowNewList,
    isNewListLeave,
    editIndex,
    handleRename,
    handleSaveListName,
    handleCreateList,
  }
}
