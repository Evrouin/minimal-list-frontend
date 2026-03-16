<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const api = useAdminApi()
const form = reactive({
  email: '',
  username: '',
  password: '',
  is_superuser: false,
  is_verified: false,
})
const errorMsg = ref('')
const successMsg = ref('')
const submitting = ref(false)

const handleCreate = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.email.trim()) return (errorMsg.value = 'email is required')
  if (!form.username.trim()) return (errorMsg.value = 'username is required')
  if (form.password.length < 8) return (errorMsg.value = 'password must be at least 8 characters')
  if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(form.password))
    return (errorMsg.value = 'password must include letters, numbers, and a special character')

  submitting.value = true
  try {
    await api.createUser(form)
    successMsg.value = 'user created.'
    setTimeout(() => navigateTo('/admin/users'), 800)
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg.includes('email')) errorMsg.value = 'email already exists'
    else if (msg.includes('username')) errorMsg.value = 'username already exists'
    else errorMsg.value = 'failed to create user.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10">
    <div class="w-full max-w-3xl px-4">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">create user</h1>
        <NuxtLink to="/admin/users" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
      </div>

      <form class="rounded-lg bg-gray-700 p-5" @submit.prevent="handleCreate">
        <p class="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">account details</p>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs text-white/40">email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="user@example.com"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-white/40">username</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="username"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-white/40">password</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="min 8 characters"
              class="w-full rounded-lg bg-gray-600 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>

        <p class="mb-3 mt-5 text-xs font-bold uppercase tracking-wider text-white/40">permissions</p>

        <div class="flex gap-6">
          <label class="flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <input v-model="form.is_verified" type="checkbox" class="accent-green-500" />
            verified
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <input v-model="form.is_superuser" type="checkbox" class="accent-yellow-500" />
            superuser
          </label>
        </div>

        <div v-if="errorMsg" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ errorMsg }}</div>
        <div v-if="successMsg" class="mt-4 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{{ successMsg }}</div>

        <button
          type="submit"
          :disabled="submitting"
          class="mt-5 w-full cursor-pointer rounded-lg bg-gray-600 px-4 py-2.5 text-sm text-white lowercase transition-colors hover:bg-gray-500 disabled:opacity-50"
        >
          {{ submitting ? 'creating...' : 'create user' }}
        </button>
      </form>
    </div>
  </div>
</template>
