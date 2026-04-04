import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Todo } from '../types'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const initialLoad = ref(true)
  const loadingMore = ref(false)
  const nextCursor = ref<string | null>(null)
  const filterType = ref<'all' | 'active' | 'completed' | 'deleted'>('all')
  const filterOptions = ['all', 'active', 'completed', 'deleted'] as const
  const api = useTodoApi()
  const pendingReorder = ref<string[] | null>(null)
  const pendingReorderKey = 'todo-order-pending'

  const hasMore = computed(() => !!nextCursor.value)

  const filterParams = computed(() => {
    switch (filterType.value) {
      case 'active': return 'completed=false'
      case 'completed': return 'completed=true'
      case 'deleted': return 'deleted_only=true'
      default: return ''
    }
  })

  const loadTodos = async () => {
    loading.value = true
    try {
      const response = await api.fetchTodos(filterParams.value)
      todos.value = response.data.map((t: Todo) => ({ ...t, editing: false }))
      const pendingOrder = loadPendingOrder()
      if (pendingOrder && pendingOrder.every((uuid) => todos.value.some((t) => t.uuid === uuid))) {
        applyOrderToTodos(pendingOrder)
      } else {
        savePendingOrder(null)
      }
      nextCursor.value = response.next
        ? new URL(response.next).pathname + new URL(response.next).search
        : null
      syncReminders(todos.value)
    } finally {
      loading.value = false
      initialLoad.value = false
    }
  }

  const loadMore = async () => {
    if (!nextCursor.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const response = await api.fetchTodos(undefined, nextCursor.value)
      todos.value.push(
        ...response.data.map((t: Todo) => ({ ...t, editing: false }))
      )
      nextCursor.value = response.next
        ? new URL(response.next).pathname + new URL(response.next).search
        : null
    } finally {
      loadingMore.value = false
    }
  }

  const changeFilter = async (type: (typeof filterOptions)[number]) => {
    if (filterType.value === type) return
    filterType.value = type
    await loadTodos()
  }

  const filteredTodos = computed(() => {
    return todos.value.filter((t) => {
      if (t.deleted && filterType.value !== 'deleted') return false
      if (filterType.value === 'active' && t.completed) return false
      if (filterType.value === 'completed' && !t.completed) return false
      if (filterType.value === 'deleted' && !t.deleted) return false
      return true
    })
  })

  const { schedule: scheduleReminder, cancel: cancelReminder, syncAll: syncReminders } = useReminders()

  const addTodo = async (todo: Partial<Todo> | FormData) => {
    const response = await api.createTodo(todo)
    const newTodo = { ...response.data, editing: false }
    if (!newTodo.pinned) {
      todos.value.forEach((t) => {
        if (t.pinned && !t.deleted && t.order_id) t.order_id++
      })
    }
    todos.value.unshift(newTodo)
    if (newTodo.reminder_at) scheduleReminder(newTodo)
  }

  const updateTodo = async (updatedTodo: Todo, imageFile?: File, audioFile?: File) => {
    const index = todos.value.findIndex((t) => t.uuid === updatedTodo.uuid)
    if (index === -1) return
    const previous = { ...todos.value[index] }
    todos.value[index] = { ...updatedTodo, editing: false }
    try {
      const { title, body, completed, pinned, color, reminder_at, link_previews, audio } = updatedTodo
      const jsonPayload: Record<string, unknown> = { title, body, completed, pinned, color, reminder_at: reminder_at ?? null, link_previews: link_previews ?? [] }
      if (audio === null) jsonPayload.audio = null
      let payload: Record<string, unknown> | FormData = jsonPayload
      if (imageFile || audioFile) {
        const fd = new FormData()
        fd.append('title', title)
        fd.append('body', body)
        fd.append('completed', String(completed))
        fd.append('pinned', String(pinned))
        fd.append('color', color)
        if (reminder_at) fd.append('reminder_at', reminder_at)
        if (imageFile) fd.append('image', imageFile)
        if (audioFile) fd.append('audio', audioFile)
        if (link_previews?.length) fd.append('link_previews', JSON.stringify(link_previews))
        payload = fd
      }
      const response = await api.updateTodo(updatedTodo.uuid, payload)
      todos.value[index] = { ...response.data, editing: false }
      if (response.data.reminder_at) scheduleReminder(response.data)
      else cancelReminder(updatedTodo.uuid)
    } catch {
      todos.value[index] = previous
      throw new Error('update failed')
    }
  }

  const toggleTodoCompletion = async (id: string) => {
    const todo = todos.value.find((t) => t.uuid === id)
    if (todo) {
      await updateTodo({ ...todo, completed: !todo.completed })
    }
  }

  const togglePin = async (id: string) => {
    const todo = todos.value.find((t) => t.uuid === id)
    if (todo) {
      await updateTodo({ ...todo, pinned: !todo.pinned })
    }
  }

  const bulkDeleteApply = (ids: string[]) => {
    const snapshot = [...todos.value]
    todos.value = todos.value
      .filter((t) => !(ids.includes(t.uuid) && t.deleted))
      .map((t) => (ids.includes(t.uuid) ? { ...t, deleted: true } : t))
    return snapshot
  }
  const bulkDeleteCommit = async (ids: string[]) => {
    await api.bulkDelete(ids)
  }
  const bulkDeleteRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const bulkPinApply = (ids: string[], pinned: boolean) => {
    const snapshot = [...todos.value]
    todos.value = todos.value.map((t) =>
      ids.includes(t.uuid) ? { ...t, pinned } : t
    )
    return snapshot
  }
  const bulkPinCommit = async (ids: string[], pinned: boolean) => {
    await api.bulkPin(ids, pinned)
  }
  const bulkPinRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const deleteTodoApply = (id: string, isPermanentDelete: boolean) => {
    const snapshot = [...todos.value]
    if (isPermanentDelete) {
      todos.value = todos.value.filter((t) => t.uuid !== id)
    } else {
      const index = todos.value.findIndex((t) => t.uuid === id)
      if (index !== -1)
        todos.value[index] = { ...todos.value[index], deleted: true }
    }
    return snapshot
  }
  const deleteTodoCommit = async (id: string) => {
    await api.deleteTodo(id)
  }
  const deleteTodoRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const restoreTodoApply = (id: string) => {
    const snapshot = [...todos.value]
    const index = todos.value.findIndex((t) => t.uuid === id)
    if (index !== -1) todos.value[index] = { ...todos.value[index], deleted: false }
    return snapshot
  }
  const restoreTodoCommit = async (id: string) => {
    await api.updateTodo(id, { deleted: false })
  }
  const restoreTodoRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const bulkRestoreApply = (ids: string[]) => {
    const snapshot = [...todos.value]
    todos.value = todos.value.map((t) =>
      ids.includes(t.uuid) ? { ...t, deleted: false } : t
    )
    return snapshot
  }
  const bulkRestoreCommit = async (ids: string[]) => {
    await api.bulkRestore(ids)
  }
  const bulkRestoreRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const savePendingOrder = (order: string[] | null) => {
    pendingReorder.value = order
    if (process.client) {
      if (order && order.length) {
        window.localStorage.setItem(pendingReorderKey, JSON.stringify(order))
      } else {
        window.localStorage.removeItem(pendingReorderKey)
      }
    }
  }

  const loadPendingOrder = (): string[] | null => {
    if (!process.client) return null
    const raw = window.localStorage.getItem(pendingReorderKey)
    if (!raw) return null
    try {
      return JSON.parse(raw) as string[]
    } catch {
      return null
    }
  }

  const applyOrderToTodos = (order: string[]) => {
    const orderMap = new Map(order.map((uuid, index) => [uuid, index]))
    todos.value.sort((a, b) => {
      const ai = orderMap.has(a.uuid) ? orderMap.get(a.uuid)! : Infinity
      const bi = orderMap.has(b.uuid) ? orderMap.get(b.uuid)! : Infinity
      return ai - bi || 0
    })
  }

  const reorderTodosBySection = (section: 'pinned' | 'unpinned', movedUuids: string[]) => {
    const snapshot = [...todos.value]
    return snapshot
  }

  const bulkReorderCommit = async (uuid: string, newPosition: number, pinned: boolean) => {
    try {
      const response = await api.bulkReorder(uuid, newPosition, pinned)
      if (!response.success) throw new Error('bulk reorder failed')

      // Mirror backend logic: reorder within section, then reassign order_ids
      const active = todos.value.filter((t) => !t.deleted)
      const pinnedNotes = active.filter((t) => t.pinned).sort((a, b) => (b.order_id ?? 0) - (a.order_id ?? 0))
      const unpinnedNotes = active.filter((t) => !t.pinned).sort((a, b) => (b.order_id ?? 0) - (a.order_id ?? 0))

      const section = pinned ? pinnedNotes : unpinnedNotes
      const idx = section.findIndex((t) => t.uuid === uuid)
      if (idx >= 0) {
        const [moved] = section.splice(idx, 1)
        section.splice(Math.max(0, Math.min(newPosition - 1, section.length)), 0, moved)
      }

      const combined = [...pinnedNotes, ...unpinnedNotes]
      combined.forEach((t, i) => { t.order_id = combined.length - i })

      savePendingOrder(null)
    } catch (e) {
      throw e
    }
  }

  const reorderRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
    savePendingOrder(null)
  }

  const pinnedTodos = computed(() =>
    filteredTodos.value.filter((t) => t.pinned).sort((a, b) => (b.order_id ?? 0) - (a.order_id ?? 0))
  )
  const unpinnedTodos = computed(() =>
    filteredTodos.value.filter((t) => !t.pinned).sort((a, b) => (b.order_id ?? 0) - (a.order_id ?? 0))
  )

  return {
    todos,
    loading,
    initialLoad,
    loadingMore,
    hasMore,
    filteredTodos,
    pinnedTodos,
    unpinnedTodos,
    filterType,
    filterOptions,
    loadTodos,
    loadMore,
    changeFilter,
    addTodo,
    updateTodo,
    toggleTodoCompletion,
    togglePin,
    bulkDelete: bulkDeleteApply,
    bulkDeleteCommit,
    bulkDeleteRollback,
    bulkPin: bulkPinApply,
    bulkPinCommit,
    bulkPinRollback,
    deleteTodo: deleteTodoApply,
    deleteTodoCommit,
    deleteTodoRollback,
    restoreTodo: restoreTodoApply,
    restoreTodoCommit,
    restoreTodoRollback,
    bulkRestore: bulkRestoreApply,
    bulkRestoreCommit,
    bulkRestoreRollback,
    reorderTodosBySection,
    bulkReorderCommit,
    reorderRollback,
  }
})
