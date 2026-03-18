<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTodoStore } from '~/stores/todos'

import type { NoteColor } from '~/types/todo'

const todoStore = useTodoStore()

const title = ref<string>('')
const body = ref<string>('')
const color = ref<NoteColor>('default')

const hasBody = computed(
  () =>
    body.value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim().length > 0
)
const isValidTodo = computed(
  () => title.value.trim().length > 0 && (hasBody.value || !!imageFile.value)
)

const errorMsg = ref('')
const submitting = ref(false)
const imageFile = ref<File | null>(null)
const imagePreview = ref('')

const onImageSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const compressed = await compressImage(file)
    imageFile.value = compressed
    imagePreview.value = URL.createObjectURL(compressed)
  }
}

const clearImage = () => {
  imageFile.value = null
  imagePreview.value = ''
}

const addTodo = async () => {
  if (!isValidTodo.value || submitting.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    if (imageFile.value) {
      const fd = new FormData()
      fd.append('title', title.value.toLowerCase())
      fd.append('body', body.value)
      fd.append('color', color.value)
      fd.append('image', imageFile.value)
      await todoStore.addTodo(fd)
    } else {
      await todoStore.addTodo({
        title: title.value.toLowerCase(),
        body: body.value,
        color: color.value,
      })
    }
    title.value = ''
    body.value = ''
    color.value = 'default'
    clearImage()
  } catch (e: unknown) {
    const msg = (e as Error)?.message || ''
    errorMsg.value = msg.includes('limit')
      ? 'note limit reached'
      : 'failed to add note'
  } finally {
    submitting.value = false
  }
}

defineExpose({ title, body, imageFile, imagePreview, color, clearImage })

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
        class="flex w-full flex-col gap-2 rounded-lg p-5 text-xs text-white shadow-md"
        :class="noteColors[color]?.bg || 'bg-gray-700'"
      >
        <ImagePreview v-if="imagePreview" :src="imagePreview" :padding="5" removable @remove="clearImage" />
        <input
          v-model="title"
          type="text"
          placeholder="title"
          maxlength="100"
          class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          @input="handleTitleInput"
        />
        <LazyTiptapEditor v-model="body" placeholder="body" @submit="addTodo" />
        <div class="flex items-center justify-between">
          <span v-if="errorMsg" class="text-xs text-red-400">{{ errorMsg }}</span>
          <ColorPicker v-else v-model="color" />
          <div class="flex items-center gap-1">
            <label class="cursor-pointer rounded px-2 py-0.5 mt-1 text-white/30 transition-colors hover:text-white/60">
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
