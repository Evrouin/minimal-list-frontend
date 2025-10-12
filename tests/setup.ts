import { vi } from 'vitest'

// Mock Nuxt composables
vi.mock('#app', () => ({
  defineNuxtPlugin: vi.fn(),
  useNuxtApp: vi.fn(() => ({
    $router: {
      push: vi.fn(),
      replace: vi.fn(),
    },
  })),
}))

// Mock Nuxt Icon component
vi.mock('@nuxt/icon', () => ({
  Icon: {
    name: 'Icon',
    template: '<span>{{ name }}</span>',
    props: ['name'],
  },
}))

// Global test setup
global.defineNuxtPlugin = vi.fn()
global.useNuxtApp = vi.fn(() => ({
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
  },
}))
