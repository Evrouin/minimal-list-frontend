<script setup lang="ts">
import type { User } from '~/types/auth'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const api = useAdminApi()
const users = ref<User[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout>

const page = ref(1)
const totalCount = ref(0)
const pageSize = 15
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

const showDeleteDialog = ref(false)
const userToDelete = ref<User | null>(null)
const deleting = ref(false)

const sortKey = ref<'email' | 'username' | 'is_active' | 'is_verified' | 'is_superuser' | 'created_at'>('created_at')
const sortAsc = ref(false)

const fetchUsers = async () => {
  try {
    const res = await api.getUsers(page.value, search.value || undefined)
    users.value = res.results
    totalCount.value = res.count
  } catch {
    error.value = 'failed to load users'
  }
}

onMounted(async () => {
  await fetchUsers()
  loading.value = false
})

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searching.value = true
    page.value = 1
    await fetchUsers()
    searching.value = false
  }, 400)
}

const goToPage = async (p: number) => {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  searching.value = true
  await fetchUsers()
  searching.value = false
}

const toggleSort = (key: typeof sortKey.value) => {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const sortedUsers = computed(() => {
  const k = sortKey.value
  const dir = sortAsc.value ? 1 : -1
  return [...users.value].sort((a, b) => {
    const av = a[k],
      bv = b[k]
    if (typeof av === 'boolean') return ((av ? 1 : 0) - (bv ? 1 : 0)) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
})

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const requestDelete = (u: User, e: Event) => {
  e.stopPropagation()
  userToDelete.value = u
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await api.deleteUser(userToDelete.value.uuid)
    users.value = users.value.filter((u) => u.uuid !== userToDelete.value!.uuid)
    totalCount.value--
    showDeleteDialog.value = false
  } catch {
    error.value = 'failed to delete user'
  }
  deleting.value = false
  userToDelete.value = null
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <PageHeader title="users">
      <input
        v-model="search"
        type="text"
        placeholder="search..."
        class="w-40 rounded-lg bg-gray-700 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
        @input="onSearch"
      >
      <NuxtLink to="/admin/users/create" class="text-sm text-white/60 lowercase hover:text-white">create</NuxtLink>
      <NuxtLink to="/admin" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
    </PageHeader>

    <div v-if="loading" class="p-4 text-sm text-white/40">loading...</div>
    <div v-else-if="error" class="p-4 text-sm text-red-400">{{ error }}</div>

    <div v-else :class="searching ? 'opacity-50' : ''" class="flex flex-1 flex-col justify-between">
      <div>
      <!-- mobile: card layout -->
      <div class="flex flex-col gap-3 md:hidden">
        <div
          v-for="u in sortedUsers"
          :key="u.uuid"
          class="cursor-pointer rounded-lg bg-gray-700 p-4 transition-colors hover:bg-gray-600"
          @click="navigateTo(`/admin/users/${u.uuid}`)"
        >
          <div class="mb-2 flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-medium text-white">{{ u.email }}</p>
              <p class="text-xs text-white/50">{{ u.username || '—' }}</p>
            </div>
            <button class="ml-2 cursor-pointer text-red-400 hover:text-red-300" @click="requestDelete(u, $event)">
              <Icon name="uil:trash" class="text-sm" />
            </button>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span :class="u.is_active ? 'text-green-300' : 'text-red-300'">
              {{ u.is_active ? 'active' : 'deactivated' }}
            </span>
            <span :class="u.is_verified ? 'text-green-300' : 'text-red-300'">
              {{ u.is_verified ? 'verified' : 'unverified' }}
            </span>
            <span v-if="u.is_superuser" class="text-yellow-300">admin</span>
            <span class="ml-auto text-white/40">{{ formatDate(u.created_at) }}</span>
          </div>
        </div>
        <div v-if="users.length === 0" class="p-4 text-center text-sm text-white/40">no users</div>
      </div>

      <!-- desktop: table layout -->
      <div class="hidden min-h-[520px] overflow-hidden rounded-lg bg-gray-700 shadow-md md:block">
        <table class="w-full text-left text-xs text-white">
          <thead class="border-b border-white/10 text-xs text-white/50 lowercase">
            <tr>
              <th class="w-64 cursor-pointer px-4 py-3 select-none hover:text-white" @click="toggleSort('email')">
                email
                <span v-if="sortKey === 'email'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer px-4 py-3 select-none hover:text-white" @click="toggleSort('username')">
                username
                <span v-if="sortKey === 'username'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer px-4 py-3 text-center select-none hover:text-white" @click="toggleSort('is_active')">
                active
                <span v-if="sortKey === 'is_active'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer px-4 py-3 text-center select-none hover:text-white" @click="toggleSort('is_verified')">
                verified
                <span v-if="sortKey === 'is_verified'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer px-4 py-3 text-center select-none hover:text-white" @click="toggleSort('is_superuser')">
                admin
                <span v-if="sortKey === 'is_superuser'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer px-4 py-3 text-center select-none hover:text-white" @click="toggleSort('created_at')">
                joined
                <span v-if="sortKey === 'created_at'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in sortedUsers"
              :key="u.uuid"
              class="cursor-pointer border-t border-white/5 transition-colors hover:bg-white/5"
              @click="navigateTo(`/admin/users/${u.uuid}`)"
            >
              <td class="w-64 truncate px-4 py-3">{{ u.email }}</td>
              <td class="px-4 py-3 text-white/70">{{ u.username || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <PillBadge :color="u.is_active ? 'green' : 'red'" :label="u.is_active ? 'yes' : 'no'" />
              </td>
              <td class="px-4 py-3 text-center">
                <PillBadge :color="u.is_verified ? 'green' : 'red'" :label="u.is_verified ? 'yes' : 'no'" />
              </td>
              <td class="px-4 py-3 text-center">
                <PillBadge :color="u.is_superuser ? 'green' : 'muted'" :label="u.is_superuser ? 'yes' : 'no'" />
              </td>
              <td class="px-4 py-3 text-center text-white/50">{{ formatDate(u.created_at) }}</td>
              <td class="px-4 py-3">
                <button class="cursor-pointer text-red-400 hover:text-red-300" @click="requestDelete(u, $event)">
                  <Icon name="uil:trash" />
                </button>
              </td>
            </tr>
            <tr v-for="n in sortedUsers.length > 0 ? pageSize - sortedUsers.length : 0" :key="'empty-' + n" class="border-t border-white/5">
              <td :colspan="7" class="px-4 py-3">&nbsp;</td>
            </tr>
          </tbody>
        </table>
        <div v-if="users.length === 0" class="p-4 text-center text-sm text-white/40">no users</div>
      </div>

      </div>

      <!-- pagination -->
      <AdminPagination :page="page" :total-pages="totalPages" :total-count="totalCount" label="users" @update:page="goToPage" />
    </div>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete user"
      :message="`permanently delete ${userToDelete?.email}? this cannot be undone.`"
      confirm-text="delete forever"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
