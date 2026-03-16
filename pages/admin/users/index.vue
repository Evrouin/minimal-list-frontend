<script setup lang="ts">
import type { User } from '~/types/auth'

definePageMeta({ middleware: ['admin'] })

const api = useAdminApi()
const users = ref<User[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const nextCursor = ref<string | null>(null)
const showDeleteDialog = ref(false)
const userToDelete = ref<User | null>(null)
const search = ref('')
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout>

const error = ref('')
const hasMore = computed(() => !!nextCursor.value)
const parseCursor = (url: string) => new URL(url).pathname + new URL(url).search
const scrollContainer = ref<HTMLElement>()
const showScrollTop = ref(false)

onMounted(async () => {
  try {
    const res = await api.getUsers()
    users.value = res.results
    nextCursor.value = res.next ? parseCursor(res.next) : null
  } catch {
    error.value = 'failed to load users'
  } finally {
    loading.value = false
  }
})

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const res = await api.getUsers(undefined, search.value || undefined)
      users.value = res.results
      nextCursor.value = res.next ? parseCursor(res.next) : null
    } catch {
      error.value = 'search failed'
    } finally {
      searching.value = false
    }
  }, 800)
}

const loadMore = async () => {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const res = await api.getUsers(nextCursor.value)
    users.value.push(...res.results)
    nextCursor.value = res.next ? parseCursor(res.next) : null
  } catch {
    error.value = 'failed to load more'
  } finally {
    loadingMore.value = false
  }
}

const onScroll = (e: Event) => {
  const el = e.target as HTMLElement
  showScrollTop.value = el.scrollTop > 300
  if (hasMore.value && !loadingMore.value && el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    loadMore()
  }
}

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const requestDelete = (u: User, e: Event) => {
  e.stopPropagation()
  e.preventDefault()
  userToDelete.value = u
  showDeleteDialog.value = true
}

const deleting = ref(false)

const sortKey = ref<'email' | 'username' | 'is_verified' | 'is_superuser' | 'created_at'>('created_at')
const sortAsc = ref(false)

const toggleSort = (key: typeof sortKey.value) => {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = true }
}

const sortedUsers = computed(() => {
  const k = sortKey.value
  const dir = sortAsc.value ? 1 : -1
  return [...users.value].sort((a, b) => {
    const av = a[k], bv = b[k]
    if (typeof av === 'boolean') return ((av ? 1 : 0) - (bv ? 1 : 0)) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
})

const confirmDelete = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await api.deleteUser(userToDelete.value.id)
    users.value = users.value.filter((u) => u.id !== userToDelete.value!.id)
    showDeleteDialog.value = false
  } catch {
    error.value = 'failed to delete user'
  }
  deleting.value = false
  userToDelete.value = null
}
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10">
    <div class="w-full max-w-5xl px-4">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">users</h1>
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            type="text"
            placeholder="search..."
            class="w-40 rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none"
            @input="onSearch"
          />
          <NuxtLink
            to="/admin/users/create"
            class="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white lowercase hover:bg-gray-600"
          >+ create</NuxtLink>
          <NuxtLink to="/admin" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
        </div>
      </div>

      <div v-if="loading" class="p-4 text-sm text-white/40">loading...</div>
      <div v-else-if="error" class="p-4 text-sm text-red-400">{{ error }}</div>

      <div
        v-else
        ref="scrollContainer"
        class="scrollbar-hidden relative overflow-y-auto transition-opacity duration-200"
        style="max-height: 70vh"
        :class="searching ? 'opacity-50' : 'opacity-100'"
        @scroll="onScroll"
      >
        <!-- mobile: card layout -->
        <div class="flex flex-col gap-3 md:hidden">
          <div
            v-for="u in sortedUsers"
            :key="u.id"
            class="cursor-pointer rounded-lg bg-gray-700 p-4 transition-colors hover:bg-gray-600"
            @click="navigateTo(`/admin/users/${u.id}`)"
          >
            <div class="mb-2 flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-white">{{ u.email }}</p>
                <p class="text-xs text-white/50">{{ u.username || '—' }}</p>
              </div>
              <button
                class="ml-2 cursor-pointer text-red-400 hover:text-red-300"
                @click="requestDelete(u, $event)"
              >
                <Icon name="uil:trash" class="text-sm" />
              </button>
            </div>
            <div class="flex items-center gap-3 text-xs">
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
        <div class="hidden overflow-hidden rounded-lg bg-gray-700 shadow-md md:block">
          <table class="w-full text-left text-sm text-white">
            <thead class="border-b border-white/10 text-xs text-white/50 lowercase">
              <tr>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('email')">
                  email <span v-if="sortKey === 'email'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('username')">
                  username <span v-if="sortKey === 'username'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('is_verified')">
                  verified <span v-if="sortKey === 'is_verified'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('is_superuser')">
                  admin <span v-if="sortKey === 'is_superuser'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('created_at')">
                  joined <span v-if="sortKey === 'created_at'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="u in sortedUsers"
                :key="u.id"
                class="cursor-pointer border-t border-white/5 transition-colors hover:bg-white/5"
                @click="navigateTo(`/admin/users/${u.id}`)"
              >
                <td class="px-4 py-3">{{ u.email }}</td>
                <td class="px-4 py-3 text-white/70">{{ u.username || '—' }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-xs" :class="u.is_verified ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'">{{ u.is_verified ? 'yes' : 'no' }}</span>
                </td>
                <td class="px-4 py-3">
                  <span v-if="u.is_superuser" class="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">yes</span>
                  <span v-else class="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/30">no</span>
                </td>
                <td class="px-4 py-3 text-white/50">{{ formatDate(u.created_at) }}</td>
                <td class="px-4 py-3">
                  <button class="cursor-pointer text-red-400 hover:text-red-300" @click="requestDelete(u, $event)">
                    <Icon name="uil:trash" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="users.length === 0" class="p-4 text-center text-sm text-white/40">no users</div>
        </div>

        <div v-if="loadingMore" class="p-3 text-center text-sm text-white/40">loading...</div>

        <button
          v-show="showScrollTop"
          class="sticky bottom-2 left-full mr-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-600 text-white/60 shadow-lg transition-colors hover:text-white"
          @click="scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' })"
        >
          <Icon name="uil:arrow-up" />
        </button>
      </div>
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

<style scoped>
.scrollbar-hidden::-webkit-scrollbar { display: none; }
.scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
</style>
