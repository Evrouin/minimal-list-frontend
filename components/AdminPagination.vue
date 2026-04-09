<script setup lang="ts">
defineProps<{
  page: number
  totalPages: number
  totalCount: number
  label: string
}>()
const emit = defineEmits<{ 'update:page': [page: number] }>()
</script>

<template>
  <div v-if="totalPages > 1" class="mt-4 flex items-center justify-end pb-4 text-xs sm:pb-0">
    <div class="flex items-center gap-2">
      <button
        :disabled="page === 1"
        class="rounded px-3 py-1 text-white/60 transition-colors hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        @click="emit('update:page', page - 1)"
      >
        prev
      </button>
      <span class="text-white/60">{{ page }} / {{ totalPages }}</span>
      <button
        :disabled="page === totalPages"
        class="rounded px-3 py-1 text-white/60 transition-colors hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        @click="emit('update:page', page + 1)"
      >
        next
      </button>
    </div>
  </div>
</template>
