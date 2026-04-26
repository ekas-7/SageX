# 🧠 Backend Architecture Rules (Next.js + TypeScript + MongoDB/Mongoose)

## 🏗️ Architecture Overview

We follow a strict layered architecture:


Route Handler → Controller → Vali → Orchestrator → Service → Repository → Database (MongoDB)


Each layer has a single responsibility and must not be bypassed.

---

## 📂 Folder Structure


src/
├── app/
│ ├── api/
│ │ ├── users/
│ │ │ └── route.ts
│ │ └── ...
│
├── controllers/
├── vali/
├── orchestrators/
├── services/
├── repositories/
├── models/ # Mongoose schemas
├── config/
├── middlewares/
├── utils/
└── lib/
└── db.ts # MongoDB connection


---

## 🔥 Core Principles

### 1. Single Responsibility
Each layer does ONE thing only.

### 2. Strict Flow Direction


Controller ↓
Vali ↓
Orchestrator ↓
Service ↓
Repository ↓
MongoDB


🚫 No upward imports allowed.

---

## 🌐 Route Handlers (Next.js Entry Layer)

File: `app/api/**/route.ts`

### Responsibilities:
- Receive HTTP request
- Call controller
- Return response

### Allowed:
- Parsing request
- Calling controller
- Returning Response.json()

### Not Allowed:
- Validation
- Business logic
- Database access

---

## 🧭 Controllers (HTTP Flow Layer)

### Responsibilities:
- Coordinate request lifecycle
- Call validation layer
- Call orchestrator
- Format response

### Allowed:
- Request parsing
- Response formatting

### Not Allowed:
- Business logic
- Direct DB/service/repo calls

---

## 🧼 Vali (Validation + Normalization)

### Responsibilities:
- Validate incoming data
- Normalize input (trim, lowercase, sanitize)
- Return typed DTO

### Allowed:
- Schema validation (Zod recommended)
- Input transformation

### Not Allowed:
- Business logic
- DB access

---

## 🧠 Orchestrator (Core Brain Layer)

### Responsibilities:
- Business workflows
- Multi-step logic
- Decision making
- Combining multiple services

### Allowed:
- Calling multiple services
- Conditional flows
- Workflow coordination

### Not Allowed:
- Direct DB access
- HTTP handling

---

## ⚙️ Services (Atomic Logic Layer)

### Responsibilities:
- Single-purpose business operations
- Thin abstraction over repository

### Allowed:
- Calling repository
- Small logic (formatting, checks)

### Not Allowed:
- Multi-step workflows (use orchestrator)
- HTTP handling

---

## 🗄️ Repository (MongoDB Data Layer)

### Responsibilities:
- All database interactions using Mongoose
- One model per repository (preferred)

### Allowed:
- Mongoose queries
- CRUD operations

### Not Allowed:
- Business logic
- Validation
- Orchestration

---

## 🧱 Models (Mongoose Schemas)

- Define MongoDB schema using Mongoose
- Export models only

Example:
- UserModel
- ProductModel

---

## 🛢️ MongoDB Rules

- Use Mongoose only
- No raw Mongo queries in services/controllers
- Keep DB logic inside repositories only
- Always use async/await

---

## 🚫 Anti-Patterns (Strictly Forbidden)

### ❌ Skipping Layers

Controller → Repository ❌
Route → Service ❌
Route → DB ❌


---

### ❌ Business Logic in Wrong Places
- Controllers ❌
- Repositories ❌
- Route handlers ❌

---

### ❌ Fat Services
- If logic becomes complex → move to orchestrator

---

### ❌ Direct Mongoose Usage Outside Repo

UserModel.find() ❌ anywhere except repository


---

## 🧪 Testing Strategy

- Repository → mock Mongoose models
- Service → mock repositories
- Orchestrator → mock services
- Controller → integration test
- Route handler → e2e test

---

## ⚡ Naming Conventions

| Layer        | Pattern             | Example              |
|--------------|---------------------|----------------------|
| Route        | route.ts            | app/api/users/route.ts |
| Controller   | *.controller.ts     | user.controller.ts   |
| Vali         | *.vali.ts           | user.vali.ts         |
| Orchestrator | *.orchestrator.ts   | user.orchestrator.ts |
| Service      | *.service.ts        | user.service.ts      |
| Repository   | *.repo.ts           | user.repo.ts         |
| Model        | *.model.ts          | user.model.ts        |

---

## 🔁 Example Flow (Create User)