<script setup lang="ts">
import type { User } from '~/types/auth'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const route = useRoute()
const api = useAdminApi()
const user = ref<User | null>(null)
const isEditing = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const avatarError = ref(false)
const showDeleteDialog = ref(false)

const editForm = reactive({ username: '', phone: '', bio: '' })

onMounted(async () => {
  try {
    user.value = await api.getUser(route.params.id as string)
    if (user.value) {
      editForm.username = user.value.username
      editForm.phone = user.value.phone
      editForm.bio = user.value.bio
    }
  } catch {
    errorMsg.value = 'failed to load user'
  }
})

const save = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  try {
    user.value = await api.updateUser(route.params.id as string, editForm)
    successMsg.value = 'user updated.'
    isEditing.value = false
  } catch {
    errorMsg.value = 'failed to update user.'
  }
}

const deleting = ref(false)

const toggleField = async (field: 'is_active' | 'is_verified' | 'is_superuser', value: boolean) => {
  try {
    user.value = await api.updateUser(route.params.id as string, { [field]: value })
  } catch {
    errorMsg.value = `failed to update ${field.replace('is_', '')}`
  }
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await api.deleteUser(route.params.id as string)
    navigateTo('/admin/users')
  } catch {
    errorMsg.value = 'failed to delete user'
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="user detail">
      <NuxtLink to="/admin/users" class="text-xs text-white/60 lowercase hover:text-white">back</NuxtLink>
    </PageHeader>

    <div v-if="!user && !errorMsg" class="p-4 text-xs text-white/40">loading...</div>
    <div v-if="errorMsg && !user" class="p-4 text-xs text-red-400">{{ errorMsg }}</div>

    <template v-if="user">
      <!-- header card -->
      <div class="mb-3 rounded-lg bg-gray-700 p-5">
        <div class="flex items-center gap-4">
          <img
            v-if="(user.avatar || user.avatar_url) && !avatarError"
            :src="user.avatar || user.avatar_url"
            class="h-12 w-12 rounded-full object-cover"
            @error="avatarError = true"
          />
          <div v-else class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-sm font-bold text-white/70">
            {{ (user.username || user.email)[0].toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-white">{{ user.email }}</p>
            <p class="text-xs text-white/50">{{ user.username || 'no username' }}</p>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <PillBadge :color="user.is_active ? 'green' : 'red'" :label="user.is_active ? 'active' : 'deactivated'" />
          <PillBadge :color="user.is_verified ? 'green' : 'red'" :label="user.is_verified ? 'verified' : 'unverified'" />
          <PillBadge v-if="user.is_superuser" color="yellow" label="admin" />
        </div>
      </div>

      <!-- info / edit card -->
      <div class="mb-3 rounded-lg bg-gray-700 p-5">
        <template v-if="!isEditing">
          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold tracking-wider text-white/40 lowercase">profile</p>
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
          <p class="mb-3 text-xs font-bold tracking-wider text-white/40 lowercase">edit profile</p>
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-xs text-white/40">username</label>
              <input
                v-model="editForm.username"
                class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                placeholder="username"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-white/40">phone</label>
              <input
                v-model="editForm.phone"
                class="w-full rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                placeholder="phone"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-white/40">bio</label>
              <textarea
                v-model="editForm.bio"
                class="w-full resize-none rounded-lg bg-gray-600 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                placeholder="bio"
                rows="3"
              />
            </div>
          </div>

          <span v-if="errorMsg" class="mt-2 block text-xs text-red-300">{{ errorMsg }}</span>
          <span v-if="successMsg" class="mt-2 block text-xs text-green-300">{{ successMsg }}</span>

          <div class="mt-4 flex gap-2">
            <button class="cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-xs text-white lowercase hover:bg-gray-500" @click="save">
              save
            </button>
            <button class="cursor-pointer rounded-lg px-4 py-2 text-xs text-white/60 lowercase hover:text-white" @click="isEditing = false">
              cancel
            </button>
          </div>
        </template>
      </div>

      <!-- account settings -->
      <div class="mb-3 rounded-lg bg-gray-700 p-5">
        <p class="mb-3 text-xs font-bold tracking-wider text-white/40 lowercase">account settings</p>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-white">active</span>
            <ToggleSwitch :model-value="user.is_active" @update:model-value="toggleField('is_active', $event)" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-white">verified</span>
            <ToggleSwitch :model-value="user.is_verified" @update:model-value="toggleField('is_verified', $event)" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-white">admin</span>
            <ToggleSwitch :model-value="user.is_superuser" color="yellow" @update:model-value="toggleField('is_superuser', $event)" />
          </div>
        </div>
      </div>

      <!-- danger zone -->
      <div class="rounded-lg border border-red-500/20 bg-gray-700 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-red-300">delete user</p>
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

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete user"
      :message="`permanently delete ${user?.email}? this cannot be undone.`"
      confirm-text="delete forever"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
