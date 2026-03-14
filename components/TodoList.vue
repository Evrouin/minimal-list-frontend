<script setup lang="ts">
import { ref } from 'vue'
import type { Todo } from '@/types'
import { useTodoStore } from '~/stores/todos'
import { storeToRefs } from 'pinia'

const todoStore = useTodoStore()
const isTodoEmptyMessage = ref('No todos available')

const { filteredTodos } = storeToRefs(todoStore)

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

const deleteTodo = async (todo: Todo) => {
  await todoStore.deleteTodo(todo.id, todo.deleted)
}
</script>

<template>
  <div
    v-if="filteredTodos.length === 0"
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
            @click="deleteTodo(todo)"
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
</template>

<style scoped></style>
