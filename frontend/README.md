# Team Task Tracker Client Application

This directory contains the React + TypeScript frontend client built for the **Team Task Tracker**. Styled to match a dark Asana-like theme, it provides team members and administrators with a tool to manage organizational projects, tasks, and employees.

---

## 🛠️ Technology Stack & Structure

The client application separates concerns across clear layers:
* **Core View Layer**: React 19 + TypeScript 5 built with Vite.
* **Central State Engine**: **Redux Toolkit** managing global auth sessions (`authSlice.ts`) and administrative actions (`userSlice.ts`).
* **API Mappers**: Encapsulated network queries in service-specific classes (`auth.service.ts`, `project.service.ts`, `task.service.ts`, `user.service.ts`, `notification.service.ts`, `analytics.service.ts`).
* **Modular Components**:
  * `Sidebar.tsx`: Collapsible accordion panel displaying active projects.
  * `NotificationDrawer.tsx`: Slide-out panel for database-backed inbox management.
  * `FormField.tsx`: Reusable input wrappers maintaining layout consistency.

---

## 🚀 Key Features

* **Collapsible Accordion Sidebar Navigation**: A collapsible navigation block under Project Management. Users click chevrons to toggle children or select projects to open their boards.
* **Query Parameter Synchronized State**: Project selections are mapped directly to URL query parameters (`/tasks?projectId=UUID`) using React Router `useSearchParams`, supporting bookmarking and browser history natively.
* **Responsive Kanban Board**: A Flexbox horizontal scrolling plane (`overflow-x: auto` with `min-width: 280px` columns), keeping `To Do`, `In Progress`, `In Review`, `Done`, and `Blocked` columns side-by-side on any screen size.
* **Real-time SSE Notification Hub**: Subscribes globally to backend Server-Sent Events (SSE) to append new logs to the inbox drawer, increment the header badge, and display toast messages across pages.
* **Role-Gated Dashboard Access**:
  * `ADMIN` has full team management capabilities (`/users`), project CRUD (`/projects`), and organization-wide analytics.
  * `MANAGER` holds project controls, task assignments, and productivity leaderboards.
  * `MEMBER` accounts are restricted strictly to tasks assigned to them, with local controls allowing them to only advance states on their own tasks.

---

## 🔧 Getting Started

### 1. Requirements
Ensure you have **Node.js (v18+)** installed.

### 2. Installation
Install frontend packages:
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file mapping target endpoints:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 4. Running Dev Server
Launch Vite:
```bash
npm run dev
```

### 5. Production Compilation
Bundle and typecheck client bundles:
```bash
npm run build
```

### 6. Running with Docker Compose
To run the containerized frontend client independently:
```bash
docker compose up --build
```
This builds the client package using its multi-stage `Dockerfile` and hosts it on port `5173` using an Nginx server configured for SPA path routing fallback support.


