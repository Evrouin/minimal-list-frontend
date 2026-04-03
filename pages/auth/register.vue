<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  password2: '',
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
    errorMsg.value = 'password must include letters, numbers, and a special character'
    return
  }
  if (form.password !== form.password2) {
    errorMsg.value = "passwords don't match"
    return
  }

  try {
    const res = (await authStore.register(form)) as { message?: string }
    successMsg.value = (res.message?.toLowerCase() || 'registered successfully') + '. check your email to verify your account.'
  } catch {
    errorMsg.value = 'registration failed. try again.'
  }
}
</script>

<template>
  <AuthFormCard title="minimal list" link-to="/auth/login" link-label="login">
    <form @submit.prevent="handleRegister">
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
      </div>

      <p class="mt-5 mb-3 text-xs font-bold tracking-wider text-white/40 lowercase">password</p>

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
  </AuthFormCard>
</template>
