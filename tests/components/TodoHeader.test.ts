import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoHeader from '~/components/TodoHeader.vue'

describe('TodoHeader', () => {
  it('renders default title', () => {
    const wrapper = mount(TodoHeader)
    expect(wrapper.find('h1').text()).toBe('todos')
  })

  it('renders custom title', () => {
    const wrapper = mount(TodoHeader, { props: { title: 'My List' } })
    expect(wrapper.find('h1').text()).toBe('My List')
  })

  it('has lowercase class', () => {
    const wrapper = mount(TodoHeader)
    expect(wrapper.find('h1').classes()).toContain('lowercase')
  })
})
