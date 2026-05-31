# Team Task Tracker API - Backend

This is the REST API backend for the **Team Task Tracker**.

---

## 🛠️ Tech Stack & Features

- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database ORM**: PostgreSQL & Prisma ORM
- **Cache Store**: Redis (`ioredis` client)
- **Validation**: Zod (strict schema check)
- **APIs & Documentation**: OpenAPI 3.0.3 served dynamically via Swagger-UI
- **Containerization**: Docker & Docker Compose

---

## 🚀 How to Run the Backend

You can run the backend in one of two ways: using **Docker Compose** (recommended, zero local database configuration required) or **locally**.

### Method 1: Using Docker Compose (Recommended)

Docker Compose spins up the API, PostgreSQL, and Redis containers automatically with proper networking, volumes, and health checks.

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

#### Steps
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Build and start all services:
   ```bash
   docker compose up --build
   ```
3. The server will start on port `5000`. You can access the services at:
   - **Swagger API Docs**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
   - **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

### Method 2: Running Locally

If you want to run the application directly on your local system, you must have local instances of PostgreSQL and Redis running.

#### Prerequisites
- Node.js (v20.x or higher)
- PostgreSQL running locally
- Redis running locally

#### Steps
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure your local environment:
   - Copy `.env.example` to `.env` if you haven't already:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and verify your `DATABASE_URL` and `REDIS_HOST` match your local PostgreSQL and Redis configurations.
4. Run Prisma database migrations (once your local PostgreSQL is running):
   ```bash
   npx prisma migrate dev
   ```
5. Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```
6. Start the development server (with hot reloading):
   ```bash
   npm run dev
   ```
7. The server will start, and the OpenAPI interactive console will be available at [http://localhost:5000/api-docs](http://localhost:5000/api-docs).

---

## 🗄️ Database Design & Written Schema Description

The database schema is designed inside [schema.prisma](file:///d:/MY%20PERSONAL%20GITHUB-%20Keshavsaini22/nxtwave-assignment/backend/prisma/schema.prisma) using a highly normalized PostgreSQL model:

* **Organization**: A multi-tenant root representing individual corporate domains.
* **User**: Represents team accounts with `isBlocked` administrative suspension flags and role profiles (`ADMIN`, `MANAGER`, `MEMBER`).
* **RefreshToken**: Used for stateful Session Token Rotations (RTR).
* **Project**: Bound to an `Organization`. Holds many-to-many associations to `User` members via the junction relation `_ProjectMembers`.
* **Task**: Resource holding `title`, `description`, `priority`, `status`, `dueDate`, and foreign key links to project, organization, and assignee.
* **TaskStatusHistory**: Auditing table logging each valid transition (`taskId`, `userId`, `fromStatus`, `toStatus`, `createdAt`).

---

## ⚡ Database Index Decisions

To speed up `GET /tasks` queries and prevent high-overhead full-table scans, we implemented targeted Postgres indexes.

### Redundant Index Prefix Pruning
PostgreSQL B-Tree composite indexes can optimize query filters matching the leftmost prefix columns. In accordance with this principle, we pruned redundant standalone indexes to reduce disk space and lower write latency:
1. **Pruned `@@index([organizationId])`**: Already covered by the leftmost prefix of composite indexes `(organizationId, status)`, `(organizationId, projectId)`, and `(organizationId, assigneeId)`.
2. **Pruned `@@index([status])` & `@@index([assigneeId])`**: Because our application is strictly multi-tenant, queries never filter by status or assignee globally—they are always scoped by the organization (e.g., `where: { organizationId, status }`). These are fully satisfied by the composites `(organizationId, status)` and `(organizationId, assigneeId)`.
3. **Preserved `@@index([projectId])` & `@@index([dueDate])`**: Standalone indexes are kept here because Prisma queries `projectId` directly during nested relational loads, and `dueDate` requires standalone range queries for sorted listings or overdue audits.

---

## ⚡ Redis Caching Strategy

We built an ultra-fast, robust task-list caching engine per assignee that ensures complete database consistency.

### The Anti-Scan Pattern (O(1) Set-Based Eviction)
* **The Danger**: Wildcard search operations like `KEYS cache:tasks:assignee:UserA:*` block the single-threaded Redis event loop. Under production traffic, this freezes the server and causes API timeouts.
* **Our Solution**: We track active cache keys using a Redis **Set** data structure scoped per user: `active_caches:assignee:<userId>`.
* **Registration**: When writing a cached query (e.g., `cache:tasks:assignee:UserA:page:1`), we register the key in the user's Set:
  ```typescript
  await redis.sadd(`active_caches:assignee:${userId}`, cacheKey);
  ```
* **Eviction**: On task mutations, we load only the user's specific registered keys (`SMEMBERS`), delete them immediately (`DEL`), and wipe the Set. This executes in $O(1)$ and takes microseconds.
* **Re-assignment Edge Case**: If a task's assignee changes from User A to User B, our service automatically detects the mutation and evicts the caches for **both** User A and User B so that both dashboards update in real-time.
* **Passive Eviction**: A strict **10-minute TTL** is applied to fallback cache keys.

---

## 🌟 Architectural Patterns (State Design Pattern)

To implement task transitions while keeping the codebase modular and compliant with the **Open-Closed Principle (OCP)**, we implemented a behavioral **State Design Pattern**:
* **Interface `ITaskState`**: Mandates a common `canTransitionTo(target)` verification check.
* **State Classes**:
  * `TodoState`: Transitions to `IN_PROGRESS` or `BLOCKED`.
  * `InProgressState`: Transitions to `IN_REVIEW` or `BLOCKED`.
  * `InReviewState`: Transitions to `DONE` or `BLOCKED`.
  * `BlockedState`: Recovers back to `TODO`, `IN_PROGRESS`, or `IN_REVIEW` (essential unblocking logic so tasks do not get stuck).
  * `DoneState`: Terminal state.
* **`TaskStateFactory`**: Automatically instantiates the concrete state based on active database records. Adding new status states requires creating a single class file, leaving existing transitions untouched.

---

## 📢 Real-Time Event-Driven Notifications (SSE & DB Inbox)

We implemented a robust event-driven notification flow utilizing a combined **persistent DB inbox** and a **live Server-Sent Events (SSE) broadcast stream**:
* **Real-time Streaming (`GET /api/v1/notifications/stream`)**: Establishes a persistent SSE connection. Under the hood, it spins up a dedicated Redis subscription (`SUBSCRIBE notifications:user:<userId>`) using a decoupled client context to push live updates to the user's dashboard with zero connection blocking.
* **Persistent DB Inbox (`GET /api/v1/notifications`)**: When the user is offline, updates are persisted to the PostgreSQL `Notification` table. Once the user connects online, their inbox loads all historical notifications sorted chronologically with cursor-based pagination.
* **Read Control Actions (`PATCH /api/v1/notifications/:id/read`, `POST /api/v1/notifications/read-all`)**: Users can selectively mark notifications as read or clear the entire inbox, gated behind strict BOLA ownership checks.

---

## 📊 SQL Window Function & Aggregation Analytics (`GET /api/v1/analytics/tasks`)

To empower leadership with live organization-wide productivity metrics, we created a high-performance raw PostgreSQL aggregation query gated behind strict RBAC (`ADMIN` and `MANAGER` roles only):
* **Direct Database Execution (`Prisma.sql` via `prisma.$queryRaw`)**: Demonstrates SQL aggregation proficiency by computing overdue counts, user averages, and baseline rankings in a single, high-performance database round-trip:
  * **Aggregate Filtering**: Utilizes `COUNT(t.id) FILTER (WHERE t.status != 'DONE' AND t.due_date < NOW())` to compute overdue task counts selectively.
  * **Window Ranking**: Computes ordinal performance ranks dynamically using `RANK() OVER (ORDER BY avgCompletionSeconds ASC)` to list the fastest members.
  * **Baseline Windowing**: Computes organizational averages using `AVG(...) OVER ()` to offer a baseline benchmark for all employee speeds.

---

## 🧪 Testing Suite (32 passed, 32 total)

The project includes unit and integration tests covering the core business lifecycle.

### Highlights
* **Prisma Mocking**: Developed a mock provider for the Prisma Client to avoid parallel test suite interference.
* **Faker & Object Mother Patterns**: Uses the **Factory/Object Mother pattern** (`UserMother`, `TaskMother`, `OrganizationMother`) coupled with Faker to generate deterministic, readable test payloads.
* **AAA Assertions Structure**: All unit and integration test blocks adhere strictly to the **Arrange-Act-Assert** pattern.
* **100% Code Coverage**: The Analytics Service achieves **100% statements, branches, and lines coverage** out-of-the-box.

### Running the Test Suite
You can execute the entire test suite (with zero external environment database dependency) by running:
```bash
npm test
```
To view full test coverage statistics:
```bash
npm run test:coverage
```

---

## 🔮 What We Would Improve Given More Time

1. **Sliding-Window Rate Limiting**: Introduce Redis-backed Token Bucket rate-limit filters on sensitive auth endpoints to prevent brute-force attacks.
2. **Horizontal Scaling**: Transition the SSE backend to use Redis adapter groups or a dedicated gateway for thousands of concurrent real-time connections.

---

## 📁 Project Directory Layout

The workspace is organized as follows:
```text
backend/
├── src/
│   ├── config/             # Database and Redis connectors
│   ├── controllers/        # Express Request-Response coordinators
│   ├── services/           # Business, Caching, and state patterns
│   │   └── states/         # State Design Pattern concrete classes
│   ├── routes/             # Modular API routes
│   ├── middlewares/        # Security, Auth, RBAC, Zod and Error Handlers
│   ├── validations/        # Strict Zod schemas
│   ├── docs/               # OpenAPI/Swagger spec documentation
│   └── index.ts            # Entrypoint file
├── prisma/                 # Relational database schema definition
├── .env                    # System variables (ignored by Git)
├── .env.example            # Shared environment configuration template
├── tsconfig.json           # TypeScript build guidelines
├── Dockerfile              # Multi-stage container
└── docker-compose.yml      # Multi-container service orchestrator
```
