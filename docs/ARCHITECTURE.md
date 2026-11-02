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
│   ├── router.tsx        # React Router v6 route definitions (Invoices, Dues, Cash Custody)
│   └── providers.tsx     # TanStack Query & Context providers
│
├── components/           # Generic, presentation-only UI design system components
│   └── ui/               # Button, Card, Input, Badge, Table, Alert, FilterPanel, LoadingSpinner
│
├── layouts/              # Shell layouts (Sidebar, Header, AppLayout)
│   ├── AppLayout.tsx     # Master layout coordinating sidebar and main viewport
│   ├── Header.tsx        # Top navigation bar with partner profile and environment badges
│   └── Sidebar.tsx       # Collapsible navigation drawer supporting desktop & mobile
│
├── pages/                # Page-level containers mapped to routes
│   ├── DashboardShellPage.tsx # Upgraded Phase 5 Dashboard (6 Financial KPIs, Events, Dues, Cash)
│   └── NotFoundPage.tsx       # 404 handler
│
├── features/             # Domain modules
│   ├── auth/             # Partner authentication & authorization (Phase 2)
│   ├── bookings/         # Booking & Event management (Phase 3)
│   │   ├── types/        # BookingEvent, BookingFormData, Query interfaces
│   │   ├── schemas/      # Zod validation schema for booking forms
│   │   ├── services/     # bookingService API consumer
│   │   ├── components/   # BookingTable, BookingCard, BookingForm, EventFinancialHub
│   │   └── pages/        # BookingListPage, BookingCreatePage, Details, Edit
│   ├── dues/             # Customer & Vendor Dues Management (Phase 5)
│   │   ├── types/        # CustomerDue, VendorDue, PaymentHistory interfaces
│   │   ├── services/     # dueService API consumer
│   │   ├── components/   # RecordCustomerPaymentModal, RecordVendorPaymentModal, CreateVendorBillModal, CreateVendorModal
│   │   └── pages/        # CustomerDuesPage, VendorDuesPage
│   ├── invoices/         # Billing & Invoicing Engine (Phase 5)
│   │   ├── types/        # Invoice, InvoiceLineItem, InvoiceFormData, TaxDetails interfaces
│   │   ├── services/     # invoiceService API consumer
│   │   └── pages/        # InvoiceListPage, InvoiceCreatePage (GST/Non-GST), InvoiceDetailsPage (Print/PDF/WhatsApp)
│   ├── cashCustody/      # Partner Physical Cash Custody (Phase 5)
│   │   ├── types/        # CashBalance, CashMovement, PartnerCashSummary
│   │   ├── services/     # cashCustodyService API consumer
│   │   ├── components/   # RecordCashMovementModal
│   │   └── pages/        # CashCustodyPage (Partner 1, 2, 3 Balances, Bank Balance, Movement Audit)
│   ├── partners/         # Partner accounts, balances, deposits (Phase 4)
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
│   ├── auth.middleware.ts# requireAuth & requirePartner JWT validation
│   ├── upload.middleware.ts # Multer memory storage validating image types & 5MB size limit
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
│   ├── events/           # Catering Bookings & Events (Phase 3 & Phase 5)
│   │   ├── event.model.ts, event.schema.ts, event.service.ts (Event Financial Overview), event.controller.ts, event.routes.ts
│   ├── transactions/     # Centralized Financial Ledger (Phase 4 & Phase 5)
│   │   ├── transaction.model.ts   # Core ledger schema with amountPaise, type, source, audit stamps, invoice/bill/custody links
│   │   ├── transaction.schema.ts  # Zod validation for create, update, filter params
│   │   ├── transaction.service.ts # Transaction CRUD, search, pagination, orphaned file cleanup
│   │   ├── transaction.controller.ts
│   │   └── transaction.routes.ts
│   ├── accounts/         # Accounting Calculations & Aggregations (Phase 4)
│   │   ├── account.service.ts     # Common balance, revenue, expense, partner and date-wise math
│   │   ├── account.controller.ts
│   │   └── account.routes.ts
│   ├── invoices/         # Invoicing, Billing & Customer Dues (Phase 5)
│   │   ├── invoice.model.ts       # Invoice schema with line items, paise precision, tax calculations, payment history
│   │   ├── invoice.schema.ts      # Zod validation for invoice creation and payment
│   │   ├── invoice.service.ts     # Sequence generation, GST/Non-GST calculation engine, payment ledger integration
│   │   ├── invoice.controller.ts
│   │   └── invoice.routes.ts
│   ├── vendors/          # Vendor Directory & Payables Management (Phase 5)
│   │   ├── vendor.model.ts        # Vendor schema with categories, contact, and banking details
│   │   ├── vendorBill.model.ts    # Vendor bill schema with amountPaise, payment history, status
│   │   ├── vendor.schema.ts       # Zod validation for vendor creation, bill creation, and vendor payments
│   │   ├── vendor.service.ts      # Deferred expense recognition, payment ledger integration, vendor dues summary
│   │   ├── vendor.controller.ts
│   │   └── vendor.routes.ts
│   ├── cashCustody/      # Partner Physical Cash Custody Tracking (Phase 5)
│   │   ├── cashCustody.model.ts   # Cash movement schema supporting 6 movement types
│   │   ├── cashCustody.schema.ts  # Zod validation for cash custody movements
│   │   ├── cashCustody.service.ts # Partner-wise cash balance calculation, bank balance reconciliation, non-negative checks
│   │   ├── cashCustody.controller.ts
│   │   └── cashCustody.routes.ts
│   └── dashboard/        # Centralized Operations & Financial Dashboard (Phase 5)
│       ├── dashboard.service.ts   # Aggregation pipeline for upcoming events, 6 financial KPIs, partner cash, dues, recent activity
│       ├── dashboard.controller.ts
│       └── dashboard.routes.ts
│
├── services/             # Core shared application services
│   └── storage/          # Storage abstraction for receipts and attachments
│       ├── storage.interface.ts     # IStorageService contract
│       ├── cloudinary.storage.ts    # Cloudinary v2 image uploader with credential validation
│       ├── local.storage.ts         # Local disk storage fallback (uploads/ directory)
│       └── index.ts                 # Dynamic factory resolving Cloudinary or Local
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

---

## 7. Advanced Accounts, Due Management, Cash Custody & Billing Architecture (Phase 5)

Phase 5 extends the centralized ledger foundation with rigorous accounting controls, multi-channel cash custody, customer and vendor due lifecycles, and professional GST/Non-GST invoice generation.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             LOTUS CATERER MANAGEMENT SYSTEM                      │
│                                                                                  │
│   ┌────────────────────┐     ┌─────────────────────┐     ┌───────────────────┐   │
│   │   CUSTOMER DUES    │     │    CASH CUSTODY     │     │    VENDOR DUES    │   │
│   │  - Event Invoices  │     │  - Physical Cash    │     │  - Vendor Bills   │   │
│   │  - Partial Pay/Adv │     │  - P2P Handovers    │     │  - Deferred Exp   │   │
│   │  - Overdue Alerts  │     │  - Bank Deposits    │     │  - Settle Paymnts │   │
│   └─────────┬──────────┘     └──────────┬──────────┘     └─────────┬─────────┘   │
│             │                           │                          │             │
│             │ Customer Payment          │ Physical Cash Spent      │ Vendor Paid │
│             │ (Creates Income)          │ (Decreases Custody)      │ (Creates Exp│
│             ▼                           ▼                          ▼             │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                    CENTRALIZED TRANSACTION LEDGER                        │   │
│   │        - Single Source of Truth for all Revenues and Expenses            │   │
│   │        - Explicit links: relatedInvoice, relatedVendorBill, CashMovements│   │
│   │        - No Duplicate Revenue; No Premature Expense Recognition          │   │
│   └─────────────────────────────────────┬────────────────────────────────────┘   │
│                                         │                                        │
│                                         ▼                                        │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │             UNIFIED FINANCIAL OVERVIEWS & RECONCILIATIONS                │   │
│   │     Common Balance = Total Physical Cash Held + Common Bank Balance      │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Single Ledger Integration & Accounting Correctness
1. **No Duplicate Revenue Recognition**:
   - Creating an invoice records an accounts receivable (`Customer Due`).
   - Only when actual customer payments (advance or subsequent) are recorded does the system create an atomic `BUSINESS_INCOME` transaction in the ledger referencing `relatedInvoice` and `relatedEvent`.
2. **Deferred Expense Recognition for Vendor Payables**:
   - Creating a vendor bill records an accounts payable (`Vendor Due`). It does **not** count as a paid business expense.
   - When a payment is recorded against the vendor bill, the system creates a `BUSINESS_EXPENSE` transaction in the ledger referencing `relatedVendorBill` and `relatedEvent`.
3. **Physical Cash Custody Separation**:
   - Partner physical cash custody strictly tracks business banknotes held by each partner.
   - Handover movements (`PARTNER_HANDOVER`) decrement the sender's custody and increment the recipient's custody by the exact same amount. Total physical cash remains conserved.
   - Depositing cash to the bank (`BANK_DEPOSIT`) decrements physical cash custody and increments common bank balance; it never creates fictitious income or expense.
   - Cash expenses paid out of partner custody decrement that partner's custody balance while creating a ledger expense.
   - Non-negative balance validation ensures partners cannot transfer or deposit money they do not hold.

### 7.2 Invoicing Engine Pipeline
1. **Sequential Invoice Numbering**: Automated atomic sequence formatting: `LC-YYYY-XXXX` (e.g., `LC-2026-0001`).
2. **Configurable Tax Calculation**:
   - **GST Invoice**: Computes line item taxable values (`qty * rate`), subtracts discounts, and applies configurable item-level GST rates (0%, 5%, 12%, 18%, 28%). Intra-state splits into equal CGST and SGST; inter-state maps to IGST.
   - **Non-GST Invoice**: Clean total with subtotal and optional discounts without tax fields.
3. **Print, PDF & WhatsApp Sharing**:
   - Standard browser print stylesheet (`@media print`) rendering a clean, pixel-perfect printable invoice bill without navigation chrome.
   - Native Web Share API integration on supported mobile devices to share PDF/invoice summary directly to WhatsApp.
   - Instant WhatsApp Web/App prefilled message fallback with structured invoice details, customer name, date, total, and balance due.

### 7.3 Event Financial Hub
Every catering event features a dedicated 360-degree financial overview:
- **Total Invoiced & Collected**: Summarizes all event invoices, advances, and outstanding customer dues.
- **Total Expenses & Payables**: Real-time aggregation of direct event expenses plus unpaid vendor payables.
- **Cash Flow vs. Accounting Position**: Explicitly isolates net cash collected from unpaid liabilities.
- **Quick Action Links**: Allows directly recording event income, booking expenses, issuing invoices, and generating vendor bills pre-linked to the active event.

