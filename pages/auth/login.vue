<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { signIn: googleSignIn } = useGoogleAuth()

const form = reactive({
  email: '',
  password: '',
})
const errorMsg = ref('')
const showPassword = ref(false)
const showResend = ref(false)
const resendCooldown = ref(false)
const resendMsg = ref('')

const api = useAuthApi()

const handleLogin = async () => {
  errorMsg.value = ''
  showResend.value = false
  resendMsg.value = ''
  try {
    await authStore.login(form)
    navigateTo('/')
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message?.toLowerCase() || ''
    if (msg.includes('locked')) errorMsg.value = 'account locked. check your email to unlock.'
    else if (msg.includes('scheduled for deletion')) {
      errorMsg.value = 'account scheduled for deletion. check your email to cancel.'
    } else if (msg.includes('deactivated') && msg.includes('reactivation')) {
      errorMsg.value = 'account deactivated. check your email for a reactivation link.'
    } else if (msg.includes('deactivated')) errorMsg.value = 'account deactivated. please contact support.'
    else if (msg.includes('verify')) {
      errorMsg.value = 'please verify your email first.'
      showResend.value = true
    } else errorMsg.value = 'invalid email or password'
  }
}

const resendVerification = async () => {
  if (resendCooldown.value || !form.email) return
  try {
    await api.resendVerification(form.email)
    resendMsg.value = 'verification email sent — check your inbox.'
    resendCooldown.value = true
    setTimeout(() => {
      resendCooldown.value = false
    }, 60000)
  } catch {
    resendMsg.value = 'failed to send. try again later.'
  }
}

const handleGoogleLogin = async () => {
  errorMsg.value = ''
  try {
    const accessToken = await googleSignIn()
    await authStore.googleLogin(accessToken)
    navigateTo('/')
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message?.toLowerCase() || ''
    if (msg.includes('popup') || msg.includes('closed') || msg.includes('cancel')) return
    if (msg.includes('locked')) errorMsg.value = 'account locked. check your email to unlock.'
    else if (msg.includes('deactivated')) errorMsg.value = 'account deactivated. please contact support.'
    else errorMsg.value = 'google login failed'
  }
}
</script>

<template>
  <AuthFormCard title="login" link-to="/auth/register" link-label="create an account?">
    <form @submit.prevent="handleLogin">
      <div class="space-y-5">
        <div>
          <label for="login-email" class="mb-1 block text-xs text-white/40">email</label>
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            placeholder="user@example.com"
            class="w-full rounded-lg bg-gray-600 px-3 py-4 text-xs text-white placeholder-white/30 focus:outline-none md:py-2.5"
          />
        </div>
        <div>
          <label for="login-password" class="mb-1 block text-xs text-white/40">password</label>
          <div class="relative">
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="password"
              class="w-full rounded-lg bg-gray-600 px-3 py-4 pr-9 text-xs text-white placeholder-white/30 focus:outline-none md:py-2.5"
            />
            <button
              type="button"
              class="absolute top-1/2 right-2 -translate-y-1/2 text-white/30 hover:text-white/60"
              tabindex="-1"
              @click="showPassword = !showPassword"
            >
              <Icon
                :name="showPassword ? 'uil:eye-slash' : 'uil:eye'"
                class="mt-2 text-base text-white/40 hover:text-white/60 md:text-sm"
              />
            </button>
          </div>
        </div>
      </div>

      <div v-if="errorMsg" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
        {{ errorMsg }}
        <button
          v-if="showResend"
          type="button"
          :disabled="resendCooldown"
          class="ml-1 cursor-pointer py-4 underline hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50 md:py-2.5"
          @click="resendVerification"
        >
          {{ resendCooldown ? 'sent' : 'resend' }}
        </button>
      </div>
      <div v-if="resendMsg" class="mt-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{{ resendMsg }}</div>

      <button
        type="submit"
        :disabled="authStore.loading"
        class="mt-5 w-full cursor-pointer rounded-lg bg-gray-600 px-4 py-4 text-xs text-white lowercase transition-colors hover:bg-gray-500 disabled:opacity-50 md:py-2.5"
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
        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-4 text-xs text-white lowercase transition-colors hover:bg-gray-500 md:py-2.5"
        @click="handleGoogleLogin"
      >
        <Icon name="logos:google-icon" />
        sign in with google
      </button>
    </form>

    <div class="mt-4 flex justify-center">
      <NuxtLink to="/auth/forgot-password" class="text-xs text-white/40 lowercase hover:text-white/60">forgot password?</NuxtLink>
    </div>
  </AuthFormCard>
</template>
