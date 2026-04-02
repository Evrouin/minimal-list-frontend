<script setup lang="ts">
definePageMeta({ middleware: ['admin'], layout: 'admin' })

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
  <div>
    <PageHeader title="create user">
      <NuxtLink to="/admin/users" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
    </PageHeader>

    <form class="rounded-lg bg-gray-700 p-5" @submit.prevent="handleCreate">
      <p class="mb-4 text-xs font-bold tracking-wider text-white/40 lowercase">account details</p>

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
          <label class="mb-1 block text-xs text-white/40">password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="min 8 characters"
            class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
          />
        </div>
      </div>

      <p class="mt-5 mb-3 text-xs font-bold tracking-wider text-white/40 lowercase">permissions</p>

      <div class="flex gap-6">
        <label class="flex cursor-pointer items-center gap-2 text-sm text-white/70">
          <ToggleSwitch v-model="form.is_verified" />
          verified
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm text-white/70">
          <ToggleSwitch v-model="form.is_superuser" color="yellow" />
          admin
        </label>
      </div>

      <div v-if="errorMsg" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ errorMsg }}</div>
      <div v-if="successMsg" class="mt-4 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{{ successMsg }}</div>

      <div class="mt-5 flex items-center justify-end gap-3">
        <NuxtLink to="/admin/users" class="text-sm text-white/40 hover:text-white">cancel</NuxtLink>
        <button
          type="submit"
          :disabled="submitting"
          class="cursor-pointer rounded-lg bg-white/10 px-5 py-2 text-xs text-white lowercase transition-colors hover:bg-white/20 disabled:opacity-50"
        >
          {{ submitting ? 'creating...' : 'create user' }}
        </button>
      </div>
    </form>
  </div>
</template>
