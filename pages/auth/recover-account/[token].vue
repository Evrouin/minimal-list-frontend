<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const api = useAuthApi()
const success = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    await api.recoverAccount(route.params.token as string)
    success.value = true
  } catch (e: unknown) {
    error.value = (e as { message?: string })?.message || 'invalid or expired recovery link.'
  }
})
</script>

<template>
  <AuthFormCard title="cancel account deletion" link-to="/auth/login" link-label="log in">
    <div v-if="success" class="space-y-4 text-center">
      <p class="text-sm text-white/60 lowercase">account deletion cancelled. your account is restored.</p>
      <NuxtLink to="/auth/login" class="block text-xs text-blue-400 lowercase hover:text-blue-300">log in</NuxtLink>
    </div>
    <div v-else-if="error" class="text-center">
      <p class="text-sm text-red-400 lowercase">{{ error }}</p>
    </div>
    <div v-else class="text-center">
      <p class="text-sm text-white/40 lowercase">recovering your account...</p>
    </div>
  </AuthFormCard>
</template>
