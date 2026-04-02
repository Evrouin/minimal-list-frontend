import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TodoAdd from '~/components/TodoAdd.vue'

const mockAddTodo = vi.fn()
vi.mock('~/stores/todos', () => ({
  useTodoStore: () => ({ addTodo: mockAddTodo }),
}))

const mockNoteColors = {
  default: { bg: 'bg-gray-700', hover: '' },
  red: { bg: 'bg-red', hover: '' },
  yellow: { bg: 'bg-yellow', hover: '' },
  green: { bg: 'bg-green', hover: '' },
  purple: { bg: 'bg-purple', hover: '' },
}

vi.stubGlobal('noteColors', mockNoteColors)
vi.stubGlobal('compressImage', (file: File) => file)

const TiptapStub = {
  name: 'TiptapEditor',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue', 'submit'],
  template:
    '<textarea data-testid="body" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}

describe('TodoAdd', () => {
  const mountAdd = () =>
    mount(TodoAdd, {
      global: {
        mocks: { noteColors: mockNoteColors, compressImage: (file: File) => file },
        stubs: {
          LazyTiptapEditor: TiptapStub,
          ImagePreview: true,
          ColorPicker: true,
          Icon: true,
        },
      },
    })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders title input and editor', () => {
    const wrapper = mountAdd()
    expect(wrapper.find('input[placeholder="title"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="body"]').exists()).toBe(true)
  })

  it('does not submit when fields are empty', async () => {
    const wrapper = mountAdd()
    await wrapper.find('form').trigger('submit.prevent')
    expect(mockAddTodo).not.toHaveBeenCalled()
  })

  it('does not submit with only title', async () => {
    const wrapper = mountAdd()
    await wrapper.find('input').setValue('test title')
    await wrapper.find('form').trigger('submit.prevent')
    expect(mockAddTodo).not.toHaveBeenCalled()
  })

  it('submits when both fields are filled', async () => {
    const wrapper = mountAdd()
    await wrapper.find('input').setValue('test title')
    await wrapper.find('[data-testid="body"]').setValue('test body')
    await wrapper.find('form').trigger('submit.prevent')
    expect(mockAddTodo).toHaveBeenCalledWith({
      title: 'test title',
      body: 'test body',
      color: 'default',
    })
  })

  it('add button is disabled when form is invalid', () => {
    const wrapper = mountAdd()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })
})
