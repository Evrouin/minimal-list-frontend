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
  <div
    class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800"
  >
    <div class="w-full max-w-lg px-4">
      <div class="mx-auto flex min-w-md items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">
          email verification
        </h1>
      </div>

      <div
        class="flex w-full flex-col gap-3 rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
      >
        <span :class="isError ? 'text-red-300' : 'text-green-300'">
          {{ message || 'verifying...' }}
        </span>
      </div>

      <div class="mt-4 flex justify-center">
        <NuxtLink
          to="/auth/login"
          class="text-sm text-white/60 lowercase hover:text-white"
        >
          go to login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
