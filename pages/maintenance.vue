<script setup lang="ts">
definePageMeta({ layout: false })

const config = useRuntimeConfig()
const baseUrl = (config.public.authApiBase as string).replace('/api/auth', '')

const check = async () => {
  try {
    await $fetch(`${baseUrl}/health/`)
    clearInterval(poll)
    navigateTo('/')
  } catch { /* server still down */ }
}

const poll = setInterval(check, 30000)
check()

onUnmounted(() => clearInterval(poll))
</script>

<template>
  <div class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800">
    <div class="w-full max-w-lg px-4">
      <div class="flex flex-col gap-3 rounded-lg bg-gray-500 p-5 text-sm text-white shadow-md">
        <span class="text-2xl font-bold lowercase">
          <Icon name="uil:wrench" class="mr-1" />
          under maintenance
        </span>
        <span class="text-white/60 lowercase">we'll be back shortly — this page checks automatically every 30 seconds.</span>
      </div>
    </div>
  </div>
</template>
