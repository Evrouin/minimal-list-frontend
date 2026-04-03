<script setup lang="ts">
const props = defineProps<{ src: string; removable?: boolean }>()
const emit = defineEmits<{ remove: []; 'audio-interact': [value: boolean] }>()

const config = useRuntimeConfig()
const cdnUrl = config.public.cdnUrl as string
const fallbackUrl = config.public.cdnFallbackUrl as string
const audioSrc = ref(props.src)

watch(() => props.src, (v) => { audioSrc.value = v })

const onAudioError = () => {
  if (cdnUrl && fallbackUrl && audioSrc.value.includes(cdnUrl)) {
    audioSrc.value = audioSrc.value.replace(cdnUrl, fallbackUrl)
  }
}

const audio = ref<HTMLAudioElement>()
const playing = ref(false)
const currentTime = ref(0)
const totalDuration = ref(0)

const toggle = async () => {
  if (!audio.value) return
  try {
    if (playing.value) audio.value.pause()
    else await audio.value.play()
  } catch {
    // Source not available — fallback may be loading
  }
}

const onTimeUpdate = () => {
  if (audio.value) currentTime.value = audio.value.currentTime
}
const onLoaded = () => {
  if (audio.value) totalDuration.value = audio.value.duration
}
const onEnded = () => {
  playing.value = false
  emit('audio-interact', false)
  currentTime.value = 0
}

const progress = computed(() => (totalDuration.value ? (currentTime.value / totalDuration.value) * 100 : 0))

const formatTime = (s: number) => {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

const seek = (e: MouseEvent | TouchEvent) => {
  if (!audio.value || !totalDuration.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  audio.value.currentTime = pct * totalDuration.value
}
</script>

<template>
  <div data-audio-player class="audio-player flex items-center gap-2" @click.stop @mouseenter.stop @mouseleave.stop @touchstart.stop="emit('audio-interact', true)" @touchend.stop="!playing && emit('audio-interact', false)" @touchmove.stop>
    <audio
      ref="audio"
      :src="audioSrc"
      preload="metadata"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoaded"
      @play="playing = true; emit('audio-interact', true)"
      @pause="playing = false; emit('audio-interact', false)"
      @ended="onEnded"
      @error="onAudioError"
    />
    <button type="button" class="cursor-pointer text-white/60 hover:text-white" @mousedown.prevent @click.stop.prevent="toggle">
      <Icon :name="playing ? 'uil:pause' : 'uil:play'" class="text-sm" />
    </button>
    <div class="flex flex-1 cursor-pointer items-center gap-2" @click="seek" @touchstart.passive="seek">
      <div class="relative h-1 flex-1 rounded-full bg-white/10">
        <div class="absolute top-0 left-0 h-full rounded-full bg-blue-400" :style="{ width: `${progress}%` }" />
      </div>
    </div>
    <span class="shrink-0 text-xs text-white/30">{{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}</span>
    <button v-if="props.removable" type="button" class="cursor-pointer text-xs text-red-400 hover:text-red-300" @mousedown.prevent @click="emit('remove')">
      ✕
    </button>
  </div>
</template>
