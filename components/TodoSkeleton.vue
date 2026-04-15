<script setup lang="ts">
defineProps<{ count?: number }>()
</script>

<template>
  <div class="columns-1 gap-5 lg:columns-2 xl:columns-3">
    <div v-for="n in count" :key="n" class="mb-5 inline-block w-full animate-pulse break-inside-avoid">
      <div class="border-0.5 max-h-75 min-h-30 rounded-lg bg-gray-700 p-5 shadow-md lg:max-h-100" :class="n % 3 === 0 ? 'min-h-45' : ''">
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
        <div class="mt-auto pt-3">
          <div class="h-2.5 w-16 rounded bg-gray-600" />
        </div>
      </div>
    </div>
  </div>
</template>
