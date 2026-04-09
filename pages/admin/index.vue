<script setup lang="ts">
definePageMeta({ middleware: ['admin'], layout: 'admin' })

const api = useAdminApi()
const stats = ref<Awaited<ReturnType<typeof api.getStats>> | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await api.getStats()
  } catch {
    error.value = 'failed to load stats'
  }
})
</script>

<template>
  <div>
    <PageHeader title="admin dashboard" class="px-2.5">
      <NuxtLink to="/" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
    </PageHeader>

    <div class="mx-2.5">
      <div v-if="!stats && !error">
        <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="i in 4" :key="i" class="animate-pulse rounded-lg bg-gray-700 p-4 text-center">
            <div class="mx-auto mb-2 h-8 w-12 rounded bg-gray-600" />
            <div class="mx-auto h-3 w-16 rounded bg-gray-600" />
          </div>
        </div>
        <div class="mb-6 animate-pulse rounded-lg bg-gray-700 p-4">
          <div class="mb-3 h-3 w-28 rounded bg-gray-600" />
          <div class="grid grid-cols-3 gap-3 text-center">
            <div v-for="i in 3" :key="i">
              <div class="mx-auto mb-2 h-6 w-10 rounded bg-gray-600" />
              <div class="mx-auto h-3 w-14 rounded bg-gray-600" />
            </div>
          </div>
        </div>
      </div>
      <div v-if="error" class="p-4 text-sm text-red-400">{{ error }}</div>

      <template v-if="stats">
        <!-- stat cards -->
        <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-lg bg-gray-700 p-4 text-center">
            <p class="text-2xl font-bold text-white">{{ stats.users.total }}</p>
            <p class="text-xs text-white/50">total users</p>
          </div>
          <div class="rounded-lg bg-gray-700 p-4 text-center">
            <p class="text-2xl font-bold text-green-300">{{ stats.users.verified }}</p>
            <p class="text-xs text-white/50">verified</p>
          </div>
          <div class="rounded-lg bg-gray-700 p-4 text-center">
            <p class="text-2xl font-bold text-blue-300">{{ stats.users.joined_today }}</p>
            <p class="text-xs text-white/50">joined today</p>
          </div>
          <div class="rounded-lg bg-gray-700 p-4 text-center">
            <p class="text-2xl font-bold text-white">{{ stats.notes.total }}</p>
            <p class="text-xs text-white/50">total notes</p>
          </div>
        </div>

        <!-- notes breakdown -->
        <div class="mb-6 rounded-lg bg-gray-700 p-4">
          <p class="mb-3 text-xs font-bold tracking-wider text-white/50 lowercase">notes breakdown</p>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div>
              <p class="text-lg font-bold text-blue-300">{{ stats.notes.active }}</p>
              <p class="text-xs text-white/50">active</p>
            </div>
            <div>
              <p class="text-lg font-bold text-green-300">{{ stats.notes.completed }}</p>
              <p class="text-xs text-white/50">completed</p>
            </div>
            <div>
              <p class="text-lg font-bold text-red-300">{{ stats.notes.deleted }}</p>
              <p class="text-xs text-white/50">deleted</p>
            </div>
          </div>
        </div>
      </template>

      <!-- nav links -->
      <div class="flex flex-col gap-2">
        <NuxtLink
          to="/admin/users"
          class="flex items-center justify-between rounded-lg bg-gray-700 px-4 py-3 text-sm text-white lowercase transition-colors hover:bg-gray-600"
        >
          <span>manage users</span>
          <Icon name="uil:arrow-right" class="text-white/40" />
        </NuxtLink>
        <NuxtLink
          to="/admin/todos"
          class="flex items-center justify-between rounded-lg bg-gray-700 px-4 py-3 text-sm text-white lowercase transition-colors hover:bg-gray-600"
        >
          <span>manage notes</span>
          <Icon name="uil:arrow-right" class="text-white/40" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
