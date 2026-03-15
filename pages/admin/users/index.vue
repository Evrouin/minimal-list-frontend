<script setup lang="ts">
import type { User } from '~/types/auth'

definePageMeta({ middleware: ['admin'] })

const api = useAdminApi()
const users = ref<User[]>([])
const loading = ref(true)
const showDeleteDialog = ref(false)
const userToDelete = ref<User | null>(null)
const search = ref('')
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout>

onMounted(async () => {
  users.value = await api.getUsers()
  loading.value = false
})

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searching.value = true
    users.value = await api.getUsers(search.value || undefined)
    searching.value = false
  }, 800)
}

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const requestDelete = (u: User, e: Event) => {
  e.stopPropagation()
  userToDelete.value = u
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  await api.deleteUser(userToDelete.value.id)
  users.value = users.value.filter((u) => u.id !== userToDelete.value!.id)
  userToDelete.value = null
}
</script>

<template>
  <div
    class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10"
  >
    <div class="w-full max-w-3xl px-4">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">users</h1>
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            type="text"
            placeholder="search..."
            class="w-40 rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none"
            @input="onSearch"
          />
          <NuxtLink
            to="/admin/users/create"
            class="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white lowercase hover:bg-gray-600"
            >+ create</NuxtLink
          >
          <NuxtLink
            to="/admin"
            class="text-sm text-white/60 lowercase hover:text-white"
            >back</NuxtLink
          >
        </div>
      </div>

      <div v-if="loading" class="p-4 text-sm text-white/40">loading...</div>

      <div
        v-else
        class="overflow-hidden rounded-lg shadow-md transition-opacity duration-200"
        :class="searching ? 'opacity-50' : 'opacity-100'"
      >
        <table class="w-full text-left text-sm text-white">
          <thead class="bg-gray-700 text-xs text-white/60 lowercase">
            <tr>
              <th class="px-4 py-3">email</th>
              <th class="px-4 py-3">username</th>
              <th class="px-4 py-3">verified</th>
              <th class="px-4 py-3">admin</th>
              <th class="px-4 py-3">joined</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in users"
              :key="u.id"
              class="cursor-pointer border-t border-white/5 bg-gray-600 transition-colors hover:bg-gray-500"
              @click="navigateTo(`/admin/users/${u.id}`)"
            >
              <td class="px-4 py-3">{{ u.email }}</td>
              <td class="px-4 py-3 text-white/70">{{ u.username || '—' }}</td>
              <td class="px-4 py-3">
                <span
                  :class="u.is_verified ? 'text-green-300' : 'text-red-300'"
                  >{{ u.is_verified ? 'yes' : 'no' }}</span
                >
              </td>
              <td class="px-4 py-3">
                <span
                  :class="u.is_superuser ? 'text-green-300' : 'text-white/40'"
                  >{{ u.is_superuser ? 'yes' : 'no' }}</span
                >
              </td>
              <td class="px-4 py-3 text-white/50">
                {{ formatDate(u.created_at) }}
              </td>
              <td class="px-4 py-3">
                <button
                  class="cursor-pointer text-red-400 hover:text-red-300"
                  @click="requestDelete(u, $event)"
                >
                  <Icon name="uil:trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="users.length === 0"
          class="bg-gray-600 p-4 text-center text-sm text-white/40"
        >
          no users
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete user"
      :message="`permanently delete ${userToDelete?.email}? this cannot be undone.`"
      confirm-text="delete forever"
      @confirm="confirmDelete"
    />
  </div>
</template>
