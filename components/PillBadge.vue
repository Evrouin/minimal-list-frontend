<script setup lang="ts">
defineProps<{
  color: 'green' | 'red' | 'yellow' | 'blue' | 'muted' | 'orange'
  label: string
}>()

const colors = {
  green: 'bg-green-500/20 text-green-300',
  red: 'bg-red-500/20 text-red-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  blue: 'bg-blue-500/20 text-blue-300',
  muted: 'bg-white/5 text-white/30',
  orange: 'bg-orange-500/20 text-orange-300',
}
</script>

<template>
  <span class="rounded-full px-2 py-0.5 text-xs" :class="colors[color]">{{ label }}</span>
</template>
