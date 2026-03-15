<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const api = useAdminApi()
const stats = ref<Awaited<ReturnType<typeof api.getStats>> | null>(null)

onMounted(async () => {
  stats.value = await api.getStats()
})
</script>

<template>
  <div
    class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10"
  >
    <div class="w-full max-w-3xl px-4">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">admin dashboard</h1>
        <NuxtLink
          to="/"
          class="text-sm text-white/60 lowercase hover:text-white"
          >back</NuxtLink
        >
      </div>

      <div v-if="!stats" class="p-4 text-sm text-white/40">loading...</div>

      <template v-if="stats">
        <div
          class="mb-3 rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
        >
          <p class="mb-2 font-bold lowercase">users</p>
          <div class="space-y-1 text-white/70">
            <p>
              total: <span class="text-white">{{ stats.users.total }}</span>
            </p>
            <p>
              verified:
              <span class="text-white">{{ stats.users.verified }}</span>
            </p>
            <p>
              joined today:
              <span class="text-white">{{ stats.users.joined_today }}</span>
            </p>
          </div>
        </div>

        <div
          class="mb-5 rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
        >
          <p class="mb-2 font-bold lowercase">todos</p>
          <div class="space-y-1 text-white/70">
            <p>
              total: <span class="text-white">{{ stats.todos.total }}</span>
            </p>
            <p>
              active: <span class="text-white">{{ stats.todos.active }}</span>
            </p>
            <p>
              completed:
              <span class="text-white">{{ stats.todos.completed }}</span>
            </p>
            <p>
              deleted: <span class="text-white">{{ stats.todos.deleted }}</span>
            </p>
          </div>
        </div>
      </template>

      <div class="flex flex-col gap-2 px-4">
        <NuxtLink
          to="/admin/users"
          class="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white lowercase transition-all hover:bg-gray-600"
        >
          manage users →
        </NuxtLink>
        <NuxtLink
          to="/admin/todos"
          class="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white lowercase transition-all hover:bg-gray-600"
        >
          manage todos →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
