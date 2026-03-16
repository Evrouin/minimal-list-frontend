<script setup>
defineProps({
  title: {
    type: String,
    default: 'todos',
  },
})
</script>

<template>
  <div class="flex items-center p-4 text-white">
    <h1 class="text-xl font-bold lowercase sm:text-2xl">{{ title }}</h1>
  </div>
</template>
