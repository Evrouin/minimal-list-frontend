# Minimal List

A modern note-taking application built with Nuxt 4 and TypeScript. Features rich text editing, voice recording, reminders, link previews, JWT authentication, Google OAuth, multi-select with bulk actions, an admin dashboard, and a minimalist dark theme — available as a web app and an Android app via Capacitor, with a Django REST Framework backend.

**Live Demo:** [minimal-list.evrouin.com](https://minimal-list.evrouin.com/)

## Tech Stack

- Nuxt 4 / Vue 3 / TypeScript
- TailwindCSS
- Pinia (state management)
- Tiptap (rich text editor)
- Muuri (masonry drag-and-drop layout)
- Capacitor (Android app)
- JWT Authentication with auto token refresh and rotation
- Google OAuth 2.0 (web + native)
- Vitest

## Features

- **Authentication** — JWT with auto token refresh and rotation, Google OAuth, email verification, password reset, account lockout with unlock via email
- **Admin Dashboard** — User and note management, stats, sortable tables, search (superuser only)
- **Android App** — Native Android app via Capacitor with haptic feedback, back button handling, and Google Sign-In
- **Public Landing Page** — Accessible without login

### Note Features

- **Rich Text Editing** — Bold, italic, strikethrough, bullet/ordered lists, task lists with checkboxes via Tiptap
- **Voice Recording** — Record audio notes with in-app playback
- **Reminders** — Custom date/time picker with local notifications (Android) and browser notifications (web)
- **Link Previews** — Auto-fetches Open Graph metadata for URLs in notes
- **Note Colors** — Color-coded notes with a dark theme palette
- **Image Attachments** — Upload images with thumbnail generation and CDN fallback
- **Expandable Editor** — Expand notes to a fullscreen editor with pin, delete, and completion actions
- **Masonry Layout** — Responsive drag-and-drop card grid powered by Muuri
- **Pinned Notes** — Pin important notes to the top
- **Multi-Select and Bulk Actions** — Select multiple notes to pin, unpin, delete, or restore at once (max 50)
- **Infinite Scroll** — Cursor-based pagination
- **Smart Filtering** — All, active, completed, deleted (persisted in URL)
- **Pull to Refresh** — Native-style pull-to-refresh on mobile

## Project Structure

```
├── android/                     # Capacitor Android project
├── components/
│   ├── TiptapEditor.vue         # Rich text editor (lazy-loaded)
│   ├── TodoCard.vue             # Note card with actions
│   ├── TodoList.vue             # Note list with masonry layout and multi-select
│   ├── TodoAdd.vue              # Note creation form with fullscreen expand support
│   ├── TodoHeader.vue           # Notes page header with filter tabs
│   ├── TodoSkeleton.vue         # Loading skeleton
│   ├── MasonryGrid.vue          # Muuri-powered masonry drag-and-drop grid
│   ├── AudioRecorder.vue        # Voice recording button with loading state
│   ├── AudioPlayer.vue          # Audio playback with progress bar and CDN fallback
│   ├── ReminderPicker.vue       # Custom 12h date/time picker for reminders
│   ├── LinkPreviewCard.vue      # URL preview card with Open Graph metadata
│   ├── ColorPicker.vue          # Note color selector
│   ├── ImagePreview.vue         # Image preview with remove
│   ├── AdminPagination.vue      # Pagination controls for admin tables
│   ├── PillBadge.vue            # Status badge pill
│   ├── ToggleSwitch.vue         # Accessible toggle switch
│   ├── AuthFormCard.vue         # Reusable auth form wrapper
│   ├── ModalOverlay.vue         # Reusable modal backdrop
│   ├── PageHeader.vue           # Reusable page header
│   └── ConfirmDialog.vue        # Reusable confirm modal
├── composables/
│   ├── useApiFetch.ts           # API client with JWT, retry, refresh queue, and timeout
│   ├── useAuthApi.ts            # Auth API endpoints (login, register, verify, unlock, reset)
│   ├── useTodoApi.ts            # Note API endpoints (CRUD, bulk actions, link preview)
│   ├── useAdminApi.ts           # Admin API endpoints
│   ├── useGoogleAuth.ts         # Platform-aware Google Sign-In (web + native)
│   ├── useReminders.ts          # Reminder scheduling (local notifications + web)
│   ├── useLinkPreviews.ts       # URL extraction and preview fetching
│   ├── useHaptics.ts            # Haptic feedback for native actions
│   ├── useMediaFallback.ts      # CDN image/audio fallback
│   ├── useTimeAgo.ts            # Relative timestamp formatting (past + future)
│   ├── useToast.ts              # Toast notifications with undo support
│   ├── useOnline.ts             # Online/offline detection
│   ├── useTodoEditing.ts        # Inline and dialog note editing logic
│   ├── useTodoSelection.ts      # Multi-select and long-press selection
│   ├── useBulkActions.ts        # Bulk pin, delete, restore actions
│   ├── useSortableReorder.ts    # Drag-and-drop reorder handling
│   └── usePullToRefresh.ts      # Pull-to-refresh gesture
├── stores/
│   ├── auth.ts                  # Auth state (tokens, user, isAdmin)
│   └── todos.ts                 # Note state with optimistic updates and pagination
├── pages/
│   ├── index.vue                # Main notes page (public landing + authenticated view)
│   ├── auth/                    # Login, register, profile, forgot-password,
│   │                            # reset-password, verify-email, unlock-account
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
│   ├── todo.d.ts
│   └── api.d.ts                 # Shared API/fetch types
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
