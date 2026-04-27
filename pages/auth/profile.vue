<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import type { Session } from '@/types/auth'
import type { NoteColor } from '~/types/todo'

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
const deleteAccountPassword = ref('')
const deleteAccountError = ref('')

watch(showDeleteDialog, (v) => {
  if (!v) {
    deleteAccountPassword.value = ''
    deleteAccountError.value = ''
  }
})
const showDeactivateDialog = ref(false)

const handleDeactivateAccount = async () => {
  await api.deactivateAccount()
  authStore.logout()
  navigateTo('/auth/login')
}

const defaultNoteColor = ref<NoteColor>((localStorage.getItem('defaultNoteColor') as NoteColor) || 'default')
watch(defaultNoteColor, (v) => localStorage.setItem('defaultNoteColor', v))
const showColorPicker = ref(false)
const selectNoteColor = (name: NoteColor) => {
  defaultNoteColor.value = name
  showColorPicker.value = false
}

const hapticsEnabled = ref(localStorage.getItem('hapticsEnabled') !== 'false')
const toggleHaptics = () => {
  hapticsEnabled.value = !hapticsEnabled.value
  localStorage.setItem('hapticsEnabled', String(hapticsEnabled.value))
}

const { theme, toggle } = useTheme()
const { showNoteCount, toggleNoteCount } = useSettings()
const noteColors = useNoteColors()

const showSessions = ref(false)
const revokingId = ref<number | null>(null)
const revokingOthersLoading = ref(false)
const sessions = ref<import('~/types/auth').Session[]>([])
const sessionsLoading = ref(false)
const api = useAuthApi()
const { timeAgo, now } = useTimeAgo()

const openSessions = async () => {
  showSessions.value = true
  sessionsLoading.value = true
  try {
    const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}')
    const res = await api.listSessions(tokens.refresh)
    const raw = res as { data?: Session[]; results?: Session[] } | Session[]
    const list = Array.isArray(raw) ? raw : (raw.data ?? raw.results ?? [])
    const sortedSessions = list.sort((a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime())
    const currentSession = sortedSessions.find((s) => s.is_current)
    const otherSessions = sortedSessions.filter((s) => !s.is_current)
    const finalSessions = currentSession ? [currentSession, ...otherSessions] : sortedSessions
    sessions.value = finalSessions
  } catch {
    sessions.value = []
  } finally {
    sessionsLoading.value = false
  }
}

const revokeSession = async (id: number) => {
  try {
    revokingId.value = id // Track specifically which session is loading
    await api.revokeSession(id)
    sessions.value = sessions.value.filter((s) => s.id !== id)
  } catch {
    /* silently fail */
  } finally {
    revokingId.value = null
  }
}

const revokeOtherSessions = async () => {
  const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}')
  if (!tokens.refresh) return

  try {
    revokingOthersLoading.value = true // Start loading
    await api.revokeOtherSessions(tokens.refresh)

    // Filter locally to keep only the current session
    sessions.value = sessions.value.filter((s) => s.is_current)
  } catch (err) {
    console.error('Failed to revoke other sessions:', err)
  } finally {
    revokingOthersLoading.value = false // Stop loading
  }
}

const deviceIcon = (type: string) => {
  if (type === 'mobile') return 'uil:mobile-android'
  if (type === 'tablet') return 'uil:tablet'
  return 'uil:desktop'
}

const notificationsEnabled = ref(
  localStorage.getItem('notificationsEnabled') !== 'false' && typeof Notification !== 'undefined' && Notification.permission === 'granted',
)

const handleDeleteAccount = async () => {
  if (!deleteAccountPassword.value) {
    deleteAccountError.value = 'password required'
    return
  }
  try {
    await authStore.deleteAccount(deleteAccountPassword.value)
    navigateTo('/auth/login')
  } catch {
    deleteAccountError.value = 'incorrect password'
  }
}

const todoApi = useTodoApi()
const showClearNotesDialog = ref(false)
const clearPassword = ref('')
const clearPasswordError = ref('')
const clearingNotes = ref(false)

watch(showClearNotesDialog, (v) => {
  if (!v) {
    clearPassword.value = ''
    clearPasswordError.value = ''
  }
})

const onClearNotesConfirm = async () => {
  if (user.value?.has_password && !clearPassword.value) {
    clearPasswordError.value = 'password is required'
    return
  }
  clearingNotes.value = true
  clearPasswordError.value = ''
  try {
    await todoApi.clearTodos(clearPassword.value)
    showClearNotesDialog.value = false
    clearPassword.value = ''
  } catch (e: unknown) {
    clearPasswordError.value = (e as Error)?.message || 'failed. check your password.'
  } finally {
    clearingNotes.value = false
  }
}

const toggleNotifications = async () => {
  if (notificationsEnabled.value) {
    notificationsEnabled.value = false
    localStorage.setItem('notificationsEnabled', 'false')
  } else {
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const result = await Notification.requestPermission()
      if (result !== 'granted') return
    }
    notificationsEnabled.value = true
    localStorage.setItem('notificationsEnabled', 'true')
  }
}

const exportNotes = async () => {
  const { request } = useApiFetch()
  try {
    const notes = await request<unknown[]>('/api/notes/?limit=1000')
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
    <div class="w-full max-w-lg px-4 min-[1920px]:max-w-400 sm:max-w-none md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl">
      <PageHeader title="profile" class="px-2.5">
        <NuxtLink to="/" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
        <button class="cursor-pointer text-sm text-white/60 lowercase hover:text-white" @click="handleLogout">logout</button>
      </PageHeader>
    </div>

    <div class="w-full max-w-lg px-4 pb-10 min-[1920px]:max-w-400 sm:max-w-none md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl">
      <div v-if="!user">
        <Icon name="uil:spinner-alt" class="p-4 text-white/40 inline-block animate-spin" />
      </div>

      <template v-if="user">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p class="mx-2.5 mb-3 text-sm font-bold text-white lowercase">account</p>

            <!-- header card -->
            <div class="mx-2.5 mb-3 rounded-lg bg-gray-700 p-5">
              <div class="flex items-center gap-4">
                <div class="group relative cursor-pointer" @click="avatarInput?.click()">
                  <img
                    v-if="(user.avatar || user.avatar_url) && !avatarError"
                    alt=""
                    :src="user?.avatar || user?.avatar_url"
                    class="h-12 w-12 rounded-full object-cover"
                    @error="avatarError = true"
                  >
                  <div v-else class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-lg font-bold text-white/70">
                    {{ (user?.username || user?.email || '?')[0]?.toUpperCase() }}
                  </div>
                  <div
                    class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Icon name="uil:camera" class="text-sm text-white" />
                  </div>
                </div>
                <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelect" >
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
            <div class="mx-2.5 mb-3 rounded-lg bg-gray-700 p-5">
              <template v-if="!isEditing">
                <div class="space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-bold tracking-wider text-white/40">user details</p>
                    <button class="cursor-pointer text-xs text-blue-300 lowercase hover:text-blue-200" @click="isEditing = true">
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
                <p class="mb-3 text-sm font-bold text-white lowercase">edit profile</p>
                <div class="space-y-3">
                  <div>
                    <label for="edit-username" class="mb-1 block text-xs text-white/40">username</label>
                    <input
                      id="edit-username"
                      v-model="editForm.username"
                      class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                      placeholder="username"
                    >
                  </div>
                  <div>
                    <label for="edit-phone" class="mb-1 block text-xs text-white/40">phone</label>
                    <input
                      id="edit-phone"
                      v-model="editForm.phone"
                      type="tel"
                      class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                      placeholder="phone"
                    >
                  </div>
                  <div>
                    <label for="edit-bio" class="mb-1 block text-xs text-white/40">bio</label>
                    <textarea
                      id="edit-bio"
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
            <form class="mx-2.5 mb-3 rounded-lg bg-gray-700 p-5" @submit.prevent="handleChangePassword">
              <p class="mb-3 text-sm font-bold text-white lowercase">
                {{ user.has_password ? 'change password' : 'set password' }}
              </p>
              <div class="space-y-3">
                <div v-if="user.has_password">
                  <label for="current-password" class="mb-1 block text-xs text-white/40">current password</label>
                  <input
                    id="current-password"
                    v-model="passwordForm.current_password"
                    type="password"
                    class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                    placeholder="current password"
                  >
                </div>
                <div>
                  <label for="new-password" class="mb-1 block text-xs text-white/40">new password</label>
                  <input
                    id="new-password"
                    v-model="passwordForm.new_password"
                    type="password"
                    class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                    placeholder="new password"
                  >
                </div>
                <div>
                  <label for="confirm-password" class="mb-1 block text-xs text-white/40">confirm new password</label>
                  <input
                    id="confirm-password"
                    v-model="passwordForm.confirm_password"
                    type="password"
                    class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                    placeholder="confirm new password"
                  >
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
          </div>

          <div>
            <p class="mx-2.5 mb-3 text-sm font-bold text-white lowercase">settings</p>

            <!-- settings -->
            <div class="mx-2.5 mb-3 rounded-lg bg-gray-700 p-5">
              <p class="mb-3 text-sm font-bold text-white lowercase">preferences</p>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-white/40">theme</p>
                  <button
                    class="inline-block min-w-18.5 cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-center text-xs text-white/60"
                    @click="toggle()"
                  >
                    {{ theme }}
                  </button>
                </div>
                <div class="flex items-center justify-between">
                  <p class="text-xs text-white/40">default note color</p>
                  <div class="flex items-center gap-1">
                    <Transition name="fade">
                      <div v-if="showColorPicker" class="flex items-center gap-1">
                        <button
                          v-for="(c, name) in noteColors"
                          :key="name"
                          class="h-5 w-5 cursor-pointer rounded-full border transition-transform hover:scale-110"
                          :class="[c.bg, defaultNoteColor === name ? 'border-white' : 'border-white/20']"
                          @click="selectNoteColor(name as NoteColor)"
                        />
                      </div>
                    </Transition>
                    <button
                      class="min-w-18.5 cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-center text-xs text-white/60"
                      :class="noteColors[defaultNoteColor]?.bg || 'bg-gray-800'"
                      @click="showColorPicker = !showColorPicker"
                    >
                      {{ defaultNoteColor }}
                    </button>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <p class="text-xs text-white/40">haptic feedback</p>
                  <button
                    class="min-w-18.5 cursor-pointer rounded-lg px-4 py-2 text-center text-xs lowercase"
                    :class="
                      hapticsEnabled ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-gray-600 text-white/40 hover:text-white'
                    "
                    @click="toggleHaptics"
                  >
                    {{ hapticsEnabled ? 'on' : 'off' }}
                  </button>
                </div>
                <div class="flex items-center justify-between">
                  <p class="text-xs text-white/40">show note count</p>
                  <button
                    class="min-w-18.5 cursor-pointer rounded-lg px-4 py-2 text-center text-xs lowercase"
                    :class="
                      showNoteCount ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-gray-600 text-white/40 hover:text-white'
                    "
                    @click="toggleNoteCount"
                  >
                    {{ showNoteCount ? 'on' : 'off' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="mx-2.5 mb-3 rounded-lg bg-gray-700 p-5">
              <p class="mb-3 text-sm font-bold text-white lowercase">notifications</p>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-white/40">browser reminders</p>
                  <button
                    class="min-w-18.5 cursor-pointer rounded-lg px-4 py-2 text-center text-xs lowercase"
                    :class="
                      notificationsEnabled
                        ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                        : 'bg-gray-600 text-white/40 hover:text-white'
                    "
                    @click="toggleNotifications"
                  >
                    {{ notificationsEnabled ? 'on' : 'off' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="mx-2.5 mb-3 rounded-lg bg-gray-700 p-5">
              <p class="mb-3 text-sm font-bold text-white lowercase">account</p>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-white/40">connected accounts</p>
                  <div class="flex items-center gap-2">
                    <Icon v-if="user.has_password" name="uil:envelope" class="h-5 w-5 text-white/60" />
                    <Icon name="logos:google-icon" class="h-4 w-4" />
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <p class="text-xs text-white/40">active sessions</p>
                  <button
                    class="min-w-18.5 cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-center text-xs text-white/60 lowercase hover:text-white"
                    @click="openSessions"
                  >
                    manage
                  </button>
                </div>
              </div>
            </div>

            <div class="mx-2.5 mb-3 rounded-lg bg-gray-700 p-5">
              <p class="mb-3 text-sm font-bold text-white lowercase">privacy</p>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-white/40">export notes</p>
                  <button
                    class="min-w-18.5 cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-center text-xs text-white/60 lowercase hover:text-white"
                    @click="exportNotes"
                  >
                    export
                  </button>
                </div>
              </div>
            </div>

            <!-- danger zone -->
            <div class="mx-2.5 rounded-lg border border-red-500/20 bg-gray-700 p-5">
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-red-300">clear notes</p>
                  <p class="text-xs text-white/40">permanently delete all your notes</p>
                </div>
                <button
                  class="min-w-18.5 cursor-pointer rounded-lg bg-red-500/20 px-4 py-2 text-xs text-red-300 lowercase hover:bg-red-500/30"
                  @click="showClearNotesDialog = true"
                >
                  proceed
                </button>
              </div>
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-red-300">deactivate account</p>
                  <p class="text-xs text-white/40">suspend access, keep your data</p>
                </div>
                <button
                  class="cursor-pointer rounded-lg bg-red-500/20 px-4 py-2 text-xs text-red-300 lowercase hover:bg-red-500/30"
                  @click="showDeactivateDialog = true"
                >
                  proceed
                </button>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-red-300">delete account</p>
                  <p class="text-xs text-white/40">scheduled for deletion in 30 days</p>
                </div>
                <button
                  class="cursor-pointer rounded-lg bg-red-500/20 px-4 py-2 text-xs text-red-300 lowercase hover:bg-red-500/30"
                  @click="showDeleteDialog = true"
                >
                  proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete account"
      message="your account will be scheduled for deletion in 30 days. you'll receive an email with a link to cancel. all data will be permanently deleted after 30 days."
      confirm-text="schedule deletion"
      @confirm="handleDeleteAccount"
    >
      <div class="mb-4">
        <input
          v-model="deleteAccountPassword"
          type="password"
          placeholder="your password"
          class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
          @keydown.enter="handleDeleteAccount"
        >
        <p v-if="deleteAccountError" class="mt-1 text-xs text-red-400">{{ deleteAccountError }}</p>
      </div>
    </ConfirmDialog>

    <ConfirmDialog
      v-model="showDeactivateDialog"
      title="deactivate account"
      message="your account will be suspended. you can reactivate anytime via the link sent to your email."
      confirm-text="deactivate"
      @confirm="handleDeactivateAccount"
    />

    <!-- Clear notes warning -->
    <ConfirmDialog
      v-model="showClearNotesDialog"
      title="clear notes"
      message="this will permanently delete all your notes, recordings, and images. this cannot be undone."
      confirm-text="yes, clear all"
      :loading="clearingNotes"
      @confirm="onClearNotesConfirm"
    >
      <div v-if="user?.has_password" class="mb-4">
        <input
          v-model="clearPassword"
          type="password"
          placeholder="your password"
          class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
          @keydown.enter="onClearNotesConfirm"
        >
        <p v-if="clearPasswordError" class="mt-1 text-xs text-red-400">{{ clearPasswordError }}</p>
      </div>
    </ConfirmDialog>

    <!-- sessions dialog -->
    <ModalOverlay :show="showSessions" @click.self="showSessions = false">
      <div class="mx-4 min-h-75 w-full max-w-md min-w-xs rounded-lg bg-gray-700 p-5">
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm font-bold text-white lowercase">active sessions</p>
          <button class="cursor-pointer text-xs text-white/30 hover:text-white/60" @click="showSessions = false">✕</button>
        </div>

        <div v-if="sessionsLoading">
          <Icon name="uil:spinner-alt" class="py-4 text-center text-white/40 inline-block animate-spin" />
        </div>

        <div v-else-if="sessions.length === 0" class="py-4 text-center text-xs text-white/40">no sessions found</div>

        <div v-else class="space-y-3">
          <div v-for="session in sessions" :key="session.id" class="flex items-center gap-3 rounded-lg bg-gray-600/50 p-3">
            <Icon :name="deviceIcon(session.device_type)" class="shrink-0 text-lg text-white/40" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate text-xs text-white">{{ session.device_name }}</p>
              </div>
              <p class="text-xs text-white/30">
                <span class="truncate">{{ session.ip_address }}</span>
                ·
                <span v-if="session.is_current" class="text-green-400">active now</span>
                <span v-else>{{ now ? timeAgo(session.last_active_at) : '' }}</span>
              </p>
            </div>
            <span v-if="session.is_current" class="shrink-0 rounded bg-green-500/20 px-2 py-1 text-xs text-green-300">current</span>
            <button
              v-else
              :disabled="revokingId === session.id"
              class="shrink-0 cursor-pointer rounded px-2 py-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
              @click="revokeSession(session.id)"
            >
              <Icon v-if="revokingId === session.id" name="uil:spinner-alt" class="animate-spin text-xs" />
              <span v-else>revoke</span>
            </button>
          </div>
        </div>

        <button
          v-if="sessions.length > 1"
          :disabled="revokingOthersLoading"
          class="mt-4 w-full cursor-pointer rounded-lg bg-red-500/10 py-2 text-xs text-red-300 lowercase hover:bg-red-500/20 disabled:opacity-50"
          @click="revokeOtherSessions"
        >
          <template v-if="revokingOthersLoading">
            <Icon name="uil:spinner-alt" class="mr-1 inline-block animate-spin" />
          </template>
          <template v-else>
            log out all other devices
          </template>
        </button>
      </div>
    </ModalOverlay>

    <!-- avatar crop modal -->
    <ModalOverlay :show="showCropper" backdrop-class="bg-black/70" @click.self="cancelCrop">
      <div class="w-full max-w-sm rounded-lg bg-gray-700 p-4">
        <div class="mb-3 max-h-[60vh] overflow-hidden">
          <img ref="cropImgEl" alt="" :src="cropImageSrc" class="max-w-full" >
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
