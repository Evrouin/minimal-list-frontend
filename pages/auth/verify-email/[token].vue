<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const token = route.params.token as string
const message = ref('')
const isError = ref(false)

onMounted(async () => {
  try {
    const res = await authStore.verifyEmail(token)
    message.value = res.message || 'email verified successfully.'
  } catch {
    isError.value = true
    message.value = 'invalid or expired verification link.'
  }
})
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-[20vh]">
    <div class="w-full max-w-lg px-4">
      <PageHeader title="email verification">
        <NuxtLink to="/auth/login" class="text-sm text-white/60 lowercase hover:text-white">login</NuxtLink>
      </PageHeader>

      <div class="rounded-lg bg-gray-700 p-5">
        <div v-if="!message" class="text-sm text-white/40">verifying...</div>
        <div
          v-else
          class="rounded-lg px-3 py-2 text-sm"
          :class="isError ? 'bg-red-500/10 text-red-300' : 'bg-green-500/10 text-green-300'"
        >
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>
