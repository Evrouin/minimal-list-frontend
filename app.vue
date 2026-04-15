<script setup lang="ts">
const config = useRuntimeConfig()
const apiOrigin = config.public.authApiBase ? new URL(String(config.public.authApiBase)).origin : ''

useHead({
  link: [...(apiOrigin ? [{ rel: 'preconnect', href: apiOrigin }] : []), { rel: 'manifest', href: '/manifest.json' }],
})

const authStore = useAuthStore()
const folderStore = useFolderStore()

watch(
  () => authStore.isAuthenticated,
  async (authed) => {
    if (authed && !folderStore.folders.length) await folderStore.fetchFolders()
  },
  { immediate: true },
)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
