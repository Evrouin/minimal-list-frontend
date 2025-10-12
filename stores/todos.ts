import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Todo } from '../types'

const STORAGE_KEY = 'todos'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const filterType = ref<'all' | 'active' | 'completed' | 'deleted'>('all')
  const filterOptions = ['all', 'active', 'completed', 'deleted'] as const

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      todos.value = JSON.parse(stored)
    }

    watch(
      todos,
      (newVal) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
      },
      { deep: true }
    )
  }

  const changeFilter = (type: (typeof filterOptions)[number]) => {
    filterType.value = type
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

  const addTodo = (todo: Todo) => {
    todos.value.push(todo)
  }

  const updateTodo = (updatedTodo: Todo) => {
    const index = todos.value.findIndex((todo) => todo.id === updatedTodo.id)
    if (index !== -1) {
      todos.value[index] = { ...todos.value[index], ...updatedTodo }
    }
  }

  const toggleTodoCompletion = (id: number) => {
    const todo = todos.value.find((todo) => todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  const deleteTodo = (id: number, isPermanentDelete: boolean) => {
    todos.value = todos.value
      .map((todo) =>
        todo.id === id ? { ...todo, deleted: !isPermanentDelete && true } : todo
      )
      .filter((todo) => (isPermanentDelete ? todo.id !== id : true))
  }

  return {
    todos,
    filteredTodos,
    filterType,
    filterOptions,
    changeFilter,
    addTodo,
    updateTodo,
    toggleTodoCompletion,
    deleteTodo,
  }
})
