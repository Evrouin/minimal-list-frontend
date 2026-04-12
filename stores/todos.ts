import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Todo } from '../types'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const initialLoad = ref(true)
  const loadingMore = ref(false)
  const nextCursor = ref<string | null>(null)
  const filterType = ref<'all' | 'active' | 'completed' | 'deleted' | 'archived'>('all')
  const filterOptions = ['all', 'active', 'completed', 'deleted', 'archived'] as const
  const api = useTodoApi()
  const pendingReorder = ref<string[] | null>(null)
  const pendingReorderKey = 'todo-order-pending'
  const refreshing = ref(false)

  const cache = new Map<string, { todos: Todo[], cursor: string | null }>()

  const cacheKey = computed(() => {
    const folderStore = useFolderStore()
    const folder = folderStore.activeFolder?.uuid ?? 'default'
    return `${filterType.value}:${folder}`
  })

  // Clear cache + reset list when active folder changes (skip if already empty)
  watch(() => useFolderStore().activeFolder?.uuid, () => {
    cache.clear()
    if (todos.value.length) {
      todos.value = []
      nextCursor.value = null
    }
  })

  const hasMore = computed(() => !!nextCursor.value)

  const filterParams = computed(() => {
    const folderStore = useFolderStore()
    const activeFolder = folderStore.activeFolder
    const folderParam = activeFolder ? `folder=${activeFolder.uuid}` : ''

    if (activeFolder?.is_default && activeFolder.name === 'reminders') {
      return 'has_reminder=true'
    }

    switch (filterType.value) {
      case 'active': return [folderParam, 'completed=false'].filter(Boolean).join('&')
      case 'completed': return [folderParam, 'completed=true'].filter(Boolean).join('&')
      case 'deleted': return 'deleted_only=true'
      default: return folderParam
    }
  })

  const fetchTrash = async () => {
    todos.value = []
    loading.value = true
    initialLoad.value = true
    filterType.value = 'deleted'
    try {
      const response = await api.fetchTodos('deleted_only=true')
      todos.value = response.data.map((t: Todo) => ({ ...t, editing: false }))
      nextCursor.value = response.next
        ? new URL(response.next).pathname + new URL(response.next).search
        : null
    } finally {
      loading.value = false
      initialLoad.value = false
    }
  }

  const fetchArchived = async () => {
    todos.value = []
    loading.value = true
    initialLoad.value = true
    filterType.value = 'archived'
    try {
      const response = await api.fetchTodos('archived_only=true')
      todos.value = response.data.map((t: Todo) => ({ ...t, editing: false }))
      nextCursor.value = response.next
        ? new URL(response.next).pathname + new URL(response.next).search
        : null
    } finally {
      loading.value = false
      initialLoad.value = false
    }
  }

  const fetchArchivedFolder = async (folderUuid: string) => {
    todos.value = []
    loading.value = true
    initialLoad.value = true
    filterType.value = 'archived'
    try {
      const response = await api.fetchTodos(`archived_only=true&folder=${folderUuid}`)
      todos.value = response.data.map((t: Todo) => ({ ...t, editing: false }))
      nextCursor.value = response.next
        ? new URL(response.next).pathname + new URL(response.next).search
        : null
    } finally {
      loading.value = false
      initialLoad.value = false
    }
  }

  const archiveNote = async (id: string) => {
    const index = todos.value.findIndex((t) => t.uuid === id)
    const removed = index >= 0 ? todos.value.splice(index, 1)[0]! : null
    invalidateOtherCaches()
    try {
      await api.archiveNote(id)
    } catch {
      if (removed && index >= 0) todos.value.splice(index, 0, removed)
      throw new Error('archive failed')
    }
    return removed
  }

  const unarchiveNote = async (id: string, reinsert?: Todo) => {
    const index = todos.value.findIndex((t) => t.uuid === id)
    if (index !== -1) todos.value.splice(index, 1)
    invalidateOtherCaches()
    try {
      await api.unarchiveNote(id)
    } catch {
      if (reinsert) todos.value.unshift(reinsert)
      throw new Error('unarchive failed')
    }
  }

  const loadTodos = async () => {
    loading.value = true
    try {
      const response = await api.fetchTodos(filterParams.value)
      todos.value = response.data.map((t: Todo) => ({ ...t, editing: false }))
      const pendingOrder = loadPendingOrder()
      if (pendingOrder?.every((uuid) => todos.value.some((t) => t.uuid === uuid))) {
        applyOrderToTodos(pendingOrder)
      } else {
        savePendingOrder(null)
      }
      nextCursor.value = response.next
        ? new URL(response.next).pathname + new URL(response.next).search
        : null
      cache.set(cacheKey.value, { todos: [...todos.value], cursor: nextCursor.value })
      syncReminders(todos.value)
    } finally {
      loading.value = false
      initialLoad.value = false
    }
  }

  const refreshTodos = async () => {
    refreshing.value = true
    cache.delete(cacheKey.value)
    await loadTodos()
    refreshing.value = false
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
      cache.set(cacheKey.value, { todos: [...todos.value], cursor: nextCursor.value })
    } finally {
      loadingMore.value = false
    }
  }

  const changeFilter = async (type: (typeof filterOptions)[number]) => {
    if (filterType.value === type) return
    filterType.value = type
    const key = cacheKey.value
    const cached = cache.get(key)
    if (cached) {
      todos.value = [...cached.todos]
      nextCursor.value = cached.cursor
      return
    }
    await loadTodos()
  }

  const filteredTodos = computed(() => {
    return todos.value.filter((t) => {
      if (filterType.value === 'archived') return true
      if (t.is_archived) return false
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
    invalidateOtherCaches()
    if (newTodo.reminder_at) scheduleReminder(newTodo)
  }

  const updateTodo = async (updatedTodo: Todo, imageFile?: File, audioFile?: File) => {
    const index = todos.value.findIndex((t) => t.uuid === updatedTodo.uuid)
    if (index === -1) return
    const previous = { ...todos.value[index]! }
    todos.value[index] = { ...updatedTodo, editing: false }
    try {
      const { title, body, completed, pinned, color, reminder_at, link_previews, audio } = updatedTodo
      const previous_reminder = previous.reminder_at
      const jsonPayload: Record<string, unknown> = { title, body, completed, pinned, color, reminder_at: reminder_at ?? null, link_previews: link_previews ?? [] }
      if (reminder_at !== previous_reminder) jsonPayload.snoozed_until = null
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
      invalidateOtherCaches()
      if (response.data.reminder_at) scheduleReminder(response.data)
      else cancelReminder(updatedTodo.uuid)
    } catch {
      todos.value[index] = previous
      throw new Error('update failed')
    }
  }

  const toggleTodoCompletion = async (id: string) => {
    const todo = todos.value.find((t) => t.uuid === id)
    if (!todo) return
    const completing = !todo.completed
    const update = completing && todo.reminder_at
      ? { ...todo, completed: true, reminder_at: null, recurrence_rule: 'none' as const }
      : { ...todo, completed: completing }
    await updateTodo(update)
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
    invalidateOtherCaches()
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
    invalidateOtherCaches()
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
        todos.value[index] = { ...todos.value[index]!, deleted: true }
    }
    invalidateOtherCaches()
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
    if (index !== -1) todos.value[index] = { ...todos.value[index]!, deleted: false }
    invalidateOtherCaches()
    return snapshot
  }
  const restoreTodoCommit = async (id: string) => {
    const response = await api.updateTodo(id, { deleted: false })
    const index = todos.value.findIndex((t) => t.uuid === id)
    if (index !== -1) todos.value[index] = { ...response.data, editing: false }
  }
  const restoreTodoRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const bulkRestoreApply = (ids: string[]) => {
    const snapshot = [...todos.value]
    todos.value = todos.value.map((t) =>
      ids.includes(t.uuid) ? { ...t, deleted: false } : t
    )
    invalidateOtherCaches()
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
    if (import.meta.client) {
      if (order?.length) {
        globalThis.localStorage.setItem(pendingReorderKey, JSON.stringify(order))
      } else {
        globalThis.localStorage.removeItem(pendingReorderKey)
      }
    }
  }

  const loadPendingOrder = (): string[] | null => {
    if (!import.meta.client) return null
    const raw = globalThis.localStorage.getItem(pendingReorderKey)
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

  const reorderTodosBySection = (_section: 'pinned' | 'unpinned', _movedUuids: string[]) => {
    const snapshot = [...todos.value]
    return snapshot
  }

  const bulkReorderCommit = async (uuid: string, newPosition: number, pinned: boolean) => {
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
        section.splice(Math.max(0, Math.min(newPosition - 1, section.length)), 0, moved!)
      }

      const combined = [...pinnedNotes, ...unpinnedNotes]
      combined.forEach((t, i) => { t.order_id = combined.length - i })

      savePendingOrder(null)
  }

  const reorderRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
    savePendingOrder(null)
  }

  const clearTodos = () => {
    todos.value = []
    nextCursor.value = null
    initialLoad.value = true
  }

  const invalidateOtherCaches = () => {
    for (const key of cache.keys()) {
      if (key !== cacheKey.value) cache.delete(key)
    }
    cache.set(cacheKey.value, { todos: [...todos.value], cursor: nextCursor.value })
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
    fetchTrash,
    fetchArchived,
    fetchArchivedFolder,
    loadMore,
    changeFilter,
    refreshTodos,
    refreshing,
    addTodo,
    updateTodo,
    toggleTodoCompletion,
    togglePin,
    archiveNote,
    unarchiveNote,
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
    clearTodos,
  }
})
