<script setup lang="ts">
import type { NoteColor } from '~/types/todo'

const model = defineModel<NoteColor>({ default: 'default' })
const open = ref(false)

const colors: { name: NoteColor; hex: string }[] = [
  { name: 'default', hex: '#374151' },
  { name: 'red', hex: '#3b1219' },
  { name: 'yellow', hex: '#3d3419' },
  { name: 'green', hex: '#1c3a2a' },
  { name: 'purple', hex: '#3d1f3d' },
]

const currentHex = computed(() => colors.find((c) => c.name === model.value)?.hex ?? colors[0].hex)

const pick = (color: NoteColor) => {
  model.value = color
  open.value = false
}
</script>

<template>
  <div class="relative flex items-center">
    <button type="button" class="h-5 w-5 cursor-pointer rounded-full border border-white/20" :style="{ backgroundColor: currentHex }" @click.stop="open = !open" />
    <Transition name="fade">
      <div v-show="open" class="ml-1 flex items-center gap-1">
        <button
          v-for="c in colors"
          :key="c.name"
          type="button"
          class="h-5 w-5 cursor-pointer rounded-full border transition-transform hover:scale-110"
          :class="model === c.name ? 'border-white' : 'border-white/20'"
          :style="{ backgroundColor: c.hex }"
          @click.stop="pick(c.name)"
        />
      </div>
    </Transition>
  </div>
</template>
