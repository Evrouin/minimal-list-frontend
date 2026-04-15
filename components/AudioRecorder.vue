<script setup lang="ts">
const emit = defineEmits<{
  'recorded': [file: File, url: string]
  'update:recording': [value: boolean]
}>()

const recording = ref(false)
const loading = ref(false)
const duration = ref(0)
let mediaRecorder: MediaRecorder | null = null
let chunks: Blob[] = []
let timer: ReturnType<typeof setInterval> | null = null

const start = async () => {
  loading.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    let supportedMime = ''
    if (MediaRecorder.isTypeSupported('audio/webm')) supportedMime = 'audio/webm'
    else if (MediaRecorder.isTypeSupported('audio/mp4')) supportedMime = 'audio/mp4'
    mediaRecorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined)
    chunks = []
    duration.value = 0

    const finalMime = mediaRecorder.mimeType || 'audio/webm'
    const ext = finalMime.includes('mp4') ? 'm4a' : 'webm'

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunks, { type: finalMime })
      const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: finalMime })
      const url = URL.createObjectURL(blob)
      emit('recorded', file, url)
    }

    mediaRecorder.start()
    recording.value = true
    emit('update:recording', true)
    timer = setInterval(() => {
      duration.value++
    }, 1000)
  } catch {
    // Permission denied or not available
  } finally {
    loading.value = false
  }
}

const stop = () => {
  mediaRecorder?.stop()
  recording.value = false
  emit('update:recording', false)
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

defineExpose({ recording, stop })

const toggle = () => {
  if (loading.value) return
  if (recording.value) {
    stop()
  } else {
    start()
  }
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
</script>

<template>
  <button
    type="button"
    class="cursor-pointer rounded px-2 py-0.5 transition-colors"
    :class="[
      loading ? 'text-white/20' : recording ? 'text-red-400' : 'text-white/30 hover:text-white/60',
      recording && 'inline-flex items-center',
    ]"
    :disabled="loading"
    @mousedown.prevent
    @click="toggle"
  >
    <Icon v-if="loading" name="uil:spinner-alt" class="animate-spin text-xs" />
    <Icon v-else :name="recording ? 'uil:stop-circle' : 'uil:microphone'" class="text-xs" />
    <span v-if="recording" class="ml-1 text-xs leading-none">{{ formatTime(duration) }}</span>
  </button>
</template>
