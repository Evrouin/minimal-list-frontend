<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
}>()

const editor = shallowRef<Editor | null>(null)
const ready = ref(false)

onMounted(() => {
  const instance = new Editor({
    content: props.modelValue,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
        code: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({
        placeholder: props.placeholder || 'type something...',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-xs text-white lowercase min-h-[1.5rem]',
      },
      handleKeyDown: (_view: unknown, event: KeyboardEvent) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          emit('submit')
          return true
        }
        if (
          event.key === 'Enter' &&
          !event.shiftKey &&
          editor.value &&
          !editor.value.isActive('bulletList') &&
          !editor.value.isActive('orderedList') &&
          !editor.value.isActive('taskList')
        ) {
          event.preventDefault()
          emit('submit')
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: e }) => {
      emit('update:modelValue', e.getHTML())
    },
  })
  editor.value = instance
  ready.value = true
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && editor.value.getHTML() !== val) {
      editor.value.commands.setContent(val, { emitUpdate: false })
    }
  },
)

onBeforeUnmount(() => editor.value?.destroy())

const toggle = (type: string) => {
  if (!editor.value) return
  const chain = editor.value.chain().focus()
  switch (type) {
    case 'bold':
      chain.toggleBold().run()
      break
    case 'italic':
      chain.toggleItalic().run()
      break
    case 'strike':
      chain.toggleStrike().run()
      break
    case 'bulletList':
      chain.toggleBulletList().run()
      break
    case 'orderedList':
      chain.toggleOrderedList().run()
      break
    case 'taskList':
      chain.toggleTaskList().run()
      break
  }
}

const isActive = (type: string) => editor.value?.isActive(type) ?? false

defineExpose({ focus: () => editor.value?.commands.focus() })
</script>

<template>
  <div v-if="ready && editor" class="tiptap-wrapper">
    <div class="mb-2 flex gap-1">
      <button
        v-for="btn in [
          { type: 'bold', label: 'B', class: '' },
          { type: 'italic', label: 'I', class: 'italic' },
          { type: 'strike', label: 'S', class: 'line-through' },
          { type: 'bulletList', label: '•', class: '' },
          { type: 'orderedList', label: '1.', class: '' },
          { type: 'taskList', label: '☑', class: '' },
        ]"
        :key="btn.type"
        type="button"
        :class="[
          'cursor-pointer rounded px-1.5 py-0.5 text-xs transition-colors',
          btn.class,
          isActive(btn.type) ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70',
        ]"
        @mousedown.prevent="toggle(btn.type)"
      >
        {{ btn.label }}
      </button>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<style>
.tiptap-wrapper .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: color-mix(in srgb, var(--color-white) 40%, transparent);
  pointer-events: none;
  height: 0;
}
.tiptap-wrapper .tiptap ul {
  list-style-type: disc;
  padding-left: 1.2rem;
}
.tiptap-wrapper .tiptap ol {
  list-style-type: decimal;
  padding-left: 1.2rem;
}
.tiptap-wrapper .tiptap li {
  margin: 0.15rem 0;
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
}
.tiptap-wrapper .tiptap strong {
  font-weight: 700;
}
.tiptap-wrapper .tiptap em {
  font-style: italic;
}
.tiptap-wrapper .tiptap s {
  text-decoration: line-through;
}
.tiptap-wrapper .tiptap p {
  margin: 0;
}
.tiptap-wrapper .tiptap ul[data-type='taskList'] {
  list-style: none;
  padding-left: 0;
}
.tiptap-wrapper .tiptap ul[data-type='taskList'] li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
}
.tiptap-wrapper .tiptap ul[data-type='taskList'] li > div {
  min-width: 0;
  flex: 1;
}
.tiptap-wrapper .tiptap ul[data-type='taskList'] li label {
  flex-shrink: 0;
}
.tiptap-wrapper .tiptap ul[data-type='taskList'] li label input[type='checkbox'] {
  cursor: pointer;
  appearance: none;
  width: 0.9rem;
  height: 0.9rem;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  background: transparent;
}
.tiptap-wrapper .tiptap ul[data-type='taskList'] li label input[type='checkbox']:checked {
  background: #60a5fa;
  border-color: #60a5fa;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
  background-size: 100%;
}
</style>
