<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const api = useAuthApi()
const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')

onMounted(async () => {
  try {
    const res = await api.unlockAccount(route.params.token as string)
    status.value = 'success'
    message.value = res.message?.toLowerCase() || 'account unlocked.'
  } catch {
    status.value = 'error'
    message.value = 'invalid or expired link.'
  }
})
</script>

<template>
  <div class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800">
    <div class="w-full max-w-sm px-4">
      <div class="rounded-lg bg-gray-700 p-6 text-center">
        <div v-if="status === 'loading'" class="text-sm text-white/40">unlocking account...</div>
        <template v-else>
          <Icon
            :name="status === 'success' ? 'uil:check-circle' : 'uil:exclamation-triangle'"
            class="mb-3 text-3xl"
            :class="status === 'success' ? 'text-green-400' : 'text-red-400'"
          />
          <p class="mb-4 text-sm text-white/70">{{ message }}</p>
          <NuxtLink
            to="/auth/login"
            class="inline-block rounded-lg bg-gray-600 px-4 py-2 text-xs text-white lowercase hover:bg-gray-500"
          >
            go to login
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>
