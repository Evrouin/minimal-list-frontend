<script setup lang="ts">
defineProps<{
  title: string
  linkTo: string
  linkLabel: string
}>()
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col bg-gray-800">
    <div class="flex flex-1 items-center justify-center px-4 pt-10 pb-16">
      <div class="flex w-full max-w-md items-center justify-center sm:max-w-3xl sm:gap-12">
        <!-- Logo (hidden on mobile) -->
        <div class="hidden flex-col items-center justify-center sm:flex sm:flex-1">
          <img src="~/assets/logo.png" alt="minimal list" class="w-full opacity-60" >
          <p class="mt-4 text-center text-white">
            <span class="text-md font-bold">notes, simplified.</span>
            <br >
            <span class="text-xs text-white/50">write, record, remember.</span>
          </p>
        </div>
        <!-- Form -->
        <div class="w-full max-w-md">
          <div class="mb-4 grid grid-cols-2 items-center px-1">
            <NuxtLink to="/" class="flex items-center gap-2">
              <img src="~/assets/logo.png" alt="minimal list" class="h-6 w-6 sm:hidden" >
              <span class="text-lg font-bold text-white lowercase hover:text-white/80">minimal list</span>
            </NuxtLink>
            <NuxtLink :to="linkTo" class="text-right text-xs text-white/40 lowercase hover:text-white/60">{{ linkLabel }}</NuxtLink>
          </div>
          <div class="rounded-lg bg-gray-700 p-7">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
