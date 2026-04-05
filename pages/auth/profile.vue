<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const authStore = useAuthStore()
const { user, loading } = storeToRefs(authStore)

const isEditing = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const avatarError = ref(false)
const avatarInput = ref<HTMLInputElement>()

const showCropper = ref(false)
const cropImageSrc = ref('')
const cropImgEl = ref<HTMLImageElement>()
let cropper: Cropper | null = null

const onAvatarSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  cropImageSrc.value = URL.createObjectURL(file)
  showCropper.value = true
  nextTick(() => {
    if (cropImgEl.value) {
      cropper = new Cropper(cropImgEl.value, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        cropBoxResizable: false,
        cropBoxMovable: false,
        background: false,
      })
    }
  })
}

const cancelCrop = () => {
  cropper?.destroy()
  cropper = null
  showCropper.value = false
  cropImageSrc.value = ''
  if (avatarInput.value) avatarInput.value.value = ''
}

const confirmCrop = async () => {
  if (!cropper) return
  const canvas = cropper.getCroppedCanvas({ width: 256, height: 256 })
  canvas.toBlob(
    async (blob) => {
      if (!blob) return
      const formData = new FormData()
      formData.append('avatar', blob, 'avatar.jpg')
      try {
        await authStore.updateProfile(formData)
        avatarError.value = false
      } catch {
        errorMsg.value = 'failed to upload avatar.'
      }
      cancelCrop()
    },
    'image/jpeg',
    0.9,
  )
}

const editForm = reactive({
  username: '',
  phone: '',
  bio: '',
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
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

  if (passwordForm.new_password.length < 8) {
    passwordError.value = 'password must be at least 8 characters'
    return
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(passwordForm.new_password)) {
    passwordError.value = 'password must include letters, numbers, and a special character'
    return
  }
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    passwordError.value = "passwords don't match"
    return
  }

  try {
    const payload: { new_password: string; confirm_password: string; current_password?: string } = {
      new_password: passwordForm.new_password,
      confirm_password: passwordForm.confirm_password,
    }
    if (user.value?.has_password) payload.current_password = passwordForm.current_password
    const res = await authStore.setPassword(payload)
    passwordMsg.value = res.message?.toLowerCase() || 'password updated.'
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } catch {
    passwordError.value = user.value?.has_password ? 'wrong current password.' : 'failed to set password.'
  }
}

const showDeleteDialog = ref(false)

const defaultNoteColor = ref<import('~/types/todo').NoteColor>(
  (localStorage.getItem('defaultNoteColor') as import('~/types/todo').NoteColor) || 'default',
)
watch(defaultNoteColor, (v) => localStorage.setItem('defaultNoteColor', v))

const notificationsEnabled = ref(typeof Notification !== 'undefined' && Notification.permission === 'granted')

const handleDeleteAccount = async () => {
  await authStore.deleteAccount()
  navigateTo('/auth/login')
}

const toggleNotifications = async () => {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'granted') {
    notificationsEnabled.value = false
  } else {
    const result = await Notification.requestPermission()
    notificationsEnabled.value = result === 'granted'
  }
}

const exportNotes = async () => {
  const { request } = useApiFetch()
  try {
    const notes = await request<any[]>('/api/notes/?limit=1000')
    const data = JSON.stringify(notes, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minimal-list-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // silently fail
  }
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/auth/login')
}
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-10">
    <div class="w-full max-w-lg px-4 sm:max-w-none md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl min-[1920px]:max-w-[1600px]">
      <PageHeader title="profile" class="px-2.5">
        <NuxtLink to="/" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
        <button class="cursor-pointer text-sm text-white/60 lowercase hover:text-white" @click="handleLogout">logout</button>
      </PageHeader>
    </div>

    <div class="w-full max-w-lg px-4 pb-10 sm:max-w-none md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl min-[1920px]:max-w-[1600px]">

      <div v-if="!user" class="p-4 text-sm text-white/40">loading...</div>

      <template v-if="user">
        <!-- ACCOUNT SECTION -->
        <p class="mb-3 mx-2.5 text-sm font-bold text-white lowercase">account</p>

        <!-- header card -->
        <div class="mb-3 mx-2.5 rounded-lg bg-gray-700 p-5">
          <div class="flex items-center gap-4">
            <div class="group relative cursor-pointer" @click="avatarInput?.click()">
              <img
                v-if="(user.avatar || user.avatar_url) && !avatarError"
                :src="user.avatar || user.avatar_url"
                class="h-12 w-12 rounded-full object-cover"
                @error="avatarError = true"
              />
              <div v-else class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-lg font-bold text-white/70">
                {{ (user.username || user.email)[0].toUpperCase() }}
              </div>
              <div
                class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Icon name="uil:camera" class="text-sm text-white" />
              </div>
            </div>
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelect" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-lg font-medium text-white">{{ user.username || 'no username' }}</p>
              <p class="text-sm text-white/50">{{ user.email }}</p>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <PillBadge :color="user.is_verified ? 'green' : 'red'" :label="user.is_verified ? 'verified' : 'unverified'" />
          </div>
        </div>

        <!-- profile info / edit card -->
        <div class="mb-3 mx-2.5 rounded-lg bg-gray-700 p-5">
          <template v-if="!isEditing">
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold tracking-wider text-white/40">user details</p>
                <button class="cursor-pointer text-xs text-blue-300 lowercase hover:text-blue-200" @click="isEditing = true">edit</button>
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
            <p class="mb-3 text-sm font-bold text-white lowercase">edit profile</p>
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

        <!-- password card -->
        <form class="mb-3 mx-2.5 rounded-lg bg-gray-700 p-5" @submit.prevent="handleChangePassword">
          <p class="mb-3 text-sm font-bold text-white lowercase">
            {{ user.has_password ? 'change password' : 'set password' }}
          </p>
          <div class="space-y-3">
            <div v-if="user.has_password">
              <label class="mb-1 block text-xs text-white/40">current password</label>
              <input
                v-model="passwordForm.current_password"
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
                v-model="passwordForm.confirm_password"
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
            {{ user.has_password ? 'change password' : 'set password' }}
          </button>
        </form>

        <!-- SETTINGS SECTION -->
        <p class="mb-3 mt-6 mx-2.5 text-sm font-bold text-white lowercase">settings</p>

        <!-- settings -->
        <div class="mb-3 mx-2.5 rounded-lg bg-gray-700 p-5">
          <p class="mb-3 text-sm font-bold text-white lowercase">preferences</p>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-white/40">default note color</p>
              <ColorPicker v-model="defaultNoteColor" />
            </div>
          </div>
        </div>

        <div class="mb-3 mx-2.5 rounded-lg bg-gray-700 p-5">
          <p class="mb-3 text-sm font-bold text-white lowercase">notifications</p>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-white/40">browser reminders</p>
              <button
                class="cursor-pointer rounded-lg px-3 py-1 text-xs lowercase"
                :class="notificationsEnabled ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-600 text-white/40'"
                @click="toggleNotifications"
              >
                {{ notificationsEnabled ? 'on' : 'off' }}
              </button>
            </div>
          </div>
        </div>

        <div class="mb-3 mx-2.5 rounded-lg bg-gray-700 p-5">
          <p class="mb-3 text-sm font-bold text-white lowercase">account</p>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-white/40">connected accounts</p>
              <div class="flex items-center gap-2">
                <span class="text-xs text-white/60">{{ user.has_password ? 'email' : 'google' }}</span>
                <Icon name="logos:google-icon" class="text-sm" />
              </div>
            </div>
            <div class="flex items-center justify-between">
              <p class="text-xs text-white/40">active sessions</p>
              <span class="text-xs text-white/20 lowercase">coming soon</span>
            </div>
          </div>
        </div>

        <div class="mb-3 mx-2.5 rounded-lg bg-gray-700 p-5">
          <p class="mb-3 text-sm font-bold text-white lowercase">privacy</p>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-white/40">export notes</p>
              <button
                class="cursor-pointer rounded-lg bg-gray-600 px-3 py-1 text-xs text-white/60 lowercase hover:text-white"
                @click="exportNotes"
              >
                export
              </button>
            </div>
          </div>
        </div>

        <!-- danger zone -->
        <div class="mx-2.5 rounded-lg border border-red-500/20 bg-gray-700 p-5">
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

    <!-- avatar crop modal -->
    <ModalOverlay :show="showCropper" backdrop-class="bg-black/70" @click.self="cancelCrop">
      <div class="w-full max-w-sm rounded-lg bg-gray-700 p-4">
        <div class="mb-3 max-h-[60vh] overflow-hidden">
          <img ref="cropImgEl" :src="cropImageSrc" class="max-w-full" />
        </div>
        <div class="flex justify-end gap-2">
          <button class="cursor-pointer rounded px-3 py-1 text-xs text-white/60 hover:text-white" @click="cancelCrop">cancel</button>
          <button class="cursor-pointer rounded bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20" @click="confirmCrop">
            save
          </button>
        </div>
      </div>
    </ModalOverlay>
  </div>
</template>
