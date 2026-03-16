interface Toast {
  id: number
  message: string
  timer: ReturnType<typeof setTimeout>
  onUndo: () => void
  onCommit: () => void
}

let nextId = 0

export function useUndoToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  const show = (message: string, onCommit: () => void, onUndo: () => void) => {
    const id = nextId++
    const timer = setTimeout(() => {
      dismiss(id, true)
    }, 5000)
    toasts.value.push({ id, message, timer, onUndo, onCommit })
  }

  const undo = (id: number) => {
    const toast = toasts.value.find((t) => t.id === id)
    if (!toast) return
    clearTimeout(toast.timer)
    toast.onUndo()
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const dismiss = (id: number, commit = false) => {
    const toast = toasts.value.find((t) => t.id === id)
    if (!toast) return
    clearTimeout(toast.timer)
    if (commit) toast.onCommit()
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const flushAll = () => {
    toasts.value.forEach((t) => {
      clearTimeout(t.timer)
      t.onCommit()
    })
    toasts.value = []
  }

  return { toasts, show, undo, dismiss, flushAll }
}
