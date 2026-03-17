<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const close = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const confirm = () => {
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="props.modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="!props.loading && close()"
      >
        <div class="mx-4 w-full max-w-sm rounded-lg bg-gray-700 p-5 shadow-md">
          <h3 class="text-md mb-2 font-bold text-white lowercase">
            {{ props.title || 'confirm' }}
          </h3>
          <p class="mb-4 text-xs text-white/70 lowercase">
            {{ props.message || 'are you sure?' }}
          </p>
          <div class="flex justify-end gap-2">
            <button
              class="cursor-pointer rounded-lg px-4 py-2 text-xs text-white/60 lowercase hover:text-white"
              :disabled="props.loading"
              @click="close"
            >
              {{ props.cancelText || 'cancel' }}
            </button>
            <button
              class="cursor-pointer rounded-lg bg-red-500/20 px-4 py-2 text-xs text-red-300 lowercase transition-all duration-200 hover:bg-red-500/30 disabled:opacity-50"
              :disabled="props.loading"
              @click="confirm"
            >
              {{ props.loading ? 'deleting...' : props.confirmText || 'confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
