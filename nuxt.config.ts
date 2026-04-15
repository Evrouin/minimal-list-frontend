import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  app: {
    head: {
      title: 'minimal list',
      meta: [
        { name: 'description', content: 'a minimalist space for your notes and recordings. built to keep you focused.' },
        { name: 'theme-color', content: '#1f2937' },
        { property: 'og:title', content: 'minimal list' },
        { property: 'og:description', content: 'a minimalist note-taking app with rich text editing, voice recording and reminders' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://minimal-list.evrouin.com' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'minimal list' },
        { name: 'twitter:description', content: 'a minimalist note-taking app with rich text editing, voice recording and reminders' },
      ],
      link: [
        { rel: 'canonical', href: 'https://minimal-list.evrouin.com' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ],
      script: [
        { innerHTML: "(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);document.querySelector('meta[name=theme-color]')?.setAttribute('content',t==='light'?'#F1F3F4':'#1f2937')})()", tagPosition: 'head' },
        { src: 'https://www.googletagmanager.com/gtag/js?id=G-JHQMQRX3QT', async: true },
        { innerHTML: "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-JHQMQRX3QT')" },
      ],
    },
  },
  modules: ['@nuxt/ui', '@nuxt/icon', '@nuxt/eslint', '@pinia/nuxt', '@nuxt/fonts'],
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
  spaLoadingTemplate: true,
  routeRules: {
    '/**': {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
    '/_nuxt/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_fonts/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/favicon.png': {
      headers: {
        'Cache-Control': 'public, max-age=604800',
      },
    },
    '/favicon.ico': {
      headers: {
        'Cache-Control': 'public, max-age=604800',
      },
    },
  },
  runtimeConfig: {
    public: {
      authApiBase:
        process.env.AUTH_API_BASE || 'http://localhost:8000/api/auth',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      maintenanceMode: process.env.NUXT_PUBLIC_MAINTENANCE_MODE === 'true',
      cdnUrl: process.env.NUXT_PUBLIC_CDN_URL || '',
      cdnFallbackUrl: process.env.NUXT_PUBLIC_CDN_FALLBACK_URL || '',
    },
  },
})
