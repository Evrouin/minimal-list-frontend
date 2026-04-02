<script setup lang="ts">
const props = defineProps<{ src: string; removable?: boolean }>()
const emit = defineEmits<{ remove: [] }>()

const audio = ref<HTMLAudioElement>()
const playing = ref(false)
const currentTime = ref(0)
const totalDuration = ref(0)

const toggle = () => {
  if (!audio.value) return
  if (playing.value) audio.value.pause()
  else audio.value.play()
}

const onTimeUpdate = () => {
  if (audio.value) currentTime.value = audio.value.currentTime
}
const onLoaded = () => {
  if (audio.value) totalDuration.value = audio.value.duration
}
const onEnded = () => {
  playing.value = false
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
  <div class="flex items-center gap-2" @click.stop @touchstart.stop @touchend.stop>
    <audio
      ref="audio"
      :src="props.src"
      preload="metadata"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoaded"
      @play="playing = true"
      @pause="playing = false"
      @ended="onEnded"
    />
    <button type="button" class="cursor-pointer text-white/60 hover:text-white" @click="toggle">
      <Icon :name="playing ? 'uil:pause' : 'uil:play'" class="text-sm" />
    </button>
    <div class="flex flex-1 cursor-pointer items-center gap-2" @click="seek" @touchstart.passive="seek">
      <div class="relative h-1 flex-1 rounded-full bg-white/10">
        <div class="absolute top-0 left-0 h-full rounded-full bg-blue-400" :style="{ width: `${progress}%` }" />
      </div>
    </div>
    <span class="shrink-0 text-xs text-white/30">{{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}</span>
    <button v-if="props.removable" type="button" class="cursor-pointer text-xs text-red-400 hover:text-red-300" @click="emit('remove')">
      ✕
    </button>
  </div>
</template>
