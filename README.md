# 📝 Minimalist Todo List

A clean, modern todo application built with Nuxt 3 and Django REST Framework, featuring JWT authentication, Google OAuth, rich text editing, and a minimalist dark theme.

## ✨ Features

- 🔐 **Authentication** — JWT login/register, Google OAuth, email verification, password reset
- 📝 **Rich Text Editing** — Bold, italic, strikethrough, bullet/ordered lists via Tiptap
- 📦 **State Management** with [Pinia](https://pinia.vuejs.org/)
- ⚡ **Optimistic Updates** — Instant UI feedback with rollback on error
- 🎯 **Smart Filtering** — All, Active, Completed, Deleted (persisted in URL)
- ✅ **Toggle Completion** — Mark tasks as done/undone
- ✏️ **Inline Editing** — Click to edit titles and descriptions
- 🗑️ **Soft & Permanent Deletion** — Recover or permanently remove todos
- 🕐 **Relative Timestamps** — "2h ago", "3d ago" on each todo
- 💀 **Loading Skeletons** — Animated placeholders during initial load
- 🎨 **Dark Theme** — Consistent minimalist design
- ⌨️ **Keyboard Shortcuts** — Enter to submit, Cmd/Ctrl+Enter in editor
- ❓ **Help Tooltip** — Formatting guide and shortcuts reference

## 🏗️ Architecture

### Frontend (Nuxt 3)

```
├── components/
│   ├── TiptapEditor.vue     # Rich text editor
│   ├── ConfirmDialog.vue    # Reusable confirm modal
│   ├── TodoSkeleton.vue     # Loading skeleton
│   ├── TodoAdd.vue          # Todo creation with Tiptap
│   ├── TodoList.vue         # Todo display & inline editing
│   └── TodoHeader.vue       # App header
├── composables/
│   ├── useApiFetch.ts       # Centralized API client with JWT & error handling
│   ├── useAuthApi.ts        # Auth API endpoints
│   └── useTodoApi.ts        # Todo API endpoints
├── stores/
│   ├── auth.ts              # Auth state (tokens, user, loading)
│   └── todos.ts             # Todo state with optimistic updates
├── pages/
│   ├── index.vue            # Main todo page
│   └── auth/                # login, register, profile, forgot-password,
│                            # reset-password/[token], verify-email/[token]
├── middleware/
│   └── auth.global.ts       # Route protection
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
- **Todos**: CRUD with soft delete, scoped to authenticated user
- **API**: Wrapped responses `{data, statusCode, timestamp}`
- **Repo**: [django-todo](https://github.com/Evrouin/django-todo)

### Tech Stack

- **Frontend**: [Nuxt 3](https://nuxt.com/), [TailwindCSS](https://tailwindcss.com/), [Pinia](https://pinia.vuejs.org/), [Tiptap](https://tiptap.dev/)
- **Backend**: [Django](https://www.djangoproject.com/), [Django REST Framework](https://www.django-rest-framework.org/), [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- **Auth**: JWT + Google OAuth 2.0
- **Hosting**: [Render](https://render.com/)
- **Language**: TypeScript / Python

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- npm, pnpm, yarn, or bun

### Installation

```bash
git clone https://github.com/Evrouin/nuxt3-todo.git
cd nuxt3-todo
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
npm run lint         # Check code with ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run quality      # Run both linting and formatting
```

## 🎯 Usage

1. **Register/Login** — Create an account or sign in with Google
2. **Add Todo** — Type title and body, click add or press Cmd/Ctrl+Enter
3. **Edit Todo** — Click on any todo text to edit inline
4. **Rich Text** — Use toolbar for bold, italic, strikethrough, lists
5. **Complete Todo** — Click the circle icon to toggle done
6. **Delete Todo** — Click trash icon (soft delete), click again to permanently delete
7. **Filter Todos** — Use filter tabs, persisted in URL

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
