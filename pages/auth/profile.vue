<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user, loading } = storeToRefs(authStore)

const isEditing = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const editForm = reactive({
  username: '',
  phone: '',
  bio: '',
})

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  new_password2: '',
})
const passwordMsg = ref('')
const passwordError = ref('')

onMounted(async () => {
  await authStore.fetchProfile()
  if (user.value) {
    editForm.username = user.value.username
    editForm.phone = user.value.phone
    editForm.bio = user.value.bio
  }
})

const saveProfile = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await authStore.updateProfile(editForm)
    successMsg.value = 'profile updated.'
    isEditing.value = false
  } catch {
    errorMsg.value = 'failed to update profile.'
  }
}

const handleChangePassword = async () => {
  passwordError.value = ''
  passwordMsg.value = ''

  if (passwordForm.new_password !== passwordForm.new_password2) {
    passwordError.value = "passwords don't match"
    return
  }

  try {
    const res = await authStore.changePassword(passwordForm)
    passwordMsg.value = res.message || 'password changed.'
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.new_password2 = ''
  } catch {
    passwordError.value = 'wrong current password.'
  }
}

const handleDeleteAccount = async () => {
  if (!confirm('are you sure? this cannot be undone.')) return
  await authStore.deleteAccount()
  navigateTo('/auth/login')
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/auth/login')
}
</script>

<template>
  <div
    class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10"
  >
    <div class="w-full max-w-lg px-4">
      <div class="mx-auto flex min-w-md items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">profile</h1>
        <button
          class="cursor-pointer text-sm text-white/60 lowercase hover:text-white"
          @click="handleLogout"
        >
          logout
        </button>
      </div>

      <!-- Profile Info -->
      <div
        class="mb-5 flex w-full flex-col gap-3 rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
      >
        <template v-if="!isEditing && user">
          <span
            class="cursor-pointer hover:text-gray-300"
            @click="isEditing = true"
          >
            {{ user.username || 'no username' }}
          </span>
          <span class="text-white/60">{{ user.email }}</span>
          <span
            class="cursor-pointer hover:text-gray-300"
            @click="isEditing = true"
          >
            {{ user.bio || 'no bio' }}
          </span>
          <span class="text-xs text-white/60">click to edit</span>
        </template>

        <template v-if="isEditing">
          <input
            v-model="editForm.username"
            type="text"
            placeholder="username"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="editForm.phone"
            type="tel"
            placeholder="phone"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <textarea
            v-model="editForm.bio"
            placeholder="bio"
            class="resize-none border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />

          <span v-if="errorMsg" class="text-xs text-red-300">{{
            errorMsg
          }}</span>
          <span v-if="successMsg" class="text-xs text-green-300">{{
            successMsg
          }}</span>

          <div class="flex gap-2">
            <button
              :disabled="loading"
              class="cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-white lowercase transition-all duration-200 hover:bg-gray-600 disabled:opacity-50"
              @click="saveProfile"
            >
              save
            </button>
            <button
              class="cursor-pointer rounded-lg px-4 py-2 text-white/60 lowercase hover:text-white"
              @click="isEditing = false"
            >
              cancel
            </button>
          </div>
        </template>
      </div>

      <!-- Change Password -->
      <div class="mx-auto flex min-w-md items-center p-4">
        <h2 class="text-lg font-bold text-white lowercase">change password</h2>
      </div>

      <form @submit.prevent="handleChangePassword">
        <div
          class="mb-5 flex w-full flex-col gap-3 rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
        >
          <input
            v-model="passwordForm.old_password"
            type="password"
            placeholder="current password"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="passwordForm.new_password"
            type="password"
            placeholder="new password"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="passwordForm.new_password2"
            type="password"
            placeholder="confirm new password"
            class="border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />

          <span v-if="passwordError" class="text-xs text-red-300">{{
            passwordError
          }}</span>
          <span v-if="passwordMsg" class="text-xs text-green-300">{{
            passwordMsg
          }}</span>

          <button
            type="submit"
            :disabled="loading"
            class="mt-2 cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-white lowercase transition-all duration-200 hover:bg-gray-600 disabled:opacity-50"
          >
            change password
          </button>
        </div>
      </form>

      <!-- Delete Account -->
      <div class="flex justify-center">
        <button
          class="cursor-pointer text-sm text-red-400 lowercase hover:text-red-300"
          @click="handleDeleteAccount"
        >
          delete account
        </button>
      </div>

      <!-- Back to todos -->
      <div class="mt-4 flex justify-center">
        <NuxtLink
          to="/"
          class="text-sm text-white/60 lowercase hover:text-white"
        >
          back to todos
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
