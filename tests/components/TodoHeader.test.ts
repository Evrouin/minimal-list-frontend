import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoHeader from '~/components/TodoHeader.vue'

describe('TodoHeader Component', () => {
  it('should render with default title', () => {
    const wrapper = mount(TodoHeader)

    expect(wrapper.find('h1').text()).toBe('todos')
  })

  it('should render with custom title prop', () => {
    const wrapper = mount(TodoHeader, {
      props: {
        title: 'My Custom Todo List',
      },
    })

    expect(wrapper.find('h1').text()).toBe('My Custom Todo List')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(TodoHeader)

    const container = wrapper.find('div')
    expect(container.classes()).toContain('flex')
    expect(container.classes()).toContain('justify-between')
    expect(container.classes()).toContain('items-center')

    const title = wrapper.find('h1')
    expect(title.classes()).toContain('text-2xl')
    expect(title.classes()).toContain('font-bold')
    expect(title.classes()).toContain('lowercase')
  })

  it('should render title in lowercase', () => {
    const wrapper = mount(TodoHeader, {
      props: {
        title: 'UPPERCASE TITLE',
      },
    })

    const title = wrapper.find('h1')
    expect(title.classes()).toContain('lowercase')
  })
})
