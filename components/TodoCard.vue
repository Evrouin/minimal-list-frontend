<script setup lang="ts">
import type { Todo } from '@/types'

const props = defineProps<{
  todo: Todo
  pinned: boolean
  selected: boolean
  showCheckbox: boolean
  multiSelectMode: boolean
  editImagePreview?: string
}>()

const emit = defineEmits<{
  click: []
  'toggle-pin': []
  'request-delete': []
  'restore': []
  'toggle-completion': []
  save: []
  cancel: []
  'toggle-select': []
  'start-hover': []
  'end-hover': []
  'start-long-press': []
  'end-long-press': []
  'set-editor-ref': [el: { focus: () => void }]
  'image-select': [e: Event]
}>()

const { now, timeAgo } = useTimeAgo()
const showPreview = ref(false)

const colors = computed(() => noteColors[props.todo.color] || noteColors.default)

const cardClasses = computed(() => [
  props.todo.editing
    ? 'p-5 border-0.5 rounded-lg shadow-md flex flex-col gap-2 w-full'
    : 'p-5 border-0.5 rounded-lg shadow-md flex flex-col gap-2 w-full min-h-[120px] max-h-[300px] lg:min-h-0 lg:max-h-[400px]',
  colors.value.bg,
  colors.value.hover,
  'transition-colors duration-200',
  (props.todo.completed || props.todo.deleted) && 'opacity-50',
])
</script>

<template>
  <div
    :class="[...cardClasses, selected && 'ring-2 ring-blue-400']"
    class="relative cursor-pointer"
    @click="emit('click')"
    @mouseenter="!todo.editing && emit('start-hover')"
    @mouseleave="!todo.editing && emit('end-hover')"
    @touchstart.passive="!todo.editing && emit('start-long-press')"
    @touchend="emit('end-long-press')"
    @touchmove="emit('end-long-press')"
  >
    <button
      v-if="multiSelectMode || showCheckbox"
      class="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/60 bg-gray-800 text-xs"
      :class="selected ? 'border-blue-500 bg-blue-500' : ''"
      @click.stop="emit('toggle-select')"
    >
      <Icon v-if="selected" name="uil:check" class="text-white" />
    </button>
    <img v-if="!todo.editing && (todo.thumbnail || todo.image)" :src="todo.thumbnail || todo.image" loading="lazy" class="-mx-5 -mt-5 mb-1 block h-32 cursor-zoom-in rounded-t object-cover" style="width: calc(100% + 2.5rem); min-width: calc(100% + 2.5rem); max-width: none" @click.stop="showPreview = true" />
    <img v-if="todo.editing && (editImagePreview || todo.thumbnail || todo.image)" :src="editImagePreview || todo.thumbnail || todo.image" class="-mx-5 -mt-5 mb-1 block h-32 rounded-t object-cover" style="width: calc(100% + 2.5rem); min-width: calc(100% + 2.5rem); max-width: none" />
    <ModalOverlay :show="showPreview" backdrop-class="bg-black/80" @click="showPreview = false">
      <button class="absolute top-4 right-4 cursor-pointer text-2xl text-white/60 hover:text-white" @click.stop="showPreview = false">✕</button>
      <img :src="todo.image" class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" @click.stop />
    </ModalOverlay>
    <div class="flex w-full items-center justify-between">
      <span
        v-if="!todo.editing"
        class="flex-grow text-sm font-bold text-white lowercase"
      >
        {{ todo.title }}
      </span>
      <!-- eslint-disable vue/no-mutating-props -->
      <input
        v-if="todo.editing"
        v-model="todo.title"
        class="flex-grow border-b border-white/20 bg-transparent text-sm font-bold text-white lowercase focus:outline-none"
        @keydown.enter="emit('save')"
        @click.stop
      />
      <!-- eslint-enable vue/no-mutating-props -->
      <div class="flex items-center space-x-2" @click.stop>
        <button
          class="cursor-pointer rounded p-1 text-sm hover:text-gray-200"
          :class="
            pinned ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400'
          "
          :title="pinned ? 'Unpin' : 'Pin'"
          @click="emit('toggle-pin')"
        >
          <Icon name="mdi:pin" />
        </button>
        <button
          v-if="todo.deleted"
          class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
          title="Restore"
          @click="emit('restore')"
        >
          <Icon name="uil:redo" />
        </button>
        <button
          class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
          :title="`Delete ${todo.title}`"
          @click="emit('request-delete')"
        >
          <Icon name="uil:trash" />
        </button>
        <button
          class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
          :title="todo.completed ? 'Mark as incomplete' : 'Mark as complete'"
          @click="emit('toggle-completion')"
        >
          <Icon :name="todo.completed ? 'uil:check-circle' : 'uil:circle'" />
        </button>
      </div>
    </div>
    <div
      v-if="!todo.editing"
      class="todo-body overflow-hidden text-xs text-wrap break-words text-white lowercase"
      v-html="todo.body"
    />
    <span v-if="!todo.editing && now" class="text-xs text-white/30">{{
      timeAgo(todo.created_at)
    }}</span>
    <div v-if="todo.editing" @click.stop>
      <!-- eslint-disable vue/no-mutating-props -->
      <LazyTiptapEditor
        :ref="
          (el: any) => {
            if (el) emit('set-editor-ref', el)
          }
        "
        v-model="todo.body"
        placeholder="body"
        @submit="emit('save')"
      />
      <!-- eslint-enable vue/no-mutating-props -->
      <div class="mt-1 flex items-center justify-between">
        <!-- eslint-disable vue/no-mutating-props -->
        <ColorPicker v-model="todo.color" />
        <!-- eslint-enable vue/no-mutating-props -->
        <div class="flex items-center gap-1">
          <label class="cursor-pointer rounded p-1 text-white/30 transition-colors hover:text-white/60">
            <Icon name="uil:image" class="text-xs" />
            <input type="file" accept="image/*" class="hidden" @change="(e: Event) => emit('image-select', e)" />
          </label>
          <button
            type="button"
            class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/40 hover:text-white"
            @click="emit('cancel')"
          >
            cancel
          </button>
          <button
            type="button"
            class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/60 hover:text-white"
            @click="emit('save')"
          >
            save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-body :deep(ul) {
  list-style-type: disc;
  padding-left: 1.2rem;
}
.todo-body :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.2rem;
}
.todo-body :deep(li) {
  margin: 0.15rem 0;
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
}
.todo-body :deep(p) {
  margin: 0;
}
.todo-body :deep(ul[data-type='taskList']) {
  list-style: none;
  padding-left: 0;
}
.todo-body :deep(ul[data-type='taskList'] li) {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
}
.todo-body :deep(ul[data-type='taskList'] li > div) {
  min-width: 0;
  flex: 1;
}
.todo-body :deep(ul[data-type='taskList'] li label) {
  pointer-events: none;
}
.todo-body :deep(ul[data-type='taskList'] li label input[type='checkbox']) {
  appearance: none;
  width: 0.9rem;
  height: 0.9rem;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  background: transparent;
  margin-top: 0.15rem;
}
.todo-body
  :deep(ul[data-type='taskList'] li label input[type='checkbox']:checked) {
  background: #60a5fa;
  border-color: #60a5fa;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
  background-size: 100%;
}
</style>
