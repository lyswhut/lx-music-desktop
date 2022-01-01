import { getList as getMyList } from './list'
import { downloadList } from './download'


export const getList = listId => {
  return listId == 'download' ? downloadList : getMyList(listId)
}
