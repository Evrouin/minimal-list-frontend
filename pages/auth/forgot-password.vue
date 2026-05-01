<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const successMsg = ref('')
const errorMsg = ref('')

const loading = ref(false)

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true
  try {
    const res = await authStore.requestPasswordReset({ email: email.value })
    successMsg.value = res.message || 'if the email exists, a reset link has been sent.'
  } catch {
    errorMsg.value = 'something went wrong. try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthFormCard title="forgot password" link-to="/auth/login" link-label="login">
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="forgot-email" class="mb-1 block text-xs text-white/40">email</label>
        <input
          id="forgot-email"
          v-model="email"
          type="email"
          placeholder="user@example.com"
          class="w-full rounded-lg bg-gray-600 px-3 py-4 text-xs text-white placeholder-white/30 focus:outline-none md:py-2"
        />
      </div>

      <div v-if="errorMsg" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ errorMsg }}</div>
      <div v-if="successMsg" class="mt-4 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{{ successMsg }}</div>

      <button
        type="submit"
        :disabled="loading"
        class="mt-5 w-full cursor-pointer rounded-lg bg-gray-600 px-4 py-4 text-xs text-white lowercase transition-colors hover:bg-gray-500 disabled:opacity-50 md:py-2.5"
      >
        <Icon v-if="loading" name="uil:spinner-alt" class="animate-spin" />
        <span v-else>send reset link</span>
      </button>
    </form>
  </AuthFormCard>
</template>
