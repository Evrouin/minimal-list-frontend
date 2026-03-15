<script setup lang="ts">
import { ref } from 'vue'
import type { Todo } from '@/types'
import { useTodoStore } from '~/stores/todos'
import { storeToRefs } from 'pinia'

const todoStore = useTodoStore()
const isTodoEmptyMessage = ref('No todos available')

const { filteredTodos } = storeToRefs(todoStore)
const { loading } = storeToRefs(todoStore)

const showDeleteDialog = ref(false)
const todoToDelete = ref<Todo | null>(null)

const timeAgo = (date: string | undefined) => {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.floor(days / 365)}y`
}

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 30000) })
onUnmounted(() => clearInterval(timer))

const getTodoClasses = (todo: Todo) => [
  'p-5 border-0.5 rounded-lg shadow-md flex flex-col gap-2 mb-5 w-full',
  todo.completed
    ? 'bg-gray-700 opacity-50'
    : 'bg-gray-800 hover:px-6 hover:bg-gray-900 transition-all duration-200',
]

const editTodo = (todo: Todo) => {
  todo.editing = true
}

const saveTodo = async (todo: Todo) => {
  if (!todo.title.trim() || !todo.body.trim()) return
  todo.editing = false
  await todoStore.updateTodo({ ...todo })
}

const toggleCompletion = async (todo: Todo) => {
  await todoStore.toggleTodoCompletion(todo.id)
}

const requestDelete = (todo: Todo) => {
  todoToDelete.value = todo
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!todoToDelete.value) return
  await todoStore.deleteTodo(todoToDelete.value.id, todoToDelete.value.deleted)
  todoToDelete.value = null
}
</script>

<template>
  <TodoSkeleton v-if="loading" :count="3" />

  <div
    v-else-if="filteredTodos.length === 0"
    class="flex items-center justify-center"
  >
    <div
      class="border-0.5 mb-5 flex w-full flex-col gap-2 rounded-lg border-slate-500 bg-gray-900 p-5 shadow-md"
    >
      <span
        class="text-center text-sm text-wrap break-words text-white lowercase"
      >
        {{ isTodoEmptyMessage }}
      </span>
    </div>
  </div>

  <div
    v-for="todo in filteredTodos"
    :key="todo.id"
    class="flex w-full items-center justify-center"
  >
    <div :class="getTodoClasses(todo)">
      <div class="flex w-full items-center justify-between">
        <span
          v-if="!todo.editing"
          class="text-md flex-grow cursor-pointer font-bold text-white lowercase hover:text-gray-300"
          @click="editTodo(todo)"
        >
          {{ todo.title }}
        </span>
        <input
          v-if="todo.editing"
          v-model="todo.title"
          class="text-md flex-grow border-b border-white/20 bg-transparent font-bold text-white lowercase focus:outline-none"
          @blur="saveTodo(todo)"
          @keydown.enter="saveTodo(todo)"
        />
        <div class="flex items-center space-x-2">
          <button
            class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
            :title="`Delete ${todo.title}`"
            @click="requestDelete(todo)"
          >
            <Icon name="uil:trash" />
          </button>
          <button
            class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
            :title="todo.completed ? 'Mark as incomplete' : 'Mark as complete'"
            @click="toggleCompletion(todo)"
          >
            <Icon :name="todo.completed ? 'uil:check-circle' : 'uil:circle'" />
          </button>
        </div>
      </div>
      <span
        v-if="!todo.editing"
        class="cursor-pointer text-sm text-wrap break-words text-white lowercase hover:text-gray-300"
        @click="editTodo(todo)"
      >
        {{ todo.body }}
      </span>
      <textarea
        v-if="todo.editing"
        v-model="todo.body"
        maxlength="100"
        class="resize-none bg-transparent text-sm text-white lowercase placeholder-white/60 focus:outline-none"
        @blur="saveTodo(todo)"
        @keydown.enter="saveTodo(todo)"
      />
      <div v-if="todo.editing" class="flex items-center justify-between">
        <span class="text-xs text-white/60">Press Enter to save</span>
        <span class="text-xs text-white/60">{{ todo.body.length }} / 100</span>
      </div>
    </div>
  </div>

  <ConfirmDialog
    v-model="showDeleteDialog"
    :title="todoToDelete?.deleted ? 'permanent delete' : 'delete todo'"
    :message="
      todoToDelete?.deleted
        ? 'this cannot be undone. delete forever?'
        : 'move this todo to deleted?'
    "
    :confirm-text="todoToDelete?.deleted ? 'delete forever' : 'delete'"
    @confirm="confirmDelete"
  />
</template>

<style scoped></style>
