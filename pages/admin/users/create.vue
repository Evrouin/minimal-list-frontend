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

const handleCreate = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await api.createUser(form)
    successMsg.value = 'user created.'
    setTimeout(() => navigateTo('/admin/users'), 800)
  } catch {
    errorMsg.value = 'failed to create user.'
  }
}
</script>

<template>
  <div
    class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10"
  >
    <div class="w-full max-w-3xl px-4">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">create user</h1>
        <NuxtLink
          to="/admin/users"
          class="text-sm text-white/60 lowercase hover:text-white"
          >back</NuxtLink
        >
      </div>

      <form
        class="rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
        @submit.prevent="handleCreate"
      >
        <div class="flex flex-col gap-3">
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
            v-model="form.password"
            type="password"
            placeholder="password"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />

          <label class="flex items-center gap-2 text-white/70">
            <input
              v-model="form.is_verified"
              type="checkbox"
              class="accent-blue-900"
            />
            verified
          </label>
          <label class="flex items-center gap-2 text-white/70">
            <input
              v-model="form.is_superuser"
              type="checkbox"
              class="accent-blue-900"
            />
            superuser
          </label>

          <span v-if="errorMsg" class="text-xs text-red-300">{{
            errorMsg
          }}</span>
          <span v-if="successMsg" class="text-xs text-green-300">{{
            successMsg
          }}</span>

          <button
            type="submit"
            class="mt-2 cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-white lowercase hover:bg-gray-600"
          >
            create
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
