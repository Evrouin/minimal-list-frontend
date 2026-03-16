<script setup lang="ts">
defineProps<{ count?: number }>()
</script>

<template>
  <div class="columns-1 gap-5 lg:columns-2 xl:columns-3">
    <div v-for="n in count" :key="n" class="mb-5 inline-block w-full break-inside-avoid animate-pulse">
      <div class="rounded-lg bg-gray-800 p-5 shadow-md" :class="n % 3 === 0 ? 'min-h-[180px]' : 'min-h-[120px]'">
        <div class="flex items-center justify-between">
          <div class="h-4 w-1/3 rounded bg-gray-600" />
          <div class="flex gap-2">
            <div class="h-4 w-4 rounded-full bg-gray-600" />
            <div class="h-4 w-4 rounded-full bg-gray-600" />
          </div>
        </div>
        <div class="mt-3 space-y-2">
          <div class="h-3 w-full rounded bg-gray-600" />
          <div class="h-3 w-2/3 rounded bg-gray-600" />
          <div v-if="n % 3 === 0" class="h-3 w-1/2 rounded bg-gray-600" />
        </div>
      </div>
    </div>
  </div>
</template>
