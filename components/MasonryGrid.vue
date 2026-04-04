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
    dragSortHeuristics: { sortInterval: 70 },
    layout: { fillGaps: false, horizontal: false, rounding: true },
    layoutOnResize: 200,
    dragPlaceholder: {
      enabled: true,
      createElement: (item: any) => {
        const el = document.createElement('div')
        el.style.cssText = `width:100%;height:${item.getElement().offsetHeight}px;border-radius:0.5rem;background:rgba(255,255,255,0.05);`
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

const refreshAfterRender = () => {
  refreshLayout()
  setTimeout(() => refreshLayout(), 100)
  setTimeout(() => refreshLayout(), 500)
  containerRef.value?.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', () => refreshLayout(), { once: true })
  })
}

let resizeListener: (() => void) | null = null
onMounted(() => {
  updateColumns()
  resizeListener = () => { updateColumns(); refreshLayout() }
  window.addEventListener('resize', resizeListener)
  nextTick(() => {
    initGrid()
    refreshAfterRender()
  })
})
onUnmounted(() => {
  if (resizeListener) window.removeEventListener('resize', resizeListener)
  destroyGrid()
})

watch(() => props.items.length, (newLen, oldLen) => {
  if (skipNextSync) { skipNextSync = false; return }
  nextTick(() => {
    if (!grid || !containerRef.value) {
      initGrid()
      refreshAfterRender()
      return
    }

    const currentEls = new Set(grid.getItems().map((i: any) => i.getElement()))
    const domEls = Array.from(containerRef.value.querySelectorAll(':scope > .muuri-item')) as HTMLElement[]

    const newEls = domEls.filter((el) => !currentEls.has(el))
    if (newEls.length > 0) {
      // Disable transition so new items don't animate from top-left
      newEls.forEach((el) => el.style.transition = 'none')
      grid.add(newEls, { layout: false })
      requestAnimationFrame(() => {
        newEls.forEach((el) => el.style.transition = '')
      })
    }

    const domSet = new Set(domEls)
    const removed = grid.getItems().filter((i: any) => !domSet.has(i.getElement()))
    if (removed.length > 0) {
      grid.remove(removed, { layout: false, removeElements: false })
    }

    refreshAfterRender()
  })
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
  z-index: auto;
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
