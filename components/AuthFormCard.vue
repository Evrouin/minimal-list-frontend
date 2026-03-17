<script setup lang="ts">
defineProps<{
  title: string
  linkTo: string
  linkLabel: string
}>()
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-[20vh]">
    <div class="w-full max-w-lg px-4">
      <PageHeader :title="title">
        <NuxtLink :to="linkTo" class="text-sm text-white/60 lowercase hover:text-white">{{ linkLabel }}</NuxtLink>
      </PageHeader>
      <div class="rounded-lg bg-gray-700 p-5">
        <slot />
      </div>
    </div>
  </div>
</template>
