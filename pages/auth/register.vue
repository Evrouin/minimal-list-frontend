<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const form = reactive({
  email: '',
  username: '',
  password: '',
  password2: '',
  phone: '',
})
const successMsg = ref('')
const errorMsg = ref('')

const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (form.password.length < 8) {
    errorMsg.value = 'password must be at least 8 characters'
    return
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(form.password)) {
    errorMsg.value =
      'password must include letters, numbers, and a special character'
    return
  }
  if (form.password !== form.password2) {
    errorMsg.value = "passwords don't match"
    return
  }

  try {
    const res = (await authStore.register(form)) as { message?: string }
    successMsg.value =
      res.message || 'registration successful. check your email.'
  } catch {
    errorMsg.value = 'registration failed. try again.'
  }
}
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800"
  >
    <div class="w-full max-w-lg px-4">
      <div class="mx-auto flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">register</h1>
      </div>

      <form @submit.prevent="handleRegister">
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
            v-model="form.username"
            type="text"
            placeholder="username"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="form.phone"
            type="tel"
            placeholder="phone (optional)"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="form.password"
            type="password"
            placeholder="password"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="form.password2"
            type="password"
            placeholder="confirm password"
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
            {{ authStore.loading ? 'registering...' : 'register' }}
          </button>
        </div>
      </form>

      <div class="mt-4 flex justify-center">
        <NuxtLink
          to="/auth/login"
          class="text-sm text-white/60 lowercase hover:text-white"
        >
          already have an account? login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
