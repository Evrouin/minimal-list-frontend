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
  } catch {
    errorMsg.value = 'invalid email or password'
  }
}

const handleGoogleLogin = async () => {
  errorMsg.value = ''
  try {
    const response = await googleTokenLogin()
    await authStore.googleLogin(response.access_token)
    navigateTo('/')
  } catch {
    errorMsg.value = 'google login failed'
  }
}
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800"
  >
    <div class="w-full max-w-lg px-4">
      <div class="mx-auto flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">login</h1>
      </div>

      <form @submit.prevent="handleLogin">
        <div
          class="flex w-full flex-col gap-3 rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
        >
          <input
            v-model="form.email"
            type="email"
            placeholder="email"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="form.password"
            type="password"
            placeholder="password"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />

          <span v-if="errorMsg" class="text-xs text-red-300">{{
            errorMsg
          }}</span>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="mt-2 cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-white lowercase transition-all duration-200 hover:bg-gray-600 disabled:opacity-50"
          >
            {{ authStore.loading ? 'logging in...' : 'login' }}
          </button>

          <div class="flex items-center gap-3">
            <div class="h-px flex-1 bg-white/20" />
            <span class="text-xs text-white/40 lowercase">or</span>
            <div class="h-px flex-1 bg-white/20" />
          </div>

          <div class="flex justify-center">
            <button
              type="button"
              class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-white lowercase transition-all duration-200 hover:bg-gray-600"
              @click="handleGoogleLogin"
            >
              <Icon name="logos:google-icon" />
              sign in with google
            </button>
          </div>
        </div>
      </form>

      <div class="mt-4 flex justify-center gap-4">
        <NuxtLink
          to="/auth/register"
          class="text-sm text-white/60 lowercase hover:text-white"
        >
          register
        </NuxtLink>
        <NuxtLink
          to="/auth/forgot-password"
          class="text-sm text-white/60 lowercase hover:text-white"
        >
          forgot password?
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
