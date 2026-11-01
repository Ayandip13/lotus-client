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
├── features/             # Domain modules
│   ├── auth/             # Partner authentication & authorization (Phase 2)
│   ├── bookings/         # Booking & Event management (Phase 3)
│   │   ├── types/        # BookingEvent, BookingFormData, Query interfaces
│   │   ├── schemas/      # Zod validation schema for booking forms
│   │   ├── services/     # bookingService API consumer
│   │   ├── components/   # BookingTable, BookingCard, BookingForm, DeleteBookingModal
│   │   └── pages/        # BookingListPage, BookingCreatePage, Details, Edit
│   ├── partners/         # Partner accounts, balances, deposits (Phase 5)
│   └── transactions/     # Income, expense, and attachment management (Phase 4)
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
│   ├── health/           # System health monitoring endpoint
│   │   ├── health.controller.ts
│   │   └── health.routes.ts
│   ├── auth/             # Authentication & credentials (Phase 2)
│   │   ├── user.model.ts, auth.service.ts, auth.controller.ts, auth.routes.ts
│   │   └── partner.model.ts
│   ├── events/           # Catering Bookings & Events (Phase 3)
│   │   ├── event.model.ts, event.schema.ts, event.service.ts, event.controller.ts, event.routes.ts
│   ├── transactions/     # Centralized Financial Ledger (Phase 4)
│   │   ├── transaction.model.ts   # Core ledger schema with amountPaise, type, source, audit stamps
│   │   ├── transaction.schema.ts  # Zod validation for create, update, filter params
│   │   ├── transaction.service.ts # Transaction CRUD, search, pagination, orphaned file cleanup
│   │   ├── transaction.controller.ts
│   │   └── transaction.routes.ts
│   └── accounts/         # Accounting Calculations & Aggregations (Phase 4)
│       ├── account.service.ts     # Common balance, revenue, expense, partner and date-wise math
│       ├── account.controller.ts
│       └── account.routes.ts
│
├── services/             # Core shared application services
│   └── storage/          # Storage abstraction for receipts and attachments
│       ├── storage.interface.ts     # IStorageService contract
│       ├── cloudinary.storage.ts    # Cloudinary v2 image uploader with credential validation
│       ├── local.storage.ts         # Local disk storage fallback (uploads/ directory)
│       └── index.ts                 # Dynamic factory resolving Cloudinary or Local
│
├── middleware/           # Reusable Express request middleware
│   ├── auth.middleware.ts# requireAuth & requirePartner JWT validation
│   ├── upload.middleware.ts # Multer memory storage validating image types & 5MB size limit
│   ├── errorHandler.ts   # Centralized error handler converting errors to standard JSON
│   ├── validateRequest.ts# Generic Zod validation middleware (body, params, query)
│   ├── security.ts       # Helmet and CORS configuration
│   └── requestLogger.ts  # Request logging utility
│
├── utils/                # Helper utilities and standard response envelopes
│   ├── apiResponse.ts    # Standardized JSON response formatting helpers
│   └── appError.ts       # Structured operational error classes
│
├── types/                # Backend TypeScript types and Express augmentation
│   └── api.types.ts
│
├── app.ts                # Express application setup, route mounting (/uploads, /api/v1/...)
└── index.ts              # HTTP server bootstrap, process lifecycle, signal handlers
```

---

## 4. File Storage Architecture & Cloudinary Integration

Transaction receipts and bills require persistent image storage. Built using an **Abstract Storage Service** interface (`IStorageService`):

```typescript
export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<{
    url: string;
    publicId: string;
    fileSize: number;
    mimeType: string;
    originalName?: string;
  }>;
  deleteFile(publicId: string): Promise<boolean>;
}
```

- **Cloudinary Provider (`cloudinary.storage.ts`)**: Direct upload stream via Cloudinary SDK v2. Uses environment variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- **Local Fallback Provider (`local.storage.ts`)**: Saves files locally to `./uploads` and serves them statically via Express on `/uploads/:filename`.
- **Validation**: Strict MIME validation (`image/jpeg`, `image/png`, `image/webp`), 5MB maximum file size limit, and maximum 5 files per transaction.
- **Fail-safe Cleanup**: If a database write fails during transaction creation or update, newly uploaded attachments are automatically purged to prevent orphaned file leaks.

---

## 5. Security & Error Handling Pipeline

Every incoming request flows through a strict, predictable pipeline:

1. **Security Layer**: `helmet` configures HTTP security headers; `cors` restricts origins based on `CLIENT_URL`.
2. **Body Parsing**: JSON body parser with strict size limits (10MB for receipt uploads).
3. **Validation Layer**: `validateRequest(schema)` uses Zod to validate request parts. Invalid inputs are rejected immediately with a `400 Bad Request` and structured validation errors.
4. **Controller Execution**: Thin controllers extract validated inputs and delegate business operations.
5. **Centralized Error Boundary**: Any error thrown (or passed to `next(err)`) is trapped by `errorHandler`, normalized to the standard `ApiResponse` envelope, and returned with appropriate HTTP status codes.

---

## 6. Authentication & Partner Authorization Architecture (Phase 2)

```
[ Browser / Client ]                  [ Express API Server ]                  [ MongoDB ]
        │                                       │                                  │
        │── 1. POST /api/auth/login ───────────▶│                                  │
        │      { username, password }           │── 2. Find user & compare hash ──▶│
        │                                       │◀─ 3. Return user & partner ──────│
        │◀─ 4. Return JWT Token + Session ──────│                                  │
        │                                       │                                  │
        │── 5. Subsequent Requests ────────────▶│                                  │
        │      Authorization: Bearer <token>    │── 6. requireAuth (verify JWT)    │
        │                                       │── 7. requirePartner (active check)
        │                                       │── 8. Attach req.user & partner   │
        │                                       │── 9. Controller handles action   │
        │◀─ 10. Standard JSON Response ─────────│                                  │
```

### Key Security & Authorization Characteristics:
- **Stateless Authorization**: JWT token issued with standard claims (`userId`, `partnerId`, `username`) and signed using `JWT_SECRET`.
- **Equal Partner Policy**: All three partners share the exact same permissions. There is no hierarchical privilege escalation or Admin/Staff segregation.
- **Identity Integrity**: Authenticated partner identity is derived directly from the verified token in `requireAuth` / `requirePartner` middleware; client-supplied partner IDs are never trusted blindly.
- **Idempotent Provisioning**: Partner accounts are seeded using a dedicated script without public signup exposure or credential overwrites.
