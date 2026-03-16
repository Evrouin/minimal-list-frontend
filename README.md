# 📝 minimal list

A clean, modern note-taking application built with Nuxt 4 and Django REST Framework, featuring JWT authentication, Google OAuth, rich text editing, and a minimalist dark theme inspired by Google Keep.

🔗 **Live Demo**: [minimalist-todo-smoky.vercel.app](https://minimalist-todo-smoky.vercel.app/)

## ✨ Features

### Core
- 📝 **Rich Text Editing** — Bold, italic, strikethrough, bullet/ordered lists, task lists with checkboxes via Tiptap
- 📌 **Pinned Notes** — Pin important notes to the top
- ✏️ **Inline & Dialog Editing** — Inline editing on mobile, Google Keep-style dialog on desktop
- 🗑️ **Soft & Permanent Deletion** — Recover or permanently remove notes with undo support
- ✅ **Task Completion** — Mark notes as done/undone
- 🎯 **Smart Filtering** — All, Active, Completed, Deleted (persisted in URL)

### Multi-Select & Bulk Actions
- ☑️ **Multi-Select** — Hover checkbox (desktop) or long press (mobile) to select multiple notes
- 🗂️ **Bulk Actions** — Pin, unpin, or delete multiple notes at once
- ↩️ **Undo with Toast** — 5-second grace period with undo for delete and pin actions

### UX & Performance
- ⚡ **Optimistic Updates** — Instant UI feedback with automatic rollback on error
- 📶 **Offline Detection** — Banner notification when disconnected
- 📄 **Infinite Scroll** — Cursor-based pagination with scroll-to-top button
- 🧱 **Masonry Layout** — Google Keep-style card grid on desktop
- 📱 **Responsive Design** — Adaptive layout with mobile-optimized interactions
- ⌨️ **Keyboard Shortcuts** — Cmd/Ctrl+Enter to save, formatting shortcuts
- 🎨 **Dark Theme** — Consistent minimalist design across all screens

### Auth & Admin
- 🔐 **Authentication** — JWT login/register, Google OAuth, email verification, password reset
- 🔄 **Auto Token Refresh** — Silently refreshes expired access tokens
- 🛡️ **Admin Dashboard** — User & note management, stats, search (superuser only)

## 🏗️ Architecture

### Frontend (Nuxt 4)

```
├── components/
│   ├── TiptapEditor.vue     # Rich text editor (lazy-loaded)
│   ├── TodoCard.vue         # Reusable note card component
│   ├── TodoList.vue         # Note list with masonry layout & multi-select
│   ├── TodoAdd.vue          # Note creation form
│   ├── TodoHeader.vue       # App header
│   ├── TodoSkeleton.vue     # Loading skeleton
│   └── ConfirmDialog.vue    # Reusable confirm modal
├── composables/
│   ├── useApiFetch.ts       # API client with JWT, retry & auto-refresh
│   ├── useAuthApi.ts        # Auth API endpoints
│   ├── useTodoApi.ts        # Todo API endpoints
│   ├── useAdminApi.ts       # Admin API endpoints
│   ├── useTimeAgo.ts        # Relative timestamp formatting
│   ├── useUndoToast.ts      # Toast notifications with undo support
│   └── useOnline.ts         # Online/offline detection
├── stores/
│   ├── auth.ts              # Auth state (tokens, user, isAdmin)
│   └── todos.ts             # Note state with optimistic updates & pagination
├── pages/
│   ├── index.vue            # Main notes page
│   ├── auth/                # login, register, profile, forgot-password,
│   │                        # reset-password/[token], verify-email/[token]
│   └── admin/               # dashboard, users (list/create/detail),
│                            # todos (list/detail)
├── middleware/
│   ├── auth.global.ts       # Route protection with token validation
│   └── admin.ts             # Admin route protection
├── plugins/
│   ├── google-login.client.ts
│   └── env-validation.client.ts
├── types/
│   ├── auth.d.ts
│   └── todo.d.ts
└── error.vue                # Error boundary
```

### Backend (Django REST Framework)

- **Auth**: JWT tokens, Google OAuth, email verification, password reset
- **Notes**: CRUD with soft delete, pinning, cursor pagination, bulk actions
- **Admin**: User & note management, dashboard stats, search
- **API**: Wrapped responses `{data, statusCode, timestamp}`
- **Repo**: [django-todo](https://github.com/Evrouin/django-todo)

### Tech Stack

- **Frontend**: [Nuxt 4](https://nuxt.com/), [TailwindCSS](https://tailwindcss.com/), [Pinia](https://pinia.vuejs.org/), [Tiptap](https://tiptap.dev/)
- **Backend**: [Django](https://www.djangoproject.com/), [Django REST Framework](https://www.django-rest-framework.org/), [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- **Auth**: JWT + Google OAuth 2.0
- **Language**: TypeScript / Python

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- npm, pnpm, yarn, or bun

### Installation

```bash
git clone https://github.com/Evrouin/nuxt3-todo.git
cd nuxt3-todo
nvm use
npm install
```

### Environment

Copy the appropriate env file:

```bash
# Local development
cp .env.development .env

# Production
cp .env.production .env
```

### Development

```bash
npm run dev
```

Runs on `http://localhost:3000`. Requires the Django backend running on `http://localhost:8000`.

## 📜 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Check code with ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run quality      # Run both linting and formatting
```

## 🎯 Usage

1. **Register/Login** — Create an account or sign in with Google
2. **Create Note** — Type title and body, click add or press Cmd/Ctrl+Enter
3. **Edit Note** — Click any note to edit (inline on mobile, dialog on desktop)
4. **Rich Text** — Use toolbar for bold, italic, strikethrough, lists, task lists
5. **Pin Note** — Click the pin icon to keep important notes at the top
6. **Complete Note** — Click the circle icon to toggle done
7. **Delete Note** — Click trash icon (soft delete), undo within 5 seconds, or permanently delete
8. **Multi-Select** — Hover (desktop) or long press (mobile) to select, then bulk pin or delete
9. **Filter Notes** — Use filter tabs to view all, active, completed, or deleted notes
10. **Admin** — Superusers see a settings icon to access the admin dashboard

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
