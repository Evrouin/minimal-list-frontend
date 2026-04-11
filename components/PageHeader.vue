<template>
  <div class="flex h-[74.5px] items-center justify-between py-4">
    <div class="flex items-center gap-2">
      <slot name="prepend" />
      <h1 class="text-lg font-bold text-white lowercase sm:text-xl">{{ title }}</h1>
    </div>
    <div class="flex items-center gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
