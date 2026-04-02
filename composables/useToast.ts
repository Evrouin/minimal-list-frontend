interface Toast {
  id: number
  message: string
  timer: ReturnType<typeof setTimeout>
  onUndo: () => void
  onCommit: () => void
}

let nextId = 0
const pendingCommits: Promise<void>[] = []

export function useUndoToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  const show = (message: string, onCommit: () => void, onUndo: () => void) => {
    const id = nextId++
    const timer = setTimeout(() => {
      dismiss(id, true)
    }, 800)
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
    if (commit) {
      const p = Promise.resolve(toast.onCommit()).finally(() => {
        const i = pendingCommits.indexOf(p)
        if (i !== -1) pendingCommits.splice(i, 1)
      })
      pendingCommits.push(p)
    }
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const flushAll = async () => {
    const all = [...toasts.value]
    const pending = [...pendingCommits]
    const promises = all.map((t) => {
      clearTimeout(t.timer)
      return t.onCommit()
    })
    toasts.value = []
    await Promise.all([...promises, ...pending])
  }

  return { toasts, show, undo, dismiss, flushAll }
}
