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

  const hasMore = computed(() => !!nextCursor.value)

  const loadTodos = async () => {
    loading.value = true
    try {
      const deletedOnly = filterType.value === 'deleted'
      const response = await api.fetchTodos(deletedOnly)
      todos.value = response.data.map((t: Todo) => ({ ...t, editing: false }))
      nextCursor.value = response.next
        ? new URL(response.next).pathname + new URL(response.next).search
        : null
    } finally {
      loading.value = false
      initialLoad.value = false
    }
  }

  const loadMore = async () => {
    if (!nextCursor.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const response = await api.fetchTodos(false, nextCursor.value)
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
    return todos.value.filter((todo) => {
      switch (filterType.value) {
        case 'completed':
          return todo.completed && !todo.deleted
        case 'deleted':
          return todo.deleted
        case 'active':
          return !todo.completed && !todo.deleted
        default:
          return !todo.deleted
      }
    })
  })

  const addTodo = async (todo: Partial<Todo> | FormData) => {
    const response = await api.createTodo(todo)
    todos.value.unshift({ ...response.data, editing: false })
  }

  const updateTodo = async (updatedTodo: Todo, imageFile?: File) => {
    const index = todos.value.findIndex((t) => t.id === updatedTodo.id)
    if (index === -1) return
    const previous = { ...todos.value[index] }
    todos.value[index] = { ...updatedTodo, editing: false }
    try {
      let body: Partial<Todo> | FormData = updatedTodo
      if (imageFile) {
        const fd = new FormData()
        fd.append('title', updatedTodo.title)
        fd.append('body', updatedTodo.body)
        fd.append('image', imageFile)
        body = fd
      }
      const response = await api.updateTodo(updatedTodo.id, body)
      todos.value[index] = { ...response.data, editing: false }
    } catch {
      todos.value[index] = previous
      throw new Error('update failed')
    }
  }

  const toggleTodoCompletion = async (id: number) => {
    const todo = todos.value.find((t) => t.id === id)
    if (todo) {
      await updateTodo({ ...todo, completed: !todo.completed })
    }
  }

  const togglePin = async (id: number) => {
    const todo = todos.value.find((t) => t.id === id)
    if (todo) {
      await updateTodo({ ...todo, pinned: !todo.pinned })
    }
  }

  // Bulk actions split into apply (optimistic) / commit (API) / rollback
  const bulkDeleteApply = (ids: number[]) => {
    const snapshot = [...todos.value]
    todos.value = todos.value
      .filter((t) => !(ids.includes(t.id) && t.deleted))
      .map((t) => (ids.includes(t.id) ? { ...t, deleted: true } : t))
    return snapshot
  }
  const bulkDeleteCommit = async (ids: number[]) => {
    await api.bulkDelete(ids)
  }
  const bulkDeleteRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const bulkPinApply = (ids: number[], pinned: boolean) => {
    const snapshot = [...todos.value]
    todos.value = todos.value.map((t) =>
      ids.includes(t.id) ? { ...t, pinned } : t
    )
    return snapshot
  }
  const bulkPinCommit = async (ids: number[], pinned: boolean) => {
    await api.bulkPin(ids, pinned)
  }
  const bulkPinRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const deleteTodoApply = (id: number, isPermanentDelete: boolean) => {
    const snapshot = [...todos.value]
    if (isPermanentDelete) {
      todos.value = todos.value.filter((t) => t.id !== id)
    } else {
      const index = todos.value.findIndex((t) => t.id === id)
      if (index !== -1)
        todos.value[index] = { ...todos.value[index], deleted: true }
    }
    return snapshot
  }
  const deleteTodoCommit = async (id: number) => {
    await api.deleteTodo(id)
  }
  const deleteTodoRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const restoreTodoApply = (id: number) => {
    const snapshot = [...todos.value]
    const index = todos.value.findIndex((t) => t.id === id)
    if (index !== -1) todos.value[index] = { ...todos.value[index], deleted: false }
    return snapshot
  }
  const restoreTodoCommit = async (id: number) => {
    await api.updateTodo(id, { deleted: false })
  }
  const restoreTodoRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const bulkRestoreApply = (ids: number[]) => {
    const snapshot = [...todos.value]
    todos.value = todos.value.map((t) =>
      ids.includes(t.id) ? { ...t, deleted: false } : t
    )
    return snapshot
  }
  const bulkRestoreCommit = async (ids: number[]) => {
    await api.bulkRestore(ids)
  }
  const bulkRestoreRollback = (snapshot: Todo[]) => {
    todos.value = snapshot
  }

  const pinnedTodos = computed(() =>
    filteredTodos.value.filter((t) => t.pinned)
  )
  const unpinnedTodos = computed(() =>
    filteredTodos.value.filter((t) => !t.pinned)
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
  }
})
