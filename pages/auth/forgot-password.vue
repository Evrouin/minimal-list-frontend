<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const successMsg = ref('')
const errorMsg = ref('')

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const res = await authStore.requestPasswordReset({ email: email.value })
    successMsg.value = res.message || 'if the email exists, a reset link has been sent.'
  } catch {
    errorMsg.value = 'something went wrong. try again.'
  }
}
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800"
  >
    <div class="w-full max-w-lg px-4">
      <div class="mx-auto flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">
          forgot password
        </h1>
      </div>

      <form @submit.prevent="handleSubmit">
        <div
          class="flex w-full flex-col gap-3 rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
        >
          <input
            v-model="email"
            type="email"
            placeholder="email"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />

          <span v-if="errorMsg" class="text-xs text-red-300">{{
            errorMsg
          }}</span>
          <span v-if="successMsg" class="text-xs text-green-300">{{
            successMsg
          }}</span>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="mt-2 cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-white lowercase transition-all duration-200 hover:bg-gray-600 disabled:opacity-50"
          >
            {{ authStore.loading ? 'sending...' : 'send reset link' }}
          </button>
        </div>
      </form>

      <div class="mt-4 flex justify-center">
        <NuxtLink
          to="/auth/login"
          class="text-sm text-white/60 lowercase hover:text-white"
        >
          back to login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
