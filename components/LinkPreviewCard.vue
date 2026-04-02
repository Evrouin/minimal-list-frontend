<script setup lang="ts">
import type { LinkPreview } from '~/types/todo'

defineProps<{ preview: LinkPreview }>()
const emit = defineEmits<{ remove: [] }>()
</script>

<template>
  <a
    :href="preview.url"
    target="_blank"
    rel="noopener noreferrer"
    class="group flex gap-3 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
    @click.stop
  >
    <img
      v-if="preview.image"
      :src="preview.image"
      class="h-14 w-14 shrink-0 rounded object-cover"
      @error="($event.target as HTMLImageElement).style.display = 'none'"
    />
    <div v-else class="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-white/10">
      <Icon name="uil:link" class="text-lg text-white/30" />
    </div>
    <div class="min-w-0 flex-1 overflow-hidden">
      <p class="truncate text-xs font-medium text-white">{{ preview.title || preview.domain }}</p>
      <p v-if="preview.description" class="line-clamp-2 text-xs leading-snug text-white/40">{{ preview.description }}</p>
      <p class="mt-0.5 text-xs text-white/25">{{ preview.domain }}</p>
    </div>
    <button
      type="button"
      class="shrink-0 self-start text-xs text-white/20 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white/50"
      @click.prevent.stop="emit('remove')"
    >
      ✕
    </button>
  </a>
</template>
