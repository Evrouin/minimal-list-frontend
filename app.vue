<script setup lang="ts">
const config = useRuntimeConfig()
const apiOrigin = config.public.authApiBase
  ? new URL(String(config.public.authApiBase)).origin
  : ''

useHead({
  link: [
    ...(apiOrigin ? [{ rel: 'preconnect', href: apiOrigin }] : []),
    { rel: 'manifest', href: '/manifest.json' },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
