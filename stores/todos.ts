import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Todo } from '../types'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const filterType = ref<'all' | 'active' | 'completed' | 'deleted'>('all')
  const filterOptions = ['all', 'active', 'completed', 'deleted'] as const
  const api = useTodoApi()

  const loadTodos = async () => {
    loading.value = true
    try {
      const includeDeleted = filterType.value === 'deleted'
      const response = await api.fetchTodos(includeDeleted)
      todos.value = response.data.map((t) => ({ ...t, editing: false }))
    } finally {
      loading.value = false
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

  return {
    todos,
    loading,
    filteredTodos,
    filterType,
    filterOptions,
    loadTodos,
    changeFilter,
    addTodo,
    updateTodo,
    toggleTodoCompletion,
    deleteTodo,
  }
})
