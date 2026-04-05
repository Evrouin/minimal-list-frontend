<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTodoStore } from '~/stores/todos'

import type { NoteColor } from '~/types/todo'

const todoStore = useTodoStore()

const title = ref<string>('')
const body = ref<string>('')
const color = ref<NoteColor>('default')
const reminderAt = ref<string | null>(null)
const pinned = ref(false)

const hasBody = computed(
  () =>
    body.value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim().length > 0,
)
const audioFile = ref<File | null>(null)
const audioPreview = ref('')
const audioRecording = ref(false)
const isValidTodo = computed(
  () => title.value.trim().length > 0 && (hasBody.value || !!imageFile.value || !!audioFile.value) && !audioRecording.value,
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

const clearAudio = () => {
  audioFile.value = null
  audioPreview.value = ''
}

const { fetchPreviews } = useLinkPreviews()

const addTodo = async () => {
  if (!isValidTodo.value || submitting.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const previews = await fetchPreviews(body.value, [])
    if (imageFile.value || audioFile.value) {
      const fd = new FormData()
      fd.append('title', title.value.toLowerCase())
      fd.append('body', body.value)
      fd.append('color', color.value)
      if (pinned.value) fd.append('pinned', 'true')
      if (reminderAt.value) fd.append('reminder_at', reminderAt.value)
      if (imageFile.value) fd.append('image', imageFile.value)
      if (audioFile.value) fd.append('audio', audioFile.value)
      if (previews.length) fd.append('link_previews', JSON.stringify(previews))
      await todoStore.addTodo(fd)
    } else {
      await todoStore.addTodo({
        title: title.value.toLowerCase(),
        body: body.value,
        color: color.value,
        pinned: pinned.value,
        reminder_at: reminderAt.value,
        link_previews: previews,
      })
    }
    title.value = ''
    body.value = ''
    color.value = 'default'
    reminderAt.value = null
    pinned.value = false
    clearImage()
    clearAudio()
    expanded.value = false
  } catch (e: unknown) {
    const msg = (e as Error)?.message || ''
    errorMsg.value = msg.includes('limit') ? 'note limit reached' : 'failed to add note'
  } finally {
    submitting.value = false
  }
}

const expanded = ref(false)
const focused = ref(false)

defineExpose({ title, body, imageFile, imagePreview, color, reminderAt, pinned, audioFile, audioPreview, expanded, clearImage, clearAudio })

const handleTitleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.value = input.value.toLowerCase()
  title.value = input.value
}
</script>

<template>
  <!-- Compact form -->
  <form v-if="!expanded" @submit.prevent="addTodo">
    <div class="mb-5 flex items-center justify-center">
      <div class="flex w-full flex-col gap-2 rounded-lg p-5 text-xs text-white shadow-md" :class="noteColors[color]?.bg || 'bg-gray-700'">
        <ImagePreview v-if="imagePreview" :src="imagePreview" :padding="5" removable @remove="clearImage" />
        <input
          v-model="title"
          type="text"
          placeholder="title"
          maxlength="100"
          class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          @input="handleTitleInput"
          @focus="focused = true"
          @blur="focused = false"
        />
        <LazyTiptapEditor v-model="body" placeholder="body" @submit="addTodo" @focus="focused = true" @blur="focused = false" />
        <AudioPlayer v-if="audioPreview" :src="audioPreview" removable @remove="clearAudio" />
        <div class="flex items-center justify-between">
          <span v-if="errorMsg" class="text-xs text-red-400">{{ errorMsg }}</span>
          <ColorPicker v-else v-model="color" />
          <div class="flex items-center gap-1">
            <ReminderPicker v-if="!audioRecording" v-model="reminderAt" />
            <button v-if="!audioRecording" type="button" class="cursor-pointer rounded px-2 py-0.5 transition-colors" :class="pinned ? 'text-blue-400' : 'text-white/30 hover:text-white/60'" @click="pinned = !pinned">
              <Icon name="mdi:pin" class="text-xs" />
            </button>
            <AudioRecorder
              @recorded="
                (f, u) => {
                  audioFile = f
                  audioPreview = u
                }
              "
              @update:recording="(v) => (audioRecording = v)"
            />
            <template v-if="!audioRecording">
              <label class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60">
                <Icon name="uil:image" class="text-xs" />
                <input type="file" accept="image/*" class="hidden" @change="onImageSelect" />
              </label>
              <button
                v-if="focused || title || hasBody"
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60"
                @click="expanded = true"
              >
                <Icon name="uil:expand-arrows-alt" class="text-xs" />
              </button>
              <button
                type="submit"
                :disabled="!isValidTodo"
                class="-mt-0.5 cursor-pointer rounded px-2 py-0.5 text-xs transition-colors"
                :class="isValidTodo ? 'text-white/60 hover:text-white' : 'text-white/20'"
              >
                add
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </form>

  <!-- Expanded fullscreen -->
  <Teleport to="body">
    <div v-if="expanded" class="fixed inset-0 z-50 flex flex-col bg-gray-800 p-3">
      <form
        class="flex flex-1 flex-col gap-3 rounded-lg p-5 text-xs text-white"
        :class="noteColors[color]?.bg || 'bg-gray-700'"
        @submit.prevent="addTodo"
      >
        <ImagePreview v-if="imagePreview" :src="imagePreview" :padding="5" removable @remove="clearImage" />
        <input
          v-model="title"
          type="text"
          placeholder="title"
          maxlength="100"
          class="border-b border-white/20 bg-transparent text-sm placeholder-white/60 focus:outline-none"
          @input="handleTitleInput"
        />
        <div class="flex-1 overflow-y-auto">
          <LazyTiptapEditor v-model="body" placeholder="body" @submit="addTodo" />
        </div>
        <AudioPlayer v-if="audioPreview" :src="audioPreview" removable @remove="clearAudio" />
        <div class="flex items-center justify-between">
          <span v-if="errorMsg" class="text-xs text-red-400">{{ errorMsg }}</span>
          <ColorPicker v-else v-model="color" />
          <div class="flex items-center gap-1">
            <template v-if="!audioRecording">
              <ReminderPicker v-model="reminderAt" />
              <button type="button" class="cursor-pointer rounded px-2 py-0.5 transition-colors" :class="pinned ? 'text-blue-400' : 'text-white/30 hover:text-white/60'" @click="pinned = !pinned">
                <Icon name="mdi:pin" class="text-xs" />
              </button>
            </template>
            <AudioRecorder
              @recorded="
                (f, u) => {
                  audioFile = f
                  audioPreview = u
                }
              "
              @update:recording="(v) => (audioRecording = v)"
            />
            <template v-if="!audioRecording">
              <label class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60">
                <Icon name="uil:image" class="text-xs" />
                <input type="file" accept="image/*" class="hidden" @change="onImageSelect" />
              </label>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60"
                @click="expanded = false"
              >
                <Icon name="uil:compress-arrows" class="text-xs" />
              </button>
              <button
                type="submit"
                :disabled="!isValidTodo"
                class="-mt-0.5 cursor-pointer rounded px-2 py-0.5 text-xs transition-colors"
                :class="isValidTodo ? 'text-white/60 hover:text-white' : 'text-white/20'"
              >
                add
              </button>
            </template>
          </div>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<style scoped></style>
