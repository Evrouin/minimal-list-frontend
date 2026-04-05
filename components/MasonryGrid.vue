<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
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

const wrapperRef = ref<HTMLElement>()
const containerRef = ref<HTMLElement>()
const ready = ref(false)
let grid: Muuri | null = null
let resizeObserver: ResizeObserver | null = null
let fadeObserver: IntersectionObserver | null = null
let columnCount = 1

const getColumnCount = () => {
  const width = window.innerWidth
  if (width >= 1024) return 3
  if (width >= 640) return 2
  return 1
}

const gap = 20

const getItemWidth = () => {
  const w = wrapperRef.value?.offsetWidth ?? 300
  return Math.floor(w / columnCount - gap)
}

const applyItemWidths = () => {
  const w = getItemWidth()
  containerRef.value?.querySelectorAll<HTMLElement>('.muuri-item').forEach((el) => {
    el.style.width = w + 'px'
  })
}

const refreshLayout = () => {
  if (!grid) return
  grid.refreshItems()
  grid.layout()
}

const initGrid = () => {
  destroyGrid()
  if (!containerRef.value) return

  columnCount = getColumnCount()

  const items = containerRef.value.querySelectorAll<HTMLElement>('.muuri-item')
  if (items.length === 0) return

  applyItemWidths()
  let resizeTimer2: ReturnType<typeof setTimeout> | null = null
  resizeObserver = new ResizeObserver(() => {
    if (resizeTimer2) clearTimeout(resizeTimer2)
    resizeTimer2 = setTimeout(refreshLayout, 50)
  })

  grid = new Muuri(containerRef.value, {
    items: '.muuri-item',
    dragEnabled: props.dragEnabled ?? false,
    dragSort: () => grid ? [grid] : [],
    dragStartPredicate: { delay: 0, distance: 10 },
    dragHandle: columnCount <= 2 ? '.drag-handle' : undefined,
    dragAutoScroll: {
      targets: [{ element: window, priority: 0 }],
      sortDuringScroll: true,
      smoothStop: true,
    },
    dragSortHeuristics: { sortInterval: 70 },
    layout: { fillGaps: false, horizontal: false, rounding: true },
    showDuration: 0,
    hideDuration: 0,
    dragPlaceholder: {
      enabled: true,
      createElement: (item: any) => {
        const el = document.createElement('div')
        el.style.cssText = `width:100%;height:${item.getElement().offsetHeight}px;border-radius:0.5rem;background:rgba(255,255,255,0.05);`
        return el
      },
    },
  })

  grid.on('layoutEnd', () => { ready.value = true })

  grid.on('dragStart', () => emit('dragStart'))
  grid.on('dragEnd', (item: any) => {
    emit('dragEnd')
    const el = item.getElement() as HTMLElement
    const uuid = el.dataset.uuid
    if (!uuid || !grid) return
    const newIndex = grid.getItems().indexOf(item)
    if (newIndex >= 0) emit('reorder', uuid, newIndex)
  })

  containerRef.value.querySelectorAll('.muuri-item').forEach((el) => {
    const content = el.querySelector('.muuri-item-content')
    if (content) resizeObserver!.observe(content)
    el.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', refreshLayout, { once: true })
    })
  })

  fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        (e.target as HTMLElement).classList.add('muuri-item-visible')
        fadeObserver?.unobserve(e.target)
      }
    })
  }, { threshold: 0.05 })
  containerRef.value.querySelectorAll('.muuri-item').forEach((el) => fadeObserver!.observe(el))
}

const destroyGrid = () => {
  resizeObserver?.disconnect()
  resizeObserver = null
  fadeObserver?.disconnect()
  fadeObserver = null
  if (grid) {
    grid.destroy()
    grid = null
  }
  // Clear Muuri's inline styles so fresh init works cleanly
  containerRef.value?.querySelectorAll<HTMLElement>('.muuri-item').forEach((el) => {
    el.style.transform = ''
    el.style.position = ''
    el.style.left = ''
    el.style.top = ''
    el.style.display = ''
  })
  if (containerRef.value) {
    containerRef.value.style.height = ''
  }
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
onMounted(() => {
  columnCount = getColumnCount()
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const newCount = getColumnCount()
      columnCount = newCount
      applyItemWidths()
      if (grid) {
        refreshLayout()
      } else {
        initGrid()
      }
    }, 150)
  })
  nextTick(() => nextTick(() => initGrid()))
})

onUnmounted(() => {
  if (resizeTimer) clearTimeout(resizeTimer)
  destroyGrid()
})

watch(() => props.items.length, (len, oldLen) => {
  if (!len) { destroyGrid(); return }
  const prevLen = oldLen ?? 0

  if (prevLen === 0) {
    nextTick(() => nextTick(() => initGrid()))
    return
  }

  if (len <= prevLen) {
    nextTick(() => {
      if (!grid || !containerRef.value) { initGrid(); return }
      const liveEls = new Set(containerRef.value.querySelectorAll(':scope > .muuri-item'))
      const stale = grid.getItems().filter((i: any) => !liveEls.has(i.getElement()))
      if (stale.length >= (grid.getItems().length || 1)) {
        initGrid()
      } else {
        if (stale.length) grid.remove(stale, { removeElements: false })
        refreshLayout()
      }
    })
    return
  }

  nextTick(() => {
    if (!grid || !containerRef.value) { initGrid(); return }

    const firstMuuriEl = grid.getItems()[0]?.getElement()
    if (firstMuuriEl && !containerRef.value.contains(firstMuuriEl)) {
      initGrid()
      return
    }

    const w = getItemWidth()
    const currentEls = new Set(grid.getItems().map((i: any) => i.getElement()))
    const domEls = Array.from(containerRef.value.querySelectorAll(':scope > .muuri-item')) as HTMLElement[]
    const newEls = domEls.filter((el) => !currentEls.has(el))

    if (newEls.length > 0) {
      newEls.forEach((el) => {
        el.style.width = w + 'px'
        el.style.transition = 'none'
      })
      const firstNewIdx = domEls.indexOf(newEls[0])
      grid.add(newEls, { index: firstNewIdx, layout: false })
      newEls.forEach((el) => {
        const content = el.querySelector('.muuri-item-content')
        if (content) resizeObserver?.observe(content)
        fadeObserver?.observe(el)
        el.querySelectorAll('img').forEach((img) => {
          if (!img.complete) img.addEventListener('load', refreshLayout, { once: true })
        })
      })
      requestAnimationFrame(() => {
        newEls.forEach((el) => { el.style.transition = '' })
        refreshLayout()
      })
    }
  })
}, { flush: 'post' })

defineExpose({ containerRef, refreshLayout, reinit: initGrid, ready })
</script>

<template>
  <div ref="wrapperRef" :style="{ visibility: ready ? 'visible' : 'hidden' }">
    <div ref="containerRef" class="muuri-grid">
      <div
        v-for="(item, idx) in items"
        :key="(keyField && item?.[keyField]) || idx"
        :data-uuid="keyField ? item?.[keyField] : undefined"
        class="muuri-item"
      >
        <div class="muuri-item-content">
          <slot :item="item" :index="idx" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.muuri-grid {
  position: relative;
}
.muuri-item {
  position: absolute;
  margin: 10px;
  z-index: auto;
  transition: transform 0.3s ease;
  opacity: 0;
}
.muuri-item.muuri-item-visible {
  animation: muuri-fade-in 0.5s ease forwards;
}
@keyframes muuri-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
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
