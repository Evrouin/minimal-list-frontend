<template>
  <div class="flex items-center justify-between p-4">
    <h1 class="text-xl font-bold text-white lowercase sm:text-2xl">{{ title }}</h1>
    <div class="flex items-center gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
