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
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-[20vh]">
    <div class="w-full max-w-lg px-4">
      <PageHeader title="reset password">
        <NuxtLink to="/auth/login" class="text-sm text-white/60 lowercase hover:text-white">login</NuxtLink>
      </PageHeader>

      <form class="rounded-lg bg-gray-700 p-5" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs text-white/40">new password</label>
            <input
              v-model="form.new_password"
              type="password"
              placeholder="min 8 characters"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-white/40">confirm password</label>
            <input
              v-model="form.new_password2"
              type="password"
              placeholder="confirm password"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ errorMsg }}</div>
        <div v-if="successMsg" class="mt-4 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{{ successMsg }}</div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="mt-5 w-full cursor-pointer rounded-lg bg-gray-600 px-4 py-2.5 text-sm text-white lowercase transition-colors hover:bg-gray-500 disabled:opacity-50"
        >
          {{ authStore.loading ? 'resetting...' : 'reset password' }}
        </button>
      </form>
    </div>
  </div>
</template>
