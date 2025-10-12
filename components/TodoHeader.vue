<script setup>
defineProps({
  title: {
    type: String,
    default: 'todos',
  },
})
</script>

<template>
  <div
    class="mx-auto flex min-w-md items-center justify-between p-4 text-white"
  >
    <h1 class="text-2xl font-bold lowercase">{{ title }}</h1>
  </div>
</template>
