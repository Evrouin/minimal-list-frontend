<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTodoStore } from '~/stores/todos'

const todoStore = useTodoStore()

const title = ref<string>('')
const body = ref<string>('')

const hasBody = computed(
  () => body.value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0,
)
const isValidTodo = computed(
  () => title.value.trim().length > 0 && hasBody.value,
)

const addTodo = async () => {
  if (!isValidTodo.value) return

  await todoStore.addTodo({
    title: title.value.toLowerCase(),
    body: body.value,
  })

  title.value = ''
  body.value = ''
}

const handleTitleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.value = input.value.toLowerCase()
  title.value = input.value
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
        <TiptapEditor v-model="body" placeholder="body" @submit="addTodo" />
        <div class="flex items-center justify-between">
          <span class="text-xs text-white/60">
            ⌘/ctrl + enter to add
          </span>
          <button
            type="submit"
            :disabled="!isValidTodo"
            class="cursor-pointer rounded px-2 py-0.5 text-xs transition-colors"
            :class="isValidTodo ? 'text-white/60 hover:text-white' : 'text-white/20'"
          >
            add
          </button>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped></style>
