import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TodoAdd from '~/components/TodoAdd.vue'
import { useTodoStore } from '~/stores/todos'

// Mock the store
vi.mock('~/stores/todos')

describe('TodoAdd Component', () => {
  let mockStore: ReturnType<typeof useTodoStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockStore = {
      addTodo: vi.fn(),
    } as unknown as ReturnType<typeof useTodoStore>
    vi.mocked(useTodoStore).mockReturnValue(mockStore)
  })

  it('should render form elements', () => {
    const wrapper = mount(TodoAdd)

    expect(wrapper.find('input[placeholder="title"]').exists()).toBe(true)
    expect(wrapper.find('textarea[placeholder="body"]').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('should not submit when fields are empty', async () => {
    const wrapper = mount(TodoAdd)

    await wrapper.find('form').trigger('submit.prevent')

    expect(mockStore.addTodo).not.toHaveBeenCalled()
  })

  it('should not submit when only title is filled', async () => {
    const wrapper = mount(TodoAdd)

    await wrapper.find('input').setValue('test title')
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockStore.addTodo).not.toHaveBeenCalled()
  })

  it('should not submit when only body is filled', async () => {
    const wrapper = mount(TodoAdd)

    await wrapper.find('textarea').setValue('test body')
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockStore.addTodo).not.toHaveBeenCalled()
  })

  it('should submit when both fields are filled', async () => {
    const wrapper = mount(TodoAdd)

    await wrapper.find('input').setValue('test title')
    await wrapper.find('textarea').setValue('test body')
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockStore.addTodo).toHaveBeenCalledWith({
      id: expect.any(Number),
      title: 'test title',
      body: 'test body',
      completed: false,
      deleted: false,
      editing: false,
    })
  })

  it('should clear fields after successful submission', async () => {
    const wrapper = mount(TodoAdd)

    const titleInput = wrapper.find('input')
    const bodyTextarea = wrapper.find('textarea')

    await titleInput.setValue('test title')
    await bodyTextarea.setValue('test body')
    await wrapper.find('form').trigger('submit.prevent')

    // Wait for setTimeout to complete
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect((titleInput.element as HTMLInputElement).value).toBe('')
    expect((bodyTextarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('should show character count when body has content', async () => {
    const wrapper = mount(TodoAdd)

    await wrapper.find('textarea').setValue('test')

    expect(wrapper.text()).toContain('4 / 100')
    expect(wrapper.text()).toContain('Press Enter')
  })

  it('should not show character count when body is empty', () => {
    const wrapper = mount(TodoAdd)

    expect(wrapper.text()).not.toContain('/ 100')
    expect(wrapper.text()).not.toContain('Press Enter')
  })

  it('should submit on Enter key in textarea', async () => {
    const wrapper = mount(TodoAdd)

    await wrapper.find('input').setValue('test title')
    await wrapper.find('textarea').setValue('test body')
    await wrapper.find('textarea').trigger('keydown.enter')

    expect(mockStore.addTodo).toHaveBeenCalled()
  })
})
