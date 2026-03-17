<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user, loading } = storeToRefs(authStore)

const isEditing = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const avatarError = ref(false)

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

const showDeleteDialog = ref(false)

const handleDeleteAccount = async () => {
  await authStore.deleteAccount()
  navigateTo('/auth/login')
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/auth/login')
}
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10">
    <div class="w-full max-w-lg px-4 md:max-w-2xl lg:max-w-3xl xl:max-w-5xl">
      <PageHeader title="profile">
        <NuxtLink to="/" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
        <button
          class="cursor-pointer text-sm text-white/60 lowercase hover:text-white"
          @click="handleLogout"
        >
          logout
        </button>
      </PageHeader>

      <div v-if="!user" class="p-4 text-sm text-white/40">loading...</div>

      <template v-if="user">
        <!-- header card -->
        <div class="mb-3 rounded-lg bg-gray-700 p-5">
          <div class="flex items-center gap-4">
            <img v-if="(user.avatar || user.avatar_url) && !avatarError" :src="user.avatar || user.avatar_url" class="h-12 w-12 rounded-full object-cover" @error="avatarError = true" />
            <div v-else class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-lg font-bold text-white/70">
              {{ (user.username || user.email)[0].toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-lg font-medium text-white">{{ user.username || 'no username' }}</p>
              <p class="text-sm text-white/50">{{ user.email }}</p>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              class="rounded-full px-2.5 py-0.5 text-xs"
              :class="user.is_verified ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'"
            >
              {{ user.is_verified ? 'verified' : 'unverified' }}
            </span>
          </div>
        </div>

        <!-- profile info / edit card -->
        <div class="mb-3 rounded-lg bg-gray-700 p-5">
          <template v-if="!isEditing">
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold uppercase tracking-wider text-white/40">profile</p>
                <button
                  class="cursor-pointer text-xs text-blue-300 lowercase hover:text-blue-200"
                  @click="isEditing = true"
                >
                  edit
                </button>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p class="text-xs text-white/40">username</p>
                  <p class="text-white">{{ user.username || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs text-white/40">phone</p>
                  <p class="text-white">{{ user.phone || '—' }}</p>
                </div>
                <div class="sm:col-span-2">
                  <p class="text-xs text-white/40">bio</p>
                  <p class="text-white">{{ user.bio || '—' }}</p>
                </div>
              </div>
            </div>
          </template>

          <template v-if="isEditing">
            <p class="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">edit profile</p>
            <div class="space-y-3">
              <div>
                <label class="mb-1 block text-xs text-white/40">username</label>
                <input
                  v-model="editForm.username"
                  class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  placeholder="username"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs text-white/40">phone</label>
                <input
                  v-model="editForm.phone"
                  type="tel"
                  class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  placeholder="phone"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs text-white/40">bio</label>
                <textarea
                  v-model="editForm.bio"
                  class="w-full resize-none rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  placeholder="bio"
                  rows="3"
                />
              </div>
            </div>

            <div v-if="errorMsg" class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ errorMsg }}</div>
            <div v-if="successMsg" class="mt-3 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{{ successMsg }}</div>

            <div class="mt-4 flex gap-2">
              <button
                :disabled="loading"
                class="cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-xs text-white lowercase hover:bg-gray-500 disabled:opacity-50"
                @click="saveProfile"
              >
                save
              </button>
              <button
                class="cursor-pointer rounded-lg px-4 py-2 text-xs text-white/60 lowercase hover:text-white"
                @click="isEditing = false"
              >
                cancel
              </button>
            </div>
          </template>
        </div>

        <!-- change password card -->
        <form class="mb-3 rounded-lg bg-gray-700 p-5" @submit.prevent="handleChangePassword">
          <p class="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">change password</p>
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-xs text-white/40">current password</label>
              <input
                v-model="passwordForm.old_password"
                type="password"
                class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                placeholder="current password"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-white/40">new password</label>
              <input
                v-model="passwordForm.new_password"
                type="password"
                class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                placeholder="new password"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-white/40">confirm new password</label>
              <input
                v-model="passwordForm.new_password2"
                type="password"
                class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                placeholder="confirm new password"
              />
            </div>
          </div>

          <div v-if="passwordError" class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ passwordError }}</div>
          <div v-if="passwordMsg" class="mt-3 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{{ passwordMsg }}</div>

          <button
            type="submit"
            :disabled="loading"
            class="mt-4 w-full cursor-pointer rounded-lg bg-gray-600 px-4 py-2.5 text-xs text-white lowercase transition-colors hover:bg-gray-500 disabled:opacity-50"
          >
            change password
          </button>
        </form>

        <!-- danger zone -->
        <div class="rounded-lg border border-red-500/20 bg-gray-700 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-300">delete account</p>
              <p class="text-xs text-white/40">this action cannot be undone</p>
            </div>
            <button
              class="cursor-pointer rounded-lg bg-red-500/20 px-4 py-2 text-xs text-red-300 lowercase hover:bg-red-500/30"
              @click="showDeleteDialog = true"
            >
              delete
            </button>
          </div>
        </div>
      </template>
    </div>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete account"
      message="this is permanent and cannot be undone. all your data will be lost."
      confirm-text="delete forever"
      @confirm="handleDeleteAccount"
    />
  </div>
</template>
