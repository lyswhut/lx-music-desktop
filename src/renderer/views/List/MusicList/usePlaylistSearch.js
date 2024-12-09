export default ({ list, listCopy }) => {
  const handlePlaylistSearch = (searchContent) => {
    list.value = listCopy.value.filter((item) => {
      return item.name.toLowerCase().includes(searchContent.toLowerCase()) || item.singer.toLowerCase().includes(searchContent.toLowerCase())
    })
  }
  return {
    handlePlaylistSearch,
  }
}
