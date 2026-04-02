# Minimal List

A modern note-taking application built with Nuxt 4 and TypeScript. Features rich text editing, voice recording, reminders, JWT authentication, Google OAuth, multi-select with bulk actions, an admin dashboard, and a minimalist dark theme — available as a web app on Vercel and an Android app via Capacitor, with a Django REST Framework backend on Render.

**Live Demo:** [minimalist-todo-smoky.vercel.app](https://minimalist-todo-smoky.vercel.app/)

## Tech Stack

- Nuxt 4 / Vue 3 / TypeScript
- TailwindCSS
- Pinia (state management)
- Tiptap (rich text editor)
- Capacitor (Android app)
- JWT Authentication with auto token refresh
- Google OAuth 2.0 (web + native)
- PWA support
- Vitest (unit tests)

## Features

- **Rich Text Editing** — Bold, italic, strikethrough, bullet/ordered lists, task lists with checkboxes via Tiptap
- **Voice Recording** — Record audio notes with in-app playback
- **Reminders** — Set date/time reminders with local notifications (Android) and browser notifications (web)
- **Note Colors** — Color-coded notes with a dark theme palette
- **Pinned Notes** — Pin important notes to the top
- **Soft and Permanent Deletion** — Two-stage delete with restore capability and undo support
- **Smart Filtering** — All, active, completed, deleted (persisted in URL)
- **Multi-Select and Bulk Actions** — Select multiple notes to pin, unpin, delete, or restore at once
- **Optimistic Updates** — Instant UI feedback with automatic rollback on error
- **Infinite Scroll** — Cursor-based pagination
- **Masonry Layout** — Responsive card grid with mobile-optimized interactions
- **Expandable Editor** — Expand notes to a fullscreen editor for longer content
- **Authentication** — JWT with auto token refresh, Google OAuth, email verification, password reset
- **Admin Dashboard** — User and note management, stats, sortable tables, search (superuser only)
- **PWA Support** — Installable with offline detection
- **Android App** — Native Android app via Capacitor with haptic feedback, back button handling, and Google Sign-In

## Project Structure

```
├── android/                     # Capacitor Android project
├── components/
│   ├── TiptapEditor.vue         # Rich text editor (lazy-loaded)
│   ├── TodoCard.vue             # Note card with actions
│   ├── TodoList.vue             # Note list with masonry layout and multi-select
│   ├── TodoAdd.vue              # Note creation form with expand support
│   ├── AudioRecorder.vue        # Voice recording button
│   ├── AudioPlayer.vue          # Audio playback with progress bar
│   ├── ReminderPicker.vue       # Custom date/time picker for reminders
│   ├── ColorPicker.vue          # Note color selector
│   ├── ImagePreview.vue         # Image preview with remove
│   ├── PageHeader.vue           # Reusable page header
│   ├── TodoSkeleton.vue         # Loading skeleton
│   └── ConfirmDialog.vue        # Reusable confirm modal
├── composables/
│   ├── useApiFetch.ts           # API client with JWT, retry, and auto-refresh
│   ├── useAuthApi.ts            # Auth API endpoints
│   ├── useTodoApi.ts            # Note API endpoints
│   ├── useAdminApi.ts           # Admin API endpoints
│   ├── useGoogleAuth.ts         # Platform-aware Google Sign-In (web + native)
│   ├── useReminders.ts          # Reminder scheduling (local notifications + web)
│   ├── useHaptics.ts            # Haptic feedback for native actions
│   ├── useTimeAgo.ts            # Relative timestamp formatting
│   ├── useToast.ts              # Toast notifications with undo support
│   └── useOnline.ts             # Online/offline detection
├── stores/
│   ├── auth.ts                  # Auth state (tokens, user, isAdmin)
│   └── todos.ts                 # Note state with optimistic updates and pagination
├── pages/
│   ├── index.vue                # Main notes page
│   ├── auth/                    # Login, register, profile, forgot-password,
│   │                            # reset-password, verify-email
│   └── admin/                   # Dashboard, users (list/create/detail),
│                                # notes (list/detail)
├── middleware/
│   ├── auth.global.ts           # Route protection with token validation
│   └── admin.ts                 # Admin route protection
├── plugins/
│   ├── google-login.client.ts   # Google OAuth (web + Capacitor native)
│   ├── back-button.client.ts    # Android back button handling
│   ├── reminders.client.ts      # Web reminder polling
│   └── env-validation.client.ts
├── types/
│   ├── auth.d.ts
│   └── todo.d.ts
└── capacitor.config.ts          # Capacitor configuration
```

## Getting Started

### Web

```bash
git clone https://github.com/Evrouin/minimal-list-frontend.git
cd minimal-list-frontend
nvm use
npm install
cp .env.development .env
npm run dev
```

Runs on `http://localhost:3000`. Requires the [Django backend](https://github.com/Evrouin/minimal-list-backend) running on `http://localhost:8000`.

### Android

Requires Android Studio and JDK 21.

```bash
npx nuxi generate
npx cap sync
npx cap run android        # Deploy to connected device
npx cap open android       # Open in Android Studio
```

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Check code with ESLint
npm run lint:fix   # Fix ESLint issues
npm run format     # Format code with Prettier
npm run quality    # Run both linting and formatting
```

## Running Tests

```bash
npm run test
```

## License

MIT

## Author

Evrouin
