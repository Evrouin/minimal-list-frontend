<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  color?: 'green' | 'yellow'
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const bg = computed(() => (props.modelValue ? (props.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-600'))
</script>

<template>
  <button
    type="button"
    class="relative h-5 w-9 cursor-pointer rounded-full transition-colors"
    :class="bg"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform" :class="modelValue ? 'translate-x-4' : ''" />
  </button>
</template>
