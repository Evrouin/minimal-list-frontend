<script setup lang="ts">
import type { User } from '~/types/auth'

definePageMeta({ middleware: ['admin'] })

const route = useRoute()
const api = useAdminApi()
const user = ref<User | null>(null)
const isEditing = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const showDeleteDialog = ref(false)

const editForm = reactive({ username: '', phone: '', bio: '' })

onMounted(async () => {
  user.value = await api.getUser(Number(route.params.id))
  if (user.value) {
    editForm.username = user.value.username
    editForm.phone = user.value.phone
    editForm.bio = user.value.bio
  }
})

const save = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  try {
    user.value = await api.updateUser(Number(route.params.id), editForm)
    successMsg.value = 'user updated.'
    isEditing.value = false
  } catch {
    errorMsg.value = 'failed to update user.'
  }
}

const confirmDelete = async () => {
  await api.deleteUser(Number(route.params.id))
  navigateTo('/admin/users')
}
</script>

<template>
  <div
    class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10"
  >
    <div class="w-full max-w-3xl px-4">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">user detail</h1>
        <NuxtLink
          to="/admin/users"
          class="text-sm text-white/60 lowercase hover:text-white"
          >back</NuxtLink
        >
      </div>

      <div v-if="!user" class="p-4 text-sm text-white/40">loading...</div>

      <div
        v-if="user"
        class="rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
      >
        <template v-if="!isEditing">
          <p class="mb-1">
            <span class="text-white/50">email:</span> {{ user.email }}
          </p>
          <p
            class="mb-1 cursor-pointer hover:text-gray-300"
            @click="isEditing = true"
          >
            <span class="text-white/50">username:</span>
            {{ user.username || 'none' }}
          </p>
          <p
            class="mb-1 cursor-pointer hover:text-gray-300"
            @click="isEditing = true"
          >
            <span class="text-white/50">phone:</span> {{ user.phone || 'none' }}
          </p>
          <p
            class="mb-1 cursor-pointer hover:text-gray-300"
            @click="isEditing = true"
          >
            <span class="text-white/50">bio:</span> {{ user.bio || 'none' }}
          </p>
          <p class="mb-1">
            <span class="text-white/50">verified:</span>
            <span
              :class="user.is_verified ? 'text-green-300' : 'text-red-300'"
              >{{ user.is_verified }}</span
            >
          </p>
          <p class="mb-1">
            <span class="text-white/50">superuser:</span>
            <span
              :class="user.is_superuser ? 'text-green-300' : 'text-white/70'"
              >{{ user.is_superuser }}</span
            >
          </p>
          <p class="text-xs text-white/40">click fields to edit</p>
        </template>

        <template v-if="isEditing">
          <input
            v-model="editForm.username"
            placeholder="username"
            class="mb-2 w-full border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <input
            v-model="editForm.phone"
            placeholder="phone"
            class="mb-2 w-full border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />
          <textarea
            v-model="editForm.bio"
            placeholder="bio"
            class="mb-2 w-full resize-none border-b border-white/20 bg-transparent placeholder-white/60 focus:outline-none"
          />

          <span v-if="errorMsg" class="text-xs text-red-300">{{
            errorMsg
          }}</span>
          <span v-if="successMsg" class="text-xs text-green-300">{{
            successMsg
          }}</span>

          <div class="mt-2 flex gap-2">
            <button
              class="cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-white lowercase hover:bg-gray-600"
              @click="save"
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

      <div v-if="user" class="mt-4 flex justify-center">
        <button
          class="cursor-pointer text-sm text-red-400 lowercase hover:text-red-300"
          @click="showDeleteDialog = true"
        >
          delete user
        </button>
      </div>
    </div>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete user"
      :message="`permanently delete ${user?.email}? this cannot be undone.`"
      confirm-text="delete forever"
      @confirm="confirmDelete"
    />
  </div>
</template>
