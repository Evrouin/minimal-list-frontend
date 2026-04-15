<script setup lang="ts">
import type { NoteColor } from '~/types/todo'

const model = defineModel<NoteColor>({ default: 'default' })
const open = ref(false)
const { theme } = useTheme()

const darkHex: Record<NoteColor, string> = { default: '#374151', red: '#3b1219', yellow: '#3d3419', green: '#1c3a2a', purple: '#3d1f3d' }
const lightHex: Record<NoteColor, string> = { default: '#FFFFFF', red: '#FCE8E6', yellow: '#FEF7E0', green: '#E6F4EA', purple: '#F3E8FD' }

const colors = computed(() =>
  (['default', 'red', 'yellow', 'green', 'purple'] as NoteColor[]).map((name) => ({
    name,
    hex: theme.value === 'light' ? lightHex[name] : darkHex[name],
  })),
)

const currentHex = computed(() => colors.value.find((c) => c.name === model.value)?.hex ?? colors.value[0]!.hex)

const pick = (color: NoteColor) => {
  model.value = color
  open.value = false
}
</script>

<template>
  <div class="relative flex items-center">
    <button
      type="button"
      class="h-5 w-5 cursor-pointer rounded-full border border-white/20"
      :style="{ backgroundColor: currentHex }"
      @click.stop="open = !open"
      @mousedown.prevent
    />
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
          @mousedown.prevent
        />
      </div>
    </Transition>
  </div>
</template>
