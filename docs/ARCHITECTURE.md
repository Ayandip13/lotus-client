# Technical Architecture: Lotus Caterer Management System

## 1. High-Level Architecture Overview

The system is architected as a decoupled client-server web application featuring a modern React SPA on the frontend and an Express REST API backend backed by MongoDB.

```
                      ┌───────────────────────────────────────┐
                      │          React Client (SPA)           │
                      │  (Vite + TypeScript + Tailwind CSS)   │
                      └──────────────────┬────────────────────┘
                                         │
                                         │ HTTPS / JSON (REST)
                                         ▼
                      ┌───────────────────────────────────────┐
                      │          Express API Server           │
                      │       (Node.js + TypeScript)          │
                      ├───────────────────────────────────────┤
                      │  Middleware Pipeline:                 │
                      │  - Helmet & CORS Security             │
                      │  - Request Logging                    │
                      │  - Zod Request Validation             │
                      │  - JWT Authentication (Auth Phase)    │
                      │  - Centralized Error Handler          │
                      └──────────┬─────────────────┬──────────┘
                                 │                 │
                 Mongoose ODM    │                 │  Storage Adapter
                                 ▼                 ▼
                      ┌────────────────────┐   ┌───────────────────────────┐
                      │   MongoDB Database │   │   Storage Service         │
                      │  - Partner Accounts│   │   (Local Stub ->          │
                      │  - Transactions    │   │    Cloudinary Provider)   │
                      │  - Events/Bookings │   └───────────────────────────┘
                      └────────────────────┘
```

---

## 2. Frontend Architecture (`client/`)

The frontend application utilizes a modular, feature-based architecture built with React, Vite, TypeScript, and Tailwind CSS.

### Directory Structure & Responsibilities

```
client/src/
├── app/                  # Application root setup, routing table, and global providers
│   ├── App.tsx           # Top-level application component
│   ├── router.tsx        # React Router v6 route definitions
│   └── providers.tsx     # TanStack Query & Context providers
│
├── components/           # Generic, presentation-only UI design system components
│   └── ui/               # Button, Card, Input, Badge, Table, Alert, LoadingSpinner
│
├── layouts/              # Shell layouts (Sidebar, Header, AppLayout)
│   ├── AppLayout.tsx     # Master layout coordinating sidebar and main viewport
│   ├── Header.tsx        # Top navigation bar with partner profile and environment badges
│   └── Sidebar.tsx       # Collapsible navigation drawer supporting desktop & mobile
│
├── pages/                # Page-level containers mapped to routes
│   ├── DashboardShellPage.tsx # Overview dashboard landing view
│   └── NotFoundPage.tsx       # 404 handler
│
├── features/             # Domain modules (to be implemented in subsequent phases)
│   ├── partners/         # Partner accounts, balances, deposits
│   ├── bookings/         # Booking management
│   ├── events/           # Event tracking & event-specific ledgers
│   └── transactions/     # Income, expense, and attachment management
│
├── services/             # HTTP clients and API integration functions
│   └── api.ts            # Centralized Axios instance with interceptors and error normalization
│
├── lib/                  # Utilities and library wrappers
│   ├── utils.ts          # Tailwind class merger (cn helper)
│   └── queryClient.ts    # TanStack Query client configuration
│
└── types/                # Shared frontend TypeScript interfaces and type definitions
```

### State Management & Data Flow
1. **Server State**: Managed strictly using **TanStack Query** (`useQuery`, `useMutation`). This eliminates redundant client-side stores, provides automatic background refetching, request deduplication, and cached query states.
2. **Form State**: Managed using **React Hook Form** paired with **Zod** resolvers for validation.
3. **UI State**: Kept local via React hooks (`useState`, `useReducer`, `useDisclosure`).

---

## 3. Backend Architecture (`server/`)

The backend is built as an Express.js application written in strict TypeScript, emphasizing modularity, fail-safe error handling, and robust security.

### Directory Structure & Responsibilities

```
server/src/
├── config/               # Environment configuration and infrastructure setup
│   ├── env.ts            # Zod-validated environment variables
│   └── database.ts       # Mongoose connection lifecycle manager
│
├── middleware/           # Reusable Express request middleware
│   ├── errorHandler.ts   # Centralized error handler converting errors to standard JSON
│   ├── validateRequest.ts# Generic Zod validation middleware (body, params, query)
│   ├── security.ts       # Helmet and CORS configuration
│   └── requestLogger.ts  # Request logging utility
│
├── modules/              # Modular domain features (controllers, routes, services)
│   └── health/           # System health monitoring endpoint
│       ├── health.controller.ts
│       └── health.routes.ts
│
├── services/             # Core shared application services
│   └── storage/          # Storage abstraction for receipts and attachments
│       ├── storage.interface.ts # Interface defining upload/delete/get URL contracts
│       └── local.storage.ts     # Local filesystem implementation (Cloudinary to follow)
│
├── utils/                # Helper utilities and standard response envelopes
│   ├── apiResponse.ts    # Standardized JSON response formatting helpers
│   └── appError.ts       # Structured operational error classes
│
├── types/                # Backend TypeScript types and Express augmentation
│   └── api.types.ts
│
├── app.ts                # Express application setup, middleware registration
└── index.ts              # HTTP server bootstrap, process lifecycle, signal handlers
```

---

## 4. File Storage Architecture

Transaction receipts and bills require persistent image storage. To prevent tight coupling to any third-party provider, an **Abstract Storage Service** is established:

```typescript
export interface StorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<{
    url: string;
    publicId: string;
    fileSize: number;
    mimeType: string;
  }>;
  deleteFile(publicId: string): Promise<boolean>;
}
```

- In Phase 1, the storage interface and a local stub/contract are established.
- In later phases, a `CloudinaryStorageService` implementing this identical interface will be plugged in with zero refactoring required in controllers or models.

---

## 5. Security & Error Handling Pipeline

Every incoming request flows through a strict, predictable pipeline:

1. **Security Layer**: `helmet` configures HTTP security headers; `cors` restricts origins based on `CLIENT_URL`.
2. **Body Parsing**: JSON body parser with strict size limits (10MB for receipt uploads).
3. **Validation Layer**: `validateRequest(schema)` uses Zod to validate request parts. Invalid inputs are rejected immediately with a `400 Bad Request` and structured validation errors.
4. **Controller Execution**: Thin controllers extract validated inputs and delegate business operations.
5. **Centralized Error Boundary**: Any error thrown (or passed to `next(err)`) is trapped by `errorHandler`, normalized to the standard `ApiResponse` envelope, and returned with appropriate HTTP status codes.
