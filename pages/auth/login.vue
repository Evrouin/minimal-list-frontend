<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { googleTokenLogin } from 'vue3-google-login'

const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  try {
    await authStore.login(form)
    navigateTo('/')
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message || ''
    errorMsg.value = msg.includes('verify') ? 'unverified email'
      : msg.includes('deactivated') ? 'account deactivated'
      : 'invalid email or password'
  }
}

const handleGoogleLogin = async () => {
  errorMsg.value = ''
  try {
    const response = await googleTokenLogin()
    await authStore.googleLogin(response.access_token)
    navigateTo('/')
  } catch (e: unknown) {
    const msg = (e as Error)?.message || ''
    if (msg.includes('popup') || msg.includes('closed')) return
    errorMsg.value = msg.includes('deactivated') ? 'account deactivated' : 'google login failed'
  }
}
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-[20vh]">
    <div class="w-full max-w-lg px-4">
      <PageHeader title="minimal list">
        <NuxtLink to="/auth/register" class="text-sm text-white/60 lowercase hover:text-white">register</NuxtLink>
      </PageHeader>

      <form class="rounded-lg bg-gray-700 p-5" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs text-white/40">email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="user@example.com"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-white/40">password</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="password"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ errorMsg }}</div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="mt-5 w-full cursor-pointer rounded-lg bg-gray-600 px-4 py-2.5 text-xs text-white lowercase transition-colors hover:bg-gray-500 disabled:opacity-50"
        >
          {{ authStore.loading ? 'logging in...' : 'login' }}
        </button>

        <div class="my-4 flex items-center gap-3">
          <div class="h-px flex-1 bg-white/10" />
          <span class="text-xs text-white/30 lowercase">or</span>
          <div class="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-xs text-white lowercase transition-colors hover:bg-gray-500"
          @click="handleGoogleLogin"
        >
          <Icon name="logos:google-icon" />
          sign in with google
        </button>
      </form>

      <div class="mt-4 flex justify-center">
        <NuxtLink to="/auth/forgot-password" class="text-sm text-white/60 lowercase hover:text-white">
          forgot password?
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
