import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TodoAdd from '~/components/TodoAdd.vue'

const mockAddTodo = vi.fn()
vi.mock('~/stores/todos', () => ({
  useTodoStore: () => ({ addTodo: mockAddTodo }),
}))

const TiptapStub = {
  name: 'TiptapEditor',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue', 'submit'],
  template:
    '<textarea data-testid="body" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}

describe('TodoAdd', () => {
  const mountAdd = () =>
    mount(TodoAdd, { global: { stubs: { TiptapEditor: TiptapStub } } })

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
    })
  })

  it('add button is disabled when form is invalid', () => {
    const wrapper = mountAdd()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })
})
