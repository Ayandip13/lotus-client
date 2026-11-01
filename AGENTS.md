# AGENTS.md — Engineering Rules, Standards & AI Agent Guidelines

This document is the **single source of engineering truth and operating principles** for all human engineers and AI coding agents working on the **Lotus Caterer Management System**.

---

## 1. Project Overview & Purpose

The **Lotus Caterer Management System** is a production-oriented, internal B2B operational and financial management software platform designed for a catering business managed by three partners.

### Core Objectives:
- Maintain records of bookings and events/jobs.
- Track income and expenditures at both the partner level and individual event level.
- Provide clear partner account balances (deposits, expenses, current funds).
- Provide financial overviews (total money received, total money spent, overall balances).
- Support bill and receipt image attachments for audit and verification.

---

## 2. Technology Stack & Tooling

| Domain | Technology / Library | Role & Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React (v18+) with Vite | Fast HMR, lightweight modern bundling, client-side SPA |
| **Language** | TypeScript (Strict mode) | Type safety across client and server |
| **Styling** | Tailwind CSS | Utility-first, standardized design tokens, responsive layout |
| **Routing** | React Router (v6+) | Declarative client-side routing |
| **State / Data Fetching** | TanStack Query (v5) | Server-state caching, automatic refetching, mutation states |
| **HTTP Client** | Axios | Centralized interceptors, unified error handling, timeout controls |
| **Form Management** | React Hook Form | Performant, uncontrolled inputs with easy validation binding |
| **Schema Validation** | Zod | Single schema validation for forms (frontend) & requests (backend) |
| **Icons** | Lucide React | Clean, consistent, lightweight SVG iconography |
| **Backend Runtime** | Node.js (v20+) | High-performance asynchronous JavaScript runtime |
| **Backend Framework** | Express.js | Robust, modular HTTP application server |
| **Database** | MongoDB with Mongoose | Document-oriented persistence with structured schema enforcement |
| **Security** | Helmet, CORS, JWT | Secure headers, origin policies, stateless authorization |
| **File Storage** | Storage Service Interface | Cloudinary integration to be plugged into the storage abstraction |

---

## 3. Strict Operating Rules for Future AI Coding Agents

Every AI agent or software engineer modifying this codebase **MUST strictly follow these 12 immutable principles**:

1. **Always inspect existing code before modifying it**: Check files, exports, services, and utilities before creating any new file or function.
2. **Never duplicate existing functionality**: Use existing components, utilities, schemas, and services. If a utility or component exists, import and reuse it.
3. **Never create unnecessary components, files, or dependencies**: Do not introduce libraries when existing utilities or native features suffice.
4. **Never invent business requirements**: Only build features explicitly defined in `docs/REQUIREMENTS.md`. If a requirement is ambiguous or unspecified, record it under "Unresolved Questions" and ask.
5. **Never implement unconfirmed accounting logic**: Do not speculate on profit-sharing formulas, shared-expense splits, or partner settlement mechanisms until confirmed by stakeholders.
6. **Never use hardcoded fake data as production functionality**: Mock data belongs in testing/story files only. All production screens must use real API contracts and database states.
7. **Never expose secrets, credentials, or API keys**: Keep all keys, passwords, and tokens in `.env` files. Ensure `.env*` remains in `.gitignore`.
8. **Never bypass backend authorization**: Client-side UI guards are for user experience only. All access control, input validation, and business logic MUST be enforced on the backend.
9. **Never mark incomplete functionality as completed**: Maintain total transparency in `docs/ENGINEERING_BACKLOG.md`. If an edge case or error scenario is missing, document it.
10. **Update documentation and ENGINEERING_BACKLOG.md after every phase**: Keep `docs/` in lockstep with the codebase changes.
11. **Follow the existing project architecture instead of introducing competing patterns**: Respect directory conventions, naming rules, and established patterns.
12. **Prioritize correctness, maintainability, security, and responsive design**: Write readable, self-documenting code with defensive programming and mobile-first responsiveness.

---

## 4. Architecture & Directory Conventions

The project is structured with a clean separation of concerns:

```
project/
├── AGENTS.md                  # This file - Core rules & guidelines
├── README.md                  # Project overview & running instructions
├── .gitignore                 # Ignored files (node_modules, dist, .env)
├── .env.example               # Root environment variable template
├── docs/                      # Authoritative project documentation
│   ├── PROJECT_OVERVIEW.md    # Purpose and confirmed scope
│   ├── REQUIREMENTS.md        # Confirmed requirements & unresolved questions
│   ├── ARCHITECTURE.md        # Technical architecture & data flow
│   ├── DATABASE_SCHEMA.md     # Proposed database models & entity mapping
│   ├── API_CONTRACT.md        # API conventions, response envelopes, routes
│   ├── UI_GUIDELINES.md       # Visual hierarchy, typography, colors, spacing
│   └── ENGINEERING_BACKLOG.md # Implementation roadmap and progress log
├── client/                    # Frontend React + Vite application
│   ├── src/
│   │   ├── app/               # Root App, Providers, Router setup
│   │   ├── components/        # Reusable UI component library (Button, Card, Input...)
│   │   ├── layouts/           # Shell layouts (Sidebar, Header, AppLayout)
│   │   ├── pages/             # Page-level route views
│   │   ├── features/          # Domain-driven feature modules (partners, bookings, etc.)
│   │   ├── hooks/             # Custom utility hooks
│   │   ├── services/          # API client, HTTP services
│   │   ├── lib/               # Utility libraries (cn, queryClient)
│   │   ├── types/             # Frontend TypeScript types
│   │   └── assets/            # Static assets
└── server/                    # Backend Node.js + Express application
    ├── src/
    │   ├── config/            # Env validation, database connection
    │   ├── modules/           # Domain modules (routes, controllers, models, schemas)
    │   ├── middleware/        # Error handler, auth, validation, security
    │   ├── services/          # Shared services (storage/upload, logging)
    │   ├── utils/             # ApiResponse, AppError, helpers
    │   ├── types/             # Backend TypeScript definitions
    │   ├── app.ts             # Express application setup
    │   └── index.ts           # Server bootstrap & graceful shutdown
```

---

## 5. Coding & Naming Standards

### Naming Conventions:
- **Files & Directories**:
  - React components & layouts: `PascalCase.tsx` (e.g., `AppLayout.tsx`, `Button.tsx`).
  - Hooks: `camelCase.ts` starting with `use` (e.g., `useMediaQuery.ts`).
  - Utilities, services, routes, controllers, middleware: `camelCase.ts` (e.g., `apiClient.ts`, `validateRequest.ts`).
  - Types & interfaces: `camelCase.ts` or `kebab-case.ts` (e.g., `api.types.ts`).
- **Variables & Functions**: `camelCase` (e.g., `calculateTotalBalance`, `isSidebarOpen`).
- **Interfaces & Types**: `PascalCase` with descriptive nouns (e.g., `ApiResponse<T>`, `PartnerAccount`).
- **Constants & Enums**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PAGE_SIZE`, `HTTP_STATUS`).

---

## 6. Component Development Rules (Frontend)

- **Atomic, Single-Responsibility Components**: Components must do one thing well.
- **Component File Co-location**: Reusable UI components belong in `src/components/ui/`. Domain-specific components belong in their corresponding `src/features/<feature>/components/`.
- **Props Definition**: Every component must declare an explicit TypeScript interface or type for its props.
- **Tailwind Utility Classes**: Avoid inline styles. Use Tailwind utility classes with the `cn()` helper function for conditional classes.
- **Accessibility (a11y)**: All buttons, links, inputs, and interactive elements must have accessible labels, keyboard focus indicators, and ARIA attributes where appropriate.
- **Loading & Empty States**: Always design and handle loading skeletons/spinners and empty states gracefully.

---

## 7. API Development Rules (Backend)

- **RESTful Resource Structure**: Use plural nouns for resource endpoints (`/api/v1/partners`, `/api/v1/bookings`).
- **Consistent Response Envelope**: All API endpoints must return a standardized JSON format:
  ```json
  {
    "success": true,
    "message": "Optional human-readable message",
    "data": { ... }
  }
  ```
  Or on error:
  ```json
  {
    "success": false,
    "message": "Error description",
    "error": {
      "code": "ERROR_CODE",
      "details": [ ... ]
    }
  }
  ```
- **Validation**: All incoming requests (`req.body`, `req.query`, `req.params`) must be validated using Zod schemas via the `validateRequest` middleware before reaching controllers.
- **Controller Responsibilities**: Controllers should handle HTTP parsing, invoke services or module methods, and return standard responses. Keep controllers thin.
- **Stateless HTTP**: Maintain stateless sessions using JWT tokens passed via the `Authorization: Bearer <token>` header.

---

## 8. Database Modeling Rules (MongoDB / Mongoose)

- **Strict Schemas**: Define Mongoose schemas with explicit types, required fields, and index constraints.
- **Timestamps**: Enable `{ timestamps: true }` on all Mongoose schemas (`createdAt`, `updatedAt`).
- **Soft Deletion / Audit Trails**: Use audit fields (e.g., `isActive`, `deletedAt`, `createdBy`) for business-critical financial records. Financial records should never be physically deleted without an audit log.
- **Decimals / Monetary Values**: Store currency amounts as precise numbers (in cents/paise or 2-decimal rounded floats) to prevent floating-point inaccuracies.
- **Reference Integrity**: Use ObjectId references with populate limits to prevent N+1 query overhead.

---

## 9. Security & Authentication Rules

- **Defense in Depth**: Secure headers (Helmet), CORS configuration restricted to authorized origins, rate limiting on sensitive routes.
- **Authentication**: JWT token validation on all protected endpoints.
- **Role-Based Authorization**: Verify user permissions at the route/middleware level on the backend.
- **Input Sanitization**: Validate all inputs using Zod. Prevent NoSQL injection by avoiding direct un-sanitized query objects.
- **Credential Storage**: Passwords must always be hashed with bcrypt (minimum cost factor 10). Never store plain text passwords.

---

## 10. Error Handling Standards

- **Custom Application Errors**: Use `AppError` (extending `Error`) with HTTP status codes and machine-readable error codes.
- **Centralized Error Middleware**: All route errors must be passed to `next(err)`. The centralized error handler catches and normalizes all errors.
- **Leak Prevention**: In production (`NODE_ENV === 'production'`), never send internal stack traces or database driver details to the client.

---

## 11. Responsive Design Standards

- **Mobile First**: Design interfaces starting from 320px mobile viewport up to 1920px+ desktop.
- **Breakpoints**: Standard Tailwind breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`).
- **Sidebar & Navigation**: Sidebars must collapse to an accessible drawer/hamburger menu on mobile screens and provide comfortable desktop navigation.
- **Tables & Grids**: Ensure tables have horizontal scroll wrappers or convert to card views on narrow screens.

---

## 12. Testing & Documentation Requirements

- **TypeScript Verification**: All code must compile cleanly without TypeScript errors (`tsc --noEmit`).
- **Build Verification**: Both frontend and backend must successfully build (`npm run build`).
- **Documentation Sync**: Any architectural change or newly clarified business rule must immediately be updated in `docs/` and tracked in `docs/ENGINEERING_BACKLOG.md`.
