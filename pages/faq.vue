<script setup lang="ts">
definePageMeta({ layout: false })

const showScrollTop = ref(false)
const pulsing = ref(false)
let pulseTimer: ReturnType<typeof setTimeout> | null = null

const scrollToTop = () => {
  globalThis.scrollTo({ top: 0, behavior: 'smooth' })
  pulsing.value = true
  if (pulseTimer) clearTimeout(pulseTimer)
  pulseTimer = setTimeout(() => {
    pulsing.value = false
  }, 3000)
}

const onScroll = () => {
  showScrollTop.value = globalThis.scrollY > 300
}

onMounted(() => {
  globalThis.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  globalThis.removeEventListener('scroll', onScroll)
  if (pulseTimer) clearTimeout(pulseTimer)
})

const faqs = [
  {
    category: 'general',
    items: [
      {
        q: 'is minimal list free?',
        a: 'yes, minimal list is completely free to use. no subscriptions, no hidden fees.',
        link: { text: 'get started for free', to: '/auth/register' },
      },
      {
        q: 'do i need an account to use it?',
        a: 'you can explore the landing page without signing up. to create and manage your notes, a free account is required. signing up takes less than a minute.',
        link: { text: 'create an account', to: '/auth/register' },
      },
      {
        q: 'is there an android app?',
        a: 'yes. minimal list is available as a native android app with a smooth, app-like experience — including notifications, haptic feedback, and google sign-in.',
      },
      {
        q: 'what browsers are supported?',
        a: 'minimal list works on all modern browsers. for the best experience with notifications and voice recording, we recommend using chrome or a chromium-based browser.',
      },
      {
        q: 'does it work offline?',
        a: "minimal list requires an internet connection to sync your notes. if you go offline, you'll see a notification and changes won't be saved until you're back online.",
      },
    ],
  },
  {
    category: 'account',
    items: [
      {
        q: 'how do i sign in with google?',
        a: 'on the login or register page, tap "continue with google". it\'s quick, secure, and no password is required.',
        link: { text: 'go to login', to: '/auth/login' },
      },
      {
        q: 'how do i verify my email?',
        a: "after signing up, we'll send a verification link to your inbox. just click it to activate your account. if you don't see it, check your spam folder.",
        link: { text: 'sign up', to: '/auth/register' },
      },
      {
        q: "i'm locked out of my account — what do i do?",
        a: "for your security, accounts are temporarily locked after multiple failed login attempts. we'll automatically send an unlock link to your email — just click it to restore access right away.",
      },
      {
        q: 'how do i reset my password?',
        a: 'on the login page, tap "forgot password" and enter your email. we\'ll send you a secure reset link.',
        link: { text: 'forgot password', to: '/auth/forgot-password' },
      },
      {
        q: 'can i change my email or username?',
        a: 'you can update your display name, phone number, and bio from your profile settings at any time.',
        link: { text: 'go to profile', to: '/auth/profile' },
      },
      {
        q: 'can i delete my account?',
        a: 'yes. you can permanently close your account from your profile settings. this will remove all your notes and personal data immediately. this action cannot be undone.',
        link: { text: 'go to profile', to: '/auth/profile' },
      },
      {
        q: 'can i have multiple accounts?',
        a: 'you can create separate accounts with different email addresses. each account has its own private set of notes.',
        link: { text: 'create another account', to: '/auth/register' },
      },
      {
        q: 'how do i sign out of all devices?',
        a: 'go to your profile settings and use the "revoke all sessions" option. this will sign you out everywhere except your current session.',
        link: { text: 'go to profile', to: '/auth/profile' },
      },
    ],
  },
  {
    category: 'notes',
    items: [
      {
        q: 'how do i create a note?',
        a: 'on mobile, tap the + button at the bottom of the screen. on desktop, click the + icon in the top right. you can add a title, body text, image, voice recording, reminder, and color all in one place.',
        link: { text: 'open the app', to: '/' },
      },
      {
        q: 'how do i edit a note?',
        a: 'on desktop, hover over a note to edit it inline. on mobile, tap a note to open the full-screen editor where you can update everything.',
      },
      {
        q: 'how do i pin a note?',
        a: 'pinned notes always stay at the top of your list. hover over a note on desktop to reveal the pin button, or tap the pin icon in the note editor on mobile.',
      },
      {
        q: 'how do i delete and restore a note?',
        a: "deleted notes are moved to a separate view — nothing is gone for good right away. from there, you can restore a note or permanently remove it when you're ready.",
      },
      {
        q: 'can i select multiple notes at once?',
        a: 'yes. on mobile, long-press a note to start selecting. on desktop, hover to reveal the checkbox. you can then pin, unpin, delete, or restore up to 50 notes in one action.',
      },
      {
        q: 'how do i reorder notes?',
        a: 'drag and drop notes to arrange them however you like. on mobile, use the handle on the left side of each card to drag.',
      },
      {
        q: 'how do i filter notes?',
        a: 'use the filter tabs at the top of the page to view all notes, active notes, completed notes, or deleted notes. your filter choice is remembered across sessions.',
      },
      {
        q: 'how do i mark a note as complete?',
        a: 'hover over a note on desktop to reveal the complete button, or tap the circle icon in the note editor on mobile. completed notes move to the "completed" view.',
      },
      {
        q: 'is there a note limit?',
        a: 'there is a reasonable limit per account to ensure a great experience for everyone. most users will never come close to it.',
      },
      {
        q: 'can i search my notes?',
        a: 'search is not yet available but is on our roadmap. for now, use the filter tabs and pin your most important notes to keep them accessible.',
      },
      {
        q: 'do my notes sync across devices?',
        a: 'yes. your notes are stored in the cloud and available on any device — just sign in to your account on web or the android app.',
        link: { text: 'sign in', to: '/auth/login' },
      },
    ],
  },
  {
    category: 'features',
    items: [
      {
        q: 'how do reminders work?',
        a: "set a date and time on any note using the bell icon. on android, you'll receive a push notification at the right time. on web, allow notifications when prompted and keep the tab open.",
      },
      {
        q: 'how do voice recordings work?',
        a: 'tap the microphone icon to record a voice note directly in the app. your recording is saved with the note and can be played back anytime.',
      },
      {
        q: 'what are link previews?',
        a: 'paste any link into a note and minimal list will automatically show a preview — including the page title, description, and image. no extra steps needed.',
      },
      {
        q: 'can i attach images to notes?',
        a: 'yes. tap the image icon in the note editor to upload a photo. a preview is shown on the note card automatically.',
      },
      {
        q: 'what rich text formatting is supported?',
        a: 'you can format your notes with bold, italic, strikethrough, bullet lists, numbered lists, and checkboxes — all from the built-in editor.',
      },
      {
        q: 'what are note colors?',
        a: 'give your notes a personal touch by assigning them a color. colors help you visually organize and distinguish notes at a glance.',
      },
      {
        q: 'what is pull to refresh?',
        a: 'on mobile, simply pull down on the notes list to sync and load the latest updates.',
      },
      {
        q: 'can i export my notes?',
        a: 'note export is not currently available. it is something we are considering for a future update.',
      },
      {
        q: 'does the editor support code blocks?',
        a: 'not at the moment. the editor currently supports rich text formatting like bold, lists, and checkboxes. code block support may be added in a future release.',
      },
      {
        q: 'can i share a note with someone?',
        a: 'notes are private to your account and cannot be shared directly. public sharing is not currently supported.',
      },
    ],
  },
  {
    category: 'privacy & data',
    items: [
      {
        q: 'is my data private?',
        a: 'absolutely. your notes are private to your account only. we never share, sell, or access your personal content.',
      },
      {
        q: 'where is my data stored?',
        a: 'your notes and account information are securely stored on our servers. media files like images and recordings may be delivered through a content delivery network for faster load times.',
      },
      {
        q: 'how is my account secured?',
        a: 'your account is protected with secure token-based authentication. sessions expire automatically, and you can sign out of all devices at any time from your profile.',
        link: { text: 'go to profile', to: '/auth/profile' },
      },
      {
        q: 'how long are deleted notes kept?',
        a: 'deleted notes stay in your deleted view until you choose to permanently remove them. they are not automatically purged, so you can restore them at any time.',
      },
      {
        q: 'what happens to my data if i delete my account?',
        a: 'all your notes, recordings, images, and personal information are permanently and immediately deleted when you close your account. this cannot be reversed.',
        link: { text: 'go to profile', to: '/auth/profile' },
      },
    ],
  },
]
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-800">
    <nav class="flex items-center justify-between px-6 py-4">
      <NuxtLink to="/" class="flex items-center gap-2">
        <img src="~/assets/logo.png" alt="minimal list" class="h-7 w-7" >
        <span class="text-lg font-bold text-white lowercase">minimal list</span>
      </NuxtLink>
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/auth/register"
          :class="pulsing ? 'pulse-cta' : ''"
          class="rounded-lg bg-gray-600 px-4 py-2 text-xs font-medium text-white lowercase transition-colors hover:bg-gray-500"
        >
          get started
        </NuxtLink>
        <NuxtLink to="/auth/login" class="text-xs text-white/40 lowercase hover:text-white/70">login</NuxtLink>
      </div>
    </nav>

    <div class="flex flex-1 flex-col items-center px-6 py-12">
      <div class="w-full max-w-5xl">
        <div class="mb-12 text-center">
          <h1 class="mb-2 text-2xl font-bold text-white lowercase sm:text-3xl">frequently asked questions</h1>
          <p class="text-xs text-white/30">everything you need to know about minimal list.</p>
        </div>

        <!-- desktop: two-column layout -->
        <div class="columns-1 gap-8 sm:columns-2 lg:columns-3">
          <div v-for="section in faqs" :key="section.category" class="mb-8 break-inside-avoid space-y-2">
            <p class="mb-4 text-xs tracking-widest text-white/20 lowercase">{{ section.category }}</p>
            <details v-for="item in section.items" :key="item.q" class="mb-2 rounded-lg bg-gray-700">
              <summary class="cursor-pointer list-none px-5 py-4 text-xs font-medium text-white lowercase">
                {{ item.q }}
              </summary>
              <p class="px-5 pb-1 text-xs leading-relaxed text-white/40">{{ item.a }}</p>
              <div v-if="item.link" class="px-5 pb-4">
                <NuxtLink :to="item.link.to" class="text-xs text-white/40 underline underline-offset-2 hover:text-white/70">
                  {{ item.link.text }} →
                </NuxtLink>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <button
        v-if="showScrollTop"
        class="fixed right-6 bottom-6 z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-700 text-white/60 shadow-lg transition-colors hover:bg-gray-600 hover:text-white"
        @click="scrollToTop"
      >
        <Icon name="uil:arrow-up" class="h-5 w-5" />
      </button>
    </Transition>

    <div class="px-6 pb-6 text-center">
      <p class="text-xs text-white/20">built by evrouin</p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pulse-cta {
  animation: pulse-cta 0.8s ease-in-out infinite;
}

@keyframes pulse-cta {
  0%,
  100% {
    background-color: rgb(75 85 99);
  } /* gray-600 */
  50% {
    background-color: rgb(107 114 128);
  } /* gray-500 */
}
</style>
