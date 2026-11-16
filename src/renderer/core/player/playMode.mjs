export const resolvePlayModeSelection = (currentMode, selectedMode) => {
  return {
    nextMode: selectedMode,
    shouldResetRandomQueue: selectedMode === 'random',
  }
}
