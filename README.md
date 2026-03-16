# Minimal List

A modern note-taking application built with Nuxt 4 and TypeScript. Features rich text editing, JWT authentication, Google OAuth, multi-select with bulk actions, an admin dashboard, and a minimalist dark theme — deployed on Vercel with a Django REST Framework backend on Render.

**Live Demo:** [minimalist-todo-smoky.vercel.app](https://minimalist-todo-smoky.vercel.app/)

## Tech Stack

- Nuxt 4 / Vue 3 / TypeScript
- TailwindCSS
- Pinia (state management)
- Tiptap (rich text editor)
- JWT Authentication with auto token refresh
- Google OAuth 2.0
- PWA support
- Vitest (unit tests)

## Features

- **Rich Text Editing** — Bold, italic, strikethrough, bullet/ordered lists, task lists with checkboxes via Tiptap
- **Pinned Notes** — Pin important notes to the top
- **Soft and Permanent Deletion** — Two-stage delete with restore capability and undo support
- **Smart Filtering** — All, active, completed, deleted (persisted in URL)
- **Multi-Select and Bulk Actions** — Select multiple notes to pin, unpin, delete, or restore at once
- **Optimistic Updates** — Instant UI feedback with automatic rollback on error
- **Infinite Scroll** — Cursor-based pagination
- **Masonry Layout** — Responsive card grid with mobile-optimized interactions
- **Authentication** — JWT with auto token refresh, Google OAuth, email verification, password reset
- **Admin Dashboard** — User and note management, stats, sortable tables, search (superuser only)
- **PWA Support** — Installable with offline detection

## Project Structure

```
├── components/
│   ├── TiptapEditor.vue       # Rich text editor (lazy-loaded)
│   ├── TodoCard.vue           # Note card with actions
│   ├── TodoList.vue           # Note list with masonry layout and multi-select
│   ├── TodoAdd.vue            # Note creation form
│   ├── PageHeader.vue         # Reusable page header
│   ├── TodoSkeleton.vue       # Loading skeleton
│   └── ConfirmDialog.vue      # Reusable confirm modal
├── composables/
│   ├── useApiFetch.ts         # API client with JWT, retry, and auto-refresh
│   ├── useAuthApi.ts          # Auth API endpoints
│   ├── useTodoApi.ts          # Todo API endpoints
│   ├── useAdminApi.ts         # Admin API endpoints
│   ├── useTimeAgo.ts          # Relative timestamp formatting
│   ├── useToast.ts            # Toast notifications with undo support
│   └── useOnline.ts           # Online/offline detection
├── stores/
│   ├── auth.ts                # Auth state (tokens, user, isAdmin)
│   └── todos.ts               # Note state with optimistic updates and pagination
├── pages/
│   ├── index.vue              # Main notes page
│   ├── auth/                  # Login, register, profile, forgot-password,
│   │                          # reset-password, verify-email
│   └── admin/                 # Dashboard, users (list/create/detail),
│                              # todos (list/detail)
├── middleware/
│   ├── auth.global.ts         # Route protection with token validation
│   └── admin.ts               # Admin route protection
├── plugins/
│   ├── google-login.client.ts
│   └── env-validation.client.ts
└── types/
    ├── auth.d.ts
    └── todo.d.ts
```

## Getting Started

```bash
git clone https://github.com/Evrouin/minimal-list-frontend.git
cd minimal-list-frontend
nvm use
npm install
cp .env.development .env
npm run dev
```

Runs on `http://localhost:3000`. Requires the [Django backend](https://github.com/Evrouin/minimal-list-backend) running on `http://localhost:8000`.

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
