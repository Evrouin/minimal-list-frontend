const _backHandlers = ref<(() => void)[]>([])

export const useBackHandler = () => {
  const push = (handler: () => void) => _backHandlers.value.push(handler)
  const pop = () => _backHandlers.value.pop()
  const handle = () => {
    const top = _backHandlers.value.at(-1)
    if (top) { top(); return true }
    return false
  }
  return { push, pop, handle }
}
