# Team Task Tracker API - Backend

This is the production-grade, highly structured SDE-II REST API backend for the **Team Task Tracker**.

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

## 📁 Project Directory Layout

The workspace is organized following SDE-II clean-architecture paradigms:
```text
backend/
├── src/
│   ├── config/             # Database and Redis connectors
│   ├── controllers/        # Express Request-Response coordinators
│   ├── services/           # Business and data access layer
│   ├── routes/             # Modular API routes
│   ├── middlewares/        # Security, Auth, RBAC, Zod and Error Handlers
│   ├── validations/        # Strict Zod schemas
│   ├── docs/               # OpenAPI/Swagger spec documentation
│   └── index.ts            # Entrypoint file
├── prisma/                 # Relational database schema definition
├── .env                    # System variables (ignored by Git)
├── .env.example            # Shared environment configuration template
├── tsconfig.json           # TypeScript build guidelines
├── Dockerfile              # Production-grade multi-stage container
└── docker-compose.yml      # Multi-container service orchestrator
```
