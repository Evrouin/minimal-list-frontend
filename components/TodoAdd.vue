<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTodoStore } from '~/stores/todos'

const todoStore = useTodoStore()

const title = ref<string>('')
const body = ref<string>('')

const isValidTodo = computed(
  () => title.value.trim().length > 0 && body.value.trim().length > 0
)

const addTodo = () => {
  if (!isValidTodo.value) return

  const todo = {
    id: Date.now(),
    title: title.value.toLowerCase(),
    body: body.value.toLowerCase(),
    completed: false,
    deleted: false,
    editing: false,
  }

  todoStore.addTodo(todo)

  title.value = ''
  body.value = ''

  setTimeout(() => {
    title.value = ''
    body.value = ''
  }, 100)
}

const handleTitleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.value = input.value.toLowerCase()
  title.value = input.value
}

const handleBodyInput = (event: Event) => {
  const input = event.target as HTMLTextAreaElement
  input.value = input.value.toLowerCase()
  body.value = input.value
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <div class="mb-5 flex items-center justify-center">
      <div
        class="flex w-full flex-col gap-2 rounded-lg bg-gray-500 p-2 text-sm text-white shadow-md"
      >
        <input
          v-model="title"
          type="text"
          placeholder="title"
          maxlength="100"
          class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          @input="handleTitleInput"
        />
        <textarea
          v-model="body"
          placeholder="body"
          maxlength="100"
          class="resize-none bg-transparent placeholder-white/60 focus:outline-none"
          @input="handleBodyInput"
          @keydown.enter="addTodo"
        />
        <div class="flex items-center justify-between">
          <span v-if="body.length > 0" class="text-xs text-white/60"
            >Press Enter</span
          >
          <span v-if="body.length > 0" class="text-xs text-white/60"
            >{{ body.length }} / 100</span
          >
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped></style>
