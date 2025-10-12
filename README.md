# 📝 Minimalist Todo List

A clean, modern todo application built with Nuxt 3, featuring state management, local persistence, and a minimalist design.

## ✨ Features

- 📦 **State Management** with [Pinia](https://pinia.vuejs.org/)
- 💾 **LocalStorage Persistence** - Your todos are saved automatically
- 🎯 **Smart Filtering** - View All, Active, Completed, or Deleted todos
- ✅ **Toggle Completion** - Mark tasks as done/undone
- ✏️ **Inline Editing** - Click to edit titles and descriptions
- 🗑️ **Soft & Permanent Deletion** - Recover or permanently remove todos
- 🎨 **Responsive Design** - Works on all devices
- ⌨️ **Keyboard Shortcuts** - Enter to save, click to edit
- 🔤 **Auto Lowercase** - Consistent text formatting

## 🏗️ Architecture

### Core Modules

#### **Components**

- `TodoHeader.vue` - Application title and branding
- `TodoAdd.vue` - Form for creating new todos with validation
- `TodoList.vue` - Display and manage existing todos with inline editing

#### **Store**

- `stores/todos.ts` - Pinia store managing todo state, filtering, and persistence

#### **Types**

- `types/todo.d.ts` - TypeScript interfaces for type safety

### Tech Stack

- **Framework**: [Nuxt 3](https://nuxt.com/) - Vue.js framework
- **Styling**: [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- **State**: [Pinia](https://pinia.vuejs.org/) - Vue state management
- **Icons**: [Nuxt Icon](https://github.com/nuxt-modules/icon) - Icon components
- **UI**: [Nuxt UI](https://ui.nuxt.com/) - UI component library
- **Language**: TypeScript - Type-safe development

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, pnpm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nuxt-todo

# Install dependencies
npm install
```

### Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## 📜 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run preview      # Preview production build
npm run generate     # Generate static site
```

### Code Quality

```bash
npm run lint         # Check code with ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check if code is properly formatted
npm run quality      # Run both linting and formatting
```

## 🔧 Code Quality

This project uses industry-standard tools for code quality:

### ESLint Configuration

- **Nuxt recommended rules** for Vue.js and TypeScript
- **Automatic fixing** of common issues
- **Vue-specific linting** for component best practices

### Prettier Configuration

- **Consistent formatting** across all files
- **TailwindCSS class sorting** for better readability
- **Single quotes**, no semicolons, 2-space indentation
- **80 character line width** for better code review

### Pre-commit Workflow

```bash
# Before committing, run:
npm run quality
```

## 📁 Project Structure

```
├── components/          # Vue components
│   ├── TodoAdd.vue     # Todo creation form
│   ├── TodoHeader.vue  # App header
│   └── TodoList.vue    # Todo display & editing
├── pages/              # Nuxt pages
│   └── index.vue       # Main application page
├── stores/             # Pinia stores
│   └── todos.ts        # Todo state management
├── types/              # TypeScript definitions
│   └── todo.d.ts       # Todo interface
├── assets/css/         # Global styles
└── nuxt.config.ts      # Nuxt configuration
```

## 🎯 Usage

1. **Add Todo**: Type title and description, press Enter
2. **Edit Todo**: Click on any todo text to edit inline
3. **Complete Todo**: Click the circle icon to mark as done
4. **Delete Todo**: Click trash icon (soft delete), click again to permanently delete
5. **Filter Todos**: Use filter buttons to view different todo states

## 🚀 Deployment

### Static Generation

```bash
npm run generate
```

### Node.js Server

```bash
npm run build
npm run start
```

### Docker

#### Using Docker Compose (Recommended)

```bash
# Build and run the application
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# Stop the application
docker-compose down
```

#### Using Docker directly

```bash
# Build the Docker image
docker build -t nuxt-todo .

# Run the container
docker run -p 3000:3000 nuxt-todo
```

The application will be available at `http://localhost:3000`

### Docker Configuration

- **Dockerfile**: Multi-stage build optimized for production
- **docker-compose.yml**: Simple service configuration
- **.dockerignore**: Excludes unnecessary files for faster builds

For more deployment options, check the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run `npm run quality` before committing
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
