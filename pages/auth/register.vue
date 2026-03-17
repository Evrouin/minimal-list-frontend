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
  form.username = form.username.toLowerCase()

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
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-[20vh]">
    <div class="w-full max-w-lg px-4">
      <PageHeader title="register">
        <NuxtLink to="/auth/login" class="text-sm text-white/60 lowercase hover:text-white">login</NuxtLink>
      </PageHeader>

      <form class="rounded-lg bg-gray-700 p-5" @submit.prevent="handleRegister">
        <p class="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">account details</p>

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
            <label class="mb-1 block text-xs text-white/40">username</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="username"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-white/40">phone (optional)</label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="phone"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>

        <p class="mb-3 mt-5 text-xs font-bold uppercase tracking-wider text-white/40">password</p>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs text-white/40">password</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="min 8 characters"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-white/40">confirm password</label>
            <input
              v-model="form.password2"
              type="password"
              placeholder="confirm password"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ errorMsg }}</div>
        <div v-if="successMsg" class="mt-4 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{{ successMsg }}</div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="mt-5 w-full cursor-pointer rounded-lg bg-gray-600 px-4 py-2.5 text-xs text-white lowercase transition-colors hover:bg-gray-500 disabled:opacity-50"
        >
          {{ authStore.loading ? 'registering...' : 'register' }}
        </button>
      </form>
    </div>
  </div>
</template>
