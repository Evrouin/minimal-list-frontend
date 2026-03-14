<template>
  <div v-for="n in count" :key="n" class="mb-5 w-full animate-pulse">
    <div class="flex flex-col gap-2 rounded-lg bg-gray-800 p-5 shadow-md">
      <div class="flex items-center justify-between">
        <div class="h-4 w-1/3 rounded bg-gray-600" />
        <div class="flex gap-2">
          <div class="h-4 w-4 rounded bg-gray-600" />
          <div class="h-4 w-4 rounded bg-gray-600" />
        </div>
      </div>
      <div class="h-3 w-2/3 rounded bg-gray-600" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count?: number }>()
</script>
