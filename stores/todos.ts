import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Todo } from '../types'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const nextCursor = ref<string | null>(null)
  const filterType = ref<'all' | 'active' | 'completed' | 'deleted'>('all')
  const filterOptions = ['all', 'active', 'completed', 'deleted'] as const
  const api = useTodoApi()

  const hasMore = computed(() => !!nextCursor.value)

  const loadTodos = async () => {
    loading.value = true
    try {
      const includeDeleted = filterType.value === 'deleted'
      const response = await api.fetchTodos(includeDeleted)
      todos.value = response.data.map((t: Todo) => ({ ...t, editing: false }))
      nextCursor.value = response.next
        ? new URL(response.next).pathname + new URL(response.next).search
        : null
    } finally {
      loading.value = false
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

  const changeFilter = (type: (typeof filterOptions)[number]) => {
    filterType.value = type
    loadTodos()
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

  const addTodo = async (todo: Partial<Todo>) => {
    const response = await api.createTodo(todo)
    todos.value.unshift({ ...response.data, editing: false })
  }

  const updateTodo = async (updatedTodo: Todo) => {
    const index = todos.value.findIndex((t) => t.id === updatedTodo.id)
    if (index === -1) return
    const previous = { ...todos.value[index] }
    todos.value[index] = { ...updatedTodo, editing: false }
    try {
      const response = await api.updateTodo(updatedTodo.id, updatedTodo)
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

  const bulkDelete = async (ids: number[]) => {
    const previous = [...todos.value]
    // Remove permanently deleted, soft-delete active ones
    todos.value = todos.value
      .filter((t) => !(ids.includes(t.id) && t.deleted))
      .map((t) => ids.includes(t.id) ? { ...t, deleted: true } : t)
    try {
      await api.bulkDelete(ids)
    } catch {
      todos.value = previous
    }
  }

  const bulkPin = async (ids: number[], pinned: boolean) => {
    const previous = [...todos.value]
    todos.value = todos.value.map((t) =>
      ids.includes(t.id) ? { ...t, pinned } : t
    )
    try {
      await api.bulkPin(ids, pinned)
    } catch {
      todos.value = previous
    }
  }

  const deleteTodo = async (id: number, isPermanentDelete: boolean) => {
    const index = todos.value.findIndex((t) => t.id === id)
    if (index === -1) return
    const previous = { ...todos.value[index] }
    const previousList = [...todos.value]

    if (isPermanentDelete) {
      todos.value = todos.value.filter((t) => t.id !== id)
    } else {
      todos.value[index] = { ...todos.value[index], deleted: true }
    }

    try {
      await api.deleteTodo(id)
    } catch {
      todos.value = previousList
      if (!isPermanentDelete && index < todos.value.length) {
        todos.value[index] = previous
      }
      throw new Error('delete failed')
    }
  }

  const pinnedTodos = computed(() => filteredTodos.value.filter((t) => t.pinned))
  const unpinnedTodos = computed(() => filteredTodos.value.filter((t) => !t.pinned))

  return {
    todos,
    loading,
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
    bulkDelete,
    bulkPin,
    deleteTodo,
  }
})
