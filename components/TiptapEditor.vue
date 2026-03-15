<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
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
      }),
      Placeholder.configure({
        placeholder: props.placeholder || 'type something...',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-sm text-white lowercase min-h-[1.5rem]',
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
          !editor.value.isActive('orderedList')
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
    case 'bold': chain.toggleBold().run(); break
    case 'italic': chain.toggleItalic().run(); break
    case 'strike': chain.toggleStrike().run(); break
    case 'bulletList': chain.toggleBulletList().run(); break
    case 'orderedList': chain.toggleOrderedList().run(); break
  }
}

const isActive = (type: string) => editor.value?.isActive(type) ?? false
</script>

<template>
  <div v-if="ready && editor" class="tiptap-wrapper">
    <div class="mb-1 flex gap-1">
      <button
        v-for="btn in [
          { type: 'bold', label: 'B', class: '' },
          { type: 'italic', label: 'I', class: 'italic' },
          { type: 'strike', label: 'S', class: 'line-through' },
          { type: 'bulletList', label: '•', class: '' },
          { type: 'orderedList', label: '1.', class: '' },
        ]"
        :key="btn.type"
        type="button"
        :class="[
          'rounded px-1.5 py-0.5 text-xs transition-colors cursor-pointer',
          btn.class,
          isActive(btn.type)
            ? 'bg-white/20 text-white'
            : 'text-white/40 hover:text-white/70',
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
  color: rgb(255 255 255 / 0.4);
  pointer-events: none;
  height: 0;
}
.tiptap-wrapper .tiptap ul { list-style-type: disc; padding-left: 1.2rem; }
.tiptap-wrapper .tiptap ol { list-style-type: decimal; padding-left: 1.2rem; }
.tiptap-wrapper .tiptap li { margin: 0.15rem 0; }
.tiptap-wrapper .tiptap strong { font-weight: 700; }
.tiptap-wrapper .tiptap em { font-style: italic; }
.tiptap-wrapper .tiptap s { text-decoration: line-through; }
.tiptap-wrapper .tiptap p { margin: 0; }
</style>
