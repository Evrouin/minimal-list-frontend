import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  modules: ['@nuxt/ui', '@nuxt/icon', '@nuxt/eslint', '@pinia/nuxt'],
  icon: {
    clientBundle: {
      scan: true,
    },
    serverBundle: {
      collections: ['uil', 'mdi', 'logos'],
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'vue3-google-login',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extension-placeholder',
        '@tiptap/extension-task-list',
        '@tiptap/extension-task-item',
      ],
    },
  },
  ssr: false,
  routeRules: {
    '/**': {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
  },
  runtimeConfig: {
    public: {
      authApiBase:
        process.env.AUTH_API_BASE || 'http://localhost:8000/api/auth',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    },
  },
})
