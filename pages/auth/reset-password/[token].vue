<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const form = reactive({
  token: (route.params.token as string) || '',
  new_password: '',
  new_password2: '',
})
const successMsg = ref('')
const errorMsg = ref('')

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (form.new_password !== form.new_password2) {
    errorMsg.value = "passwords don't match"
    return
  }

  try {
    const res = await authStore.confirmPasswordReset(form)
    successMsg.value = res.message || 'password reset successfully.'
  } catch {
    errorMsg.value = 'invalid or expired token.'
  }
}
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800"
  >
    <div class="w-full max-w-lg px-4">
      <div class="mx-auto flex min-w-md items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">reset password</h1>
      </div>

      <form @submit.prevent="handleSubmit">
        <div
          class="flex w-full flex-col gap-3 rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
        >
          <input
            v-model="form.new_password"
            type="password"
            placeholder="new password"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="form.new_password2"
            type="password"
            placeholder="confirm new password"
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
            {{ authStore.loading ? 'resetting...' : 'reset password' }}
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
