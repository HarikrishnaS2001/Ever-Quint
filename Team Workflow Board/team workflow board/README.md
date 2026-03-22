# Team Workflow Board

A modern, accessible React application for managing team tasks with a Kanban-style interface. Built with TypeScript, Vite, and a custom component library.

## Features

### Core Functionality
- **Kanban Board Interface**: Three-column layout (Backlog, In Progress, Done)
- **Task Management**: Create, edit, delete, and reorder tasks
- **Drag & Drop**: Move tasks between columns and reorder within columns
- **Task Filtering**: Search by text, filter by status, priority, assignee, and tags
- **Task Sorting**: Sort by creation date, priority, assignee, or title
- **Local Storage**: Persistent data with schema versioning and migration support

### Task Model
Each task includes:
- **id**: Unique identifier (UUID)
- **title**: Short descriptive title (max 100 characters)
- **description**: Detailed description (max 500 characters) 
- **status**: Backlog | In Progress | Done
- **priority**: Low | Medium | High
- **assignee**: Person responsible for the task
- **tags**: Array of string labels
- **createdAt/updatedAt**: Timestamps for tracking

### Component Library
Reusable, accessible components:
- **Button**: Multiple variants and sizes with loading states
- **TextInput**: Text and textarea with validation and error states
- **Select**: Dropdown with keyboard navigation
- **Modal**: Accessible dialog with focus management
- **Tag**: Removable badges with priority/status colors
- **Card**: Flexible content containers
- **Toast**: Ephemeral notifications with auto-dismiss

### Accessibility Features
- **Keyboard Navigation**: All interactions work with keyboard only
- **Focus Management**: Logical tab order and focus indicators
- **Error Handling**: Clear validation messages
- **Loading States**: Visual feedback for async operations

## Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm 10+

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open http://localhost:5173 in your browser

### Linting
```bash
npm run lint
```

## Architecture

### State Management
- **React Context + useReducer**: Centralized state management
- **Local Storage**: Persistent data with schema versioning

### Component Design
- **CSS Modules**: Scoped styling without runtime dependencies
- **Composition over Inheritance**: Flexible, reusable components
- **Accessibility First**: WCAG 2.1 AA compliance

## Tech Stack
React 19 • TypeScript 5 • Vite 8 • @dnd-kit • date-fns • UUID

