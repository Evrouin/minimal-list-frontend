import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Todo } from '../types'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const filterType = ref<'all' | 'active' | 'completed' | 'deleted'>('all')
  const filterOptions = ['all', 'active', 'completed', 'deleted'] as const
  const api = useTodoApi()

  const loadTodos = async () => {
    const includeDeleted = filterType.value === 'deleted'
    const response = await api.fetchTodos(includeDeleted)
    todos.value = response.data.map((t) => ({ ...t, editing: false }))
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
    const response = await api.updateTodo(updatedTodo.id, updatedTodo)
    const index = todos.value.findIndex((todo) => todo.id === updatedTodo.id)
    if (index !== -1) {
      todos.value[index] = { ...response.data, editing: false }
    }
  }

  const toggleTodoCompletion = async (id: number) => {
    const todo = todos.value.find((todo) => todo.id === id)
    if (todo) {
      await updateTodo({ ...todo, completed: !todo.completed })
    }
  }

  const deleteTodo = async (id: number, isPermanentDelete: boolean) => {
    await api.deleteTodo(id)
    if (isPermanentDelete) {
      todos.value = todos.value.filter((todo) => todo.id !== id)
    } else {
      const index = todos.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        todos.value[index] = { ...todos.value[index], deleted: true }
      }
    }
  }

  return {
    todos,
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
