<script setup lang="ts">
const config = useRuntimeConfig()
const apiOrigin = config.public.authApiBase
  ? new URL(String(config.public.authApiBase)).origin
  : ''

useHead({
  title: 'minimal list',
  link: [
    { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    ...(apiOrigin ? [{ rel: 'preconnect', href: apiOrigin }] : []),
    { rel: 'manifest', href: '/manifest.json' },
  ],
  meta: [
    { name: 'description', content: 'minimalist note-taking app with rich text and task lists.' },
    { property: 'og:title', content: 'minimal list' },
    { property: 'og:description', content: 'minimalist note-taking app with rich text and task lists.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://minimalist-todo-smoky.vercel.app' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'minimal list' },
    { name: 'twitter:description', content: 'minimalist note-taking app with rich text and task lists.' },
    { name: 'theme-color', content: '#1f2937' },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style scoped></style>
