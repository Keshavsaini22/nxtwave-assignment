# Team Task Tracker

A multi-tenant workspace application for managing teams, projects, and tasks, featuring real-time updates and performance analytics.

## 📁 Project Structure

* **[backend](backend/)**: Express & TypeScript REST API with role-based access control (RBAC), JWT sessions, Redis caching, and PostgreSQL database.
* **[frontend](frontend/)**: React SPA with a dark theme styled like Asana, featuring real-time notification feeds, collapsible sidebars, dynamic URL query routing, and horizontal Kanban boards.

---

## ⚡ Technical Architecture & Design Decisions

### 1. Dual-ID Strategy
* **Problem**: Database queries are fastest using auto-incrementing integer IDs. However, exposing consecutive integers in URLs makes the API vulnerable to resource guessing attacks (BOLA).
* **Solution**: Internal joins and indexes use high-performance integer primary keys. Public-facing endpoints and JWT tokens strictly consume UUID strings. The backend maps UUIDs to internal IDs during query execution, securing the database layer while preserving index speed.

### 2. Real-Time Updates via Server-Sent Events (SSE)
* **Problem**: WebSockets are powerful but require custom keep-alive logic and add complexity for one-way server-to-client updates.
* **Solution**: We chose SSE for real-time task notifications. The server sends heartbeats every 25 seconds to keep connections alive through proxies, and automatically cleans up Redis channels when clients disconnect.

### 3. High-Performance Redis Caching (Anti-SCAN Pattern)
* **Problem**: Standard cache invalidation using `KEYS` or `SCAN` freezes the single-threaded Redis event loop under load.
* **Solution**: Active cache keys are tracked in a Redis Set associated with each user ID. When a task is modified, the backend pulls only the specific keys from that user's set and deletes them. This ensures $O(1)$ fast cache eviction.

### 4. Database Composite Index Optimization
* Redundant standalone indexes on `organizationId` and `status` were removed. Since queries are scoped by organization, composite indexes on `(organizationId, status)` and `(organizationId, projectId)` satisfy these lookups while speeding up database writes.

### 5. Task Lifecycle State Management
* Task status transitions are modeled using the behavioral **State Pattern**. Allowed transitions (e.g., `TodoState` to `InProgressState` or `BlockedState`) are encapsulated inside dedicated state classes. Adding a new task status requires adding a single class without touching existing transition code.

### 6. Core Structural Patterns
* **Frontend: React Functional Component (RFC) Pattern**: All UI components are structured as functional components using TypeScript props and React hooks (`useState`, `useSearchParams`, and Redux hooks). This keeps components clean, highly reusable, and separate from raw data layers.
* **Backend: Route-Controller-Service (RCS) Pattern**: Decouples incoming requests from core execution. Modular routes define the API surface and apply middlewares, Controllers handle request/response formatting, and Services execute the business logic.

---

## 🐳 Docker Containerization Setup

Both services are fully containerized using multi-stage builds.

### 1. Backend (`backend/Dockerfile`)
* **Multi-Stage Build**: Compiles TypeScript in a build container, then copies only the compiled output (`dist/`) and production dependencies (`npm ci --omit=dev`) to the runner container to keep the image footprint secure and minimal.
* **Prisma Engine Hook**: Alpine Linux needs specific system libraries to run Prisma's query engine. The Dockerfile installs `openssl` and `libc6-compat` to prevent container crashes on startup.

### 2. Frontend (`frontend/Dockerfile`)
* **Nginx Static Server**: Compiles the React application and copies the static assets into Nginx.
* **SPA Routing Fix**: Implements custom routing inside [nginx.conf](frontend/nginx.conf) (`try_files $uri $uri/ /index.html;`) so that reloading a nested page does not result in a standard Nginx 404 error.

---

## 🔧 Setup & Installation

Follow these steps to run the application using Docker:

1. **Prerequisites**: Install and run **Docker Desktop**.
2. **Start Backend & Database Stack**:
   ```bash
   cd backend
   docker compose up --build
   ```
3. **Start Frontend App**:
   ```bash
   cd frontend
   docker compose up --build
   ```

### Ports and URLs:
* **Frontend App**: [http://localhost:5173](http://localhost:5173)
* **API Swagger Docs**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
* **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
* **PostgreSQL Port**: `5433` (mapped from container `5432`)
* **Redis Cache Port**: `6379`
