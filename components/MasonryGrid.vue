<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import Muuri from 'muuri'

const props = defineProps<{
  items: any[]
  keyField?: string
  dragEnabled?: boolean
}>()

const emit = defineEmits<{
  reorder: [uuid: string, newIndex: number]
  dragStart: []
  dragEnd: []
}>()

const containerRef = ref<HTMLElement>()
let grid: Muuri | null = null
let skipNextSync = false
const columnCount = ref(1)

const updateColumns = () => {
  const width = window.innerWidth
  if (width >= 1024) columnCount.value = 3
  else if (width >= 768) columnCount.value = 2
  else columnCount.value = 1
}

const gap = 20
const itemWidth = computed(() => {
  return `calc(${100 / columnCount.value}% - ${gap}px)`
})

const initGrid = () => {
  destroyGrid()
  if (!containerRef.value) return

  grid = new Muuri(containerRef.value, {
    items: '.muuri-item',
    dragEnabled: props.dragEnabled ?? false,
    dragSort: () => grid ? [grid] : [],
    dragStartPredicate: { delay: 0, distance: 10 },
    dragAutoScroll: {
      targets: [{ element: window, priority: 0 }],
      sortDuringScroll: true,
      smoothStop: true,
    },
    layout: { fillGaps: false, horizontal: false, rounding: false },
    layoutOnResize: 150,
    dragPlaceholder: {
      enabled: true,
      createElement: (item: any) => {
        const el = item.getElement().cloneNode(true) as HTMLElement
        el.style.opacity = '0.3'
        return el
      },
    },
  })

  grid.on('dragStart', () => emit('dragStart'))
  grid.on('dragEnd', (item: any) => {
    emit('dragEnd')
    const el = item.getElement() as HTMLElement
    const uuid = el.dataset.uuid
    if (!uuid || !grid) return
    const newIndex = grid.getItems().indexOf(item)
    if (newIndex >= 0) {
      skipNextSync = true
      emit('reorder', uuid, newIndex)
    }
  })
}

const destroyGrid = () => {
  if (grid) { grid.destroy(); grid = null }
}

const refreshLayout = () => {
  nextTick(() => { grid?.refreshItems(); grid?.layout() })
}

let resizeListener: (() => void) | null = null
onMounted(() => {
  updateColumns()
  resizeListener = () => { updateColumns(); refreshLayout() }
  window.addEventListener('resize', resizeListener)
  nextTick(() => initGrid())
})
onUnmounted(() => {
  if (resizeListener) window.removeEventListener('resize', resizeListener)
  destroyGrid()
})

// Sync items without full re-init to preserve drag state
watch(() => props.items.length, () => {
  if (skipNextSync) { skipNextSync = false; return }
  nextTick(() => initGrid())
})

defineExpose({ containerRef, refreshLayout })
</script>

<template>
  <div ref="containerRef" class="muuri-grid">
    <div
      v-for="(item, idx) in items"
      :key="(keyField && item?.[keyField]) || idx"
      :data-uuid="keyField ? item?.[keyField] : undefined"
      class="muuri-item"
      :style="{ width: itemWidth, margin: gap / 2 + 'px' }"
    >
      <div class="muuri-item-content">
        <slot :item="item" :index="idx" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.muuri-grid {
  position: relative;
  margin: -10px;
}
.muuri-item {
  position: absolute;
  z-index: 1;
  transition: transform 0.3s ease;
}
.muuri-item.muuri-item-dragging {
  z-index: 3;
  transition: none;
}
.muuri-item.muuri-item-releasing {
  z-index: 2;
}
.muuri-item-content {
  position: relative;
}
</style>
