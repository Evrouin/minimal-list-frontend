<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const token = route.params.token as string
const message = ref('')
const isError = ref(false)

onMounted(async () => {
  try {
    const res = await authStore.verifyEmail(token)
    message.value = res.message || 'email verified successfully.'
  } catch {
    isError.value = true
    message.value = 'invalid or expired verification link.'
  }
})
</script>

<template>
  <AuthFormCard title="email verification" link-to="/auth/login" link-label="login">
      <div v-if="!message" class="text-sm text-white/40">verifying...</div>
      <div
        v-else
        class="rounded-lg px-3 py-2 text-sm"
        :class="isError ? 'bg-red-500/10 text-red-300' : 'bg-green-500/10 text-green-300'"
      >
        {{ message }}
      </div>
  </AuthFormCard>
</template>
