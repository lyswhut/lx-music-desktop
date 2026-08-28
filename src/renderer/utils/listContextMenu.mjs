export const shouldCopyListTextOnContextMenu = ({
  isSelectTextTarget,
  selectionText,
}) => {
  return isSelectTextTarget && !!selectionText.trim()
}

export const formatListSelectionText = (selectionText) => {
  return selectionText
    .split(/\n\n/)
    .map(text => text.replace(/\n/g, '  '))
    .join('\n')
    .trim()
}
