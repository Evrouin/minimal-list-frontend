<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { signIn: googleSignIn } = useGoogleAuth()

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

const handleGoogleSignUp = async () => {
  errorMsg.value = ''
  try {
    const accessToken = await googleSignIn()
    await authStore.googleLogin(accessToken)
    navigateTo('/')
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message?.toLowerCase() || ''
    if (msg.includes('popup') || msg.includes('closed') || msg.includes('cancel')) return
    if (msg.includes('deactivated')) errorMsg.value = 'account deactivated. please contact support.'
    else errorMsg.value = 'google sign up failed'
  }
}
</script>

<template>
  <AuthFormCard title="register" link-to="/auth/login" link-label="already have an account?">
    <form @submit.prevent="handleRegister">
      <div class="space-y-5">
        <div>
          <label class="mb-1 block text-xs text-white/40">email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="user@example.com"
            class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
          >
        </div>
      </div>

      <div class="mt-4 space-y-4">
        <div>
          <label class="mb-1 block text-xs text-white/40">password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="min 8 characters"
            class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
          >
        </div>
        <div>
          <label class="mb-1 block text-xs text-white/40">confirm password</label>
          <input
            v-model="form.password2"
            type="password"
            placeholder="confirm password"
            class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
          >
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

      <div class="my-4 flex items-center gap-3">
        <div class="h-px flex-1 bg-white/10" />
        <span class="text-xs text-white/30 lowercase">or</span>
        <div class="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-xs text-white lowercase transition-colors hover:bg-gray-500"
        @click="handleGoogleSignUp"
      >
        <Icon name="logos:google-icon" />
        sign up with google
      </button>
    </form>
  </AuthFormCard>
</template>
