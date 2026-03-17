<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTodoStore } from '~/stores/todos'

const todoStore = useTodoStore()

const title = ref<string>('')
const body = ref<string>('')

const hasBody = computed(
  () =>
    body.value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim().length > 0
)
const isValidTodo = computed(
  () => title.value.trim().length > 0 && hasBody.value
)

const errorMsg = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref('')

const onImageSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const clearImage = () => {
  imageFile.value = null
  imagePreview.value = ''
}

const addTodo = async () => {
  if (!isValidTodo.value) return
  errorMsg.value = ''
  try {
    if (imageFile.value) {
      const fd = new FormData()
      fd.append('title', title.value.toLowerCase())
      fd.append('body', body.value)
      fd.append('image', imageFile.value)
      await todoStore.addTodo(fd)
    } else {
      await todoStore.addTodo({
        title: title.value.toLowerCase(),
        body: body.value,
      })
    }
    title.value = ''
    body.value = ''
    clearImage()
  } catch (e: unknown) {
    const msg = (e as Error)?.message || ''
    errorMsg.value = msg.includes('limit')
      ? 'note limit reached'
      : 'failed to add note'
  }
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
        class="flex w-full flex-col gap-2 rounded-lg bg-gray-500 p-2 text-xs text-white shadow-md"
      >
        <input
          v-model="title"
          type="text"
          placeholder="title"
          maxlength="100"
          class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          @input="handleTitleInput"
        />
        <LazyTiptapEditor v-model="body" placeholder="body" @submit="addTodo" />
        <div v-if="imagePreview" class="relative">
          <img :src="imagePreview" class="h-32 w-full rounded object-cover" />
          <button type="button" class="absolute top-1 right-1 cursor-pointer rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70" @click="clearImage">
            <Icon name="uil:times" class="text-xs" />
          </button>
        </div>
        <div class="flex items-center justify-end sm:justify-between">
          <span v-if="errorMsg" class="text-xs text-red-400">{{
            errorMsg
          }}</span>
          <span v-else class="hidden text-xs text-white/60 sm:inline"
            >⌘/ctrl + enter to add</span
          >
          <div class="flex items-center gap-1">
            <label class="cursor-pointer rounded p-1 text-white/30 transition-colors hover:text-white/60">
              <Icon name="uil:image" class="text-xs" />
              <input type="file" accept="image/*" class="hidden" @change="onImageSelect" />
            </label>
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
    </div>
  </form>
</template>

<style scoped></style>
