# API Contract & Communication Standards: Lotus Caterer Management System

## 1. Protocol & Architectural Principles

All client-server interactions adhere to the following core principles:
- **Protocol**: HTTP/1.1 or HTTP/2 over TLS (HTTPS).
- **Format**: JSON (`application/json`) for request and response payloads, with `multipart/form-data` reserved for file/receipt uploads.
- **Statelessness**: Every request must be authenticated independently via `Authorization: Bearer <JWT_TOKEN>`.
- **API Versioning**: All endpoints are prefixed with `/api/v1` (with `/api/health` reserved as a root infrastructure probe).

---

## 2. Standardized Response Formats

Every API response from the backend conforms to a predictable, consistent envelope.

### 2.1 Success Response Envelope

```json
{
  "success": true,
  "message": "Human-readable status or confirmation message",
  "data": { ... }
}
```

- `success`: Always `true` for `2xx` HTTP status codes.
- `message`: Optional descriptive message (e.g., "Resource created successfully").
- `data`: Payload containing the requested resource, collection, or calculation. For list responses, pagination metadata is enclosed within `data`.

#### Paginated Data Structure:
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 85,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2.2 Error Response Envelope

```json
{
  "success": false,
  "message": "High-level summary of the error",
  "error": {
    "code": "MACHINE_READABLE_ERROR_CODE",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be a positive number"
      }
    ]
  }
}
```

- `success`: Always `false` for `4xx` and `5xx` HTTP status codes.
- `message`: Concise, user-safe explanation.
- `error.code`: Machine-readable error identifier (e.g., `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`).
- `error.details`: Array of specific validation issues or contextual details (omitted if no sub-details exist).

---

## 3. Standard HTTP Status Codes

The backend strictly uses standard HTTP status codes:

| Status Code | Meaning | Usage |
| :--- | :--- | :--- |
| `200 OK` | Success | Successful `GET`, `PATCH`, or `PUT` operations. |
| `201 Created` | Created | Successful `POST` operations creating a new resource. |
| `204 No Content` | No Content | Successful `DELETE` operations where no body is returned. |
| `400 Bad Request` | Client Error | Malformed JSON or request failed schema validation (Zod). |
| `401 Unauthorized` | Unauthenticated | Missing, expired, or invalid JWT token. |
| `403 Forbidden` | Forbidden | Authenticated user lacks permission for the requested action. |
| `404 Not Found` | Not Found | Requested endpoint or resource does not exist. |
| `409 Conflict` | Conflict | Resource conflict (e.g., duplicate unique field like email). |
| `500 Server Error` | Internal Error | Unhandled server error (stack trace withheld in production). |

---

## 4. Input Validation & Parameter Conventions

- **Query Parameters**:
  - `page`: 1-based integer for pagination (default: `1`).
  - `limit`: Number of records per page (default: `20`, maximum: `100`).
  - `sort`: Comma-separated sort keys (e.g., `-createdAt`, `amount`).
  - `startDate`, `endDate`: ISO-8601 strings (`YYYY-MM-DD`).
- **Dates**: All dates must be transmitted in ISO-8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Currency**: Monetary values must be sent as positive numeric values.

---

## 5. Implemented Endpoints

### 5.1 System Probes
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` / `/api/health` | Service uptime, timestamp, and environment probe | Public |

### 5.2 Authentication Endpoints (Phase 2)
| Method | Path | Description | Access | Headers |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate partner credentials and receive JWT | Public | None |
| `POST` | `/api/auth/logout` | Discard partner session | Public | None |
| `GET` | `/api/auth/me` | Resolve current authenticated partner and user session | Protected | `Authorization: Bearer <token>` |

#### Login Request Payload:
```json
{
  "username": "partner1",
  "password": "Partner1@Lotus2026"
}
```

#### Login Success Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "6ae74e7f83df4e2c4c410097",
      "username": "partner1",
      "status": "ACTIVE",
      "lastLoginAt": "2026-11-01T14:39:05.204Z"
    },
    "partner": {
      "id": "6ae74e7f83df4e2c4c410093",
      "name": "Partner 1",
      "status": "ACTIVE"
    }
  }
}
```

#### Me Success Response:
```json
{
  "success": true,
  "message": "Current partner session retrieved successfully",
  "data": {
    "user": {
      "id": "6ae74e7f83df4e2c4c410097",
      "username": "partner1",
      "status": "ACTIVE",
      "lastLoginAt": "2026-11-01T14:39:05.204Z"
    },
    "partner": {
      "id": "6ae74e7f83df4e2c4c410093",
      "name": "Partner 1",
      "status": "ACTIVE"
    }
  }
}
```

### 5.3 Booking & Event Management Endpoints (Phase 3)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/events` | Create new independent booking / event record | Protected (Equal Partner) |
| `GET` | `/api/v1/events` | List bookings with pagination, search, and sorting | Protected (Equal Partner) |
| `GET` | `/api/v1/events/:id` | Retrieve single booking details with creator partner | Protected (Equal Partner) |
| `PUT` | `/api/v1/events/:id` | Update an existing booking/event record | Protected (Equal Partner) |
| `DELETE` | `/api/v1/events/:id` | Soft-delete a booking with partner audit stamp | Protected (Equal Partner) |

*(Note: `/api/v1/bookings` is maintained as an active route alias to `/api/v1/events`)*

#### Create Event Request Payload (`POST /api/v1/events`):
```json
{
  "title": "Roy Wedding Reception",
  "eventDate": "2026-12-25T18:00:00.000Z",
  "eventDetails": "Dinner catering for 350 guests at Royal Palace",
  "guestName": "Subhashish Roy",
  "guestPhone": "+91 98300 12345",
  "guestEmail": "subhash.roy@example.com",
  "guestAddress": "Salt Lake Sector 5, Kolkata"
}
```

#### Event Success Response:
```json
{
  "success": true,
  "message": "Booking/event created successfully",
  "data": {
    "_id": "6ae778ffb49a8de3c0fabc41",
    "title": "Roy Wedding Reception",
    "eventDate": "2026-12-25T18:00:00.000Z",
    "eventDetails": "Dinner catering for 350 guests at Royal Palace",
    "guestName": "Subhashish Roy",
    "guestPhone": "+91 98300 12345",
    "guestEmail": "subhash.roy@example.com",
    "guestAddress": "Salt Lake Sector 5, Kolkata",
    "createdByPartner": {
      "_id": "6ae74e7f83df4e2c4c410093",
      "name": "Partner 1",
      "email": "partner1@lotuscaterer.internal",
      "phone": "+91 98300 00001"
    },
    "isDeleted": false,
    "createdAt": "2026-11-01T17:38:00.000Z",
    "updatedAt": "2026-11-01T17:38:00.000Z"
  }
}
```

---

### 5.4 Centralized Financial Ledger Endpoints (Phase 4)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/transactions` | Record new transaction (supports `multipart/form-data` with receipt files) | Protected (Equal Partner) |
| `GET` | `/api/v1/transactions` | List transactions with multi-field filtering, search, pagination | Protected (Equal Partner) |
| `GET` | `/api/v1/transactions/:id` | Retrieve single transaction details with attachments | Protected (Equal Partner) |
| `PUT` | `/api/v1/transactions/:id` | Update transaction record and optionally attach additional receipts | Protected (Equal Partner) |
| `DELETE` | `/api/v1/transactions/:id` | Soft-delete a transaction (immediately excluded from ledger balance) | Protected (Equal Partner) |

#### Create Transaction Multipart Fields (`POST /api/v1/transactions`):
```
transactionType: "BUSINESS_EXPENSE" | "BUSINESS_INCOME" | "PARTNER_CONTRIBUTION"
amount: 8500.50
transactionDate: "2026-11-01T10:00:00.000Z"
description: "Fresh fish and spices from Sealdah market"
paymentSource: "COMMON_BUSINESS" | "PARTNER_PERSONAL"
partner: "<PartnerObjectId>" (required for PARTNER_CONTRIBUTION or PARTNER_PERSONAL expense)
relatedEvent: "<EventObjectId>" (optional)
attachments: File[] (JPEG, PNG, WebP up to 5MB, max 5 files)
```

---

### 5.5 Accounting & Financial Aggregation Endpoints (Phase 4)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/accounts/summary` | Consolidated financial summary (Common Balance, Income, Expenses, Contributions) | Protected (Equal Partner) |
| `GET` | `/api/v1/accounts/partners` | Partner-wise financial summaries for all three active partners | Protected (Equal Partner) |
| `GET` | `/api/v1/accounts/partners/:partnerId` | Detailed ledger history for a specific partner | Protected (Equal Partner) |
| `GET` | `/api/v1/accounts/date-wise?date=YYYY-MM-DD` | Date-wise expenses, totals, paying partners, and event attributions | Protected (Equal Partner) |

#### Overall Summary Success Response (`GET /api/v1/accounts/summary`):
```json
{
  "success": true,
  "data": {
    "totalBusinessIncome": 150000.00,
    "totalBusinessExpenses": 85000.00,
    "totalPartnerContributions": 50000.00,
    "commonBusinessBalance": 140000.00,
    "commonAccountExpenses": 60000.00,
    "partnerPersonallyPaidExpenses": 25000.00,
    "currency": "INR"
  }
}
```

---

### 5.6 Billing, Invoices & Customer Dues Endpoints (Phase 5)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/invoices` | Create GST or Non-GST invoice with auto numbering (`LC-YYYY-XXXX`) | Protected (Equal Partner) |
| `GET` | `/api/v1/invoices` | List invoices with filters (type, status, event, date, customer) | Protected (Equal Partner) |
| `GET` | `/api/v1/invoices/dues` | Customer dues overview with KPI totals and status breakdown | Protected (Equal Partner) |
| `GET` | `/api/v1/invoices/:id` | Retrieve invoice details with calculated taxes and payment history | Protected (Equal Partner) |
| `POST` | `/api/v1/invoices/:id/payments` | Record customer payment (creates atomic `BUSINESS_INCOME` in ledger) | Protected (Equal Partner) |
| `DELETE` | `/api/v1/invoices/:id` | Cancel invoice (soft deletion, preserving payment audit) | Protected (Equal Partner) |

#### Record Customer Payment Request Payload:
```json
{
  "amount": 25000.00,
  "paymentMethod": "CASH",
  "paymentDate": "2026-11-02T10:00:00.000Z",
  "notes": "Cash received at venue",
  "assignCashToPartner": "6ae74e7f83df4e2c4c410093",
  "idempotencyKey": "opt-uuid-or-unique-key"
}
```
*Note: Clients can pass `Idempotency-Key` or `X-Idempotency-Key` HTTP header or body property to ensure retry safety.*

---

### 5.7 Vendor Directory & Payables Endpoints (Phase 5)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/vendors` | Create vendor in directory with category and bank details | Protected (Equal Partner) |
| `GET` | `/api/v1/vendors` | List active vendors with search and category filtering | Protected (Equal Partner) |
| `GET` | `/api/v1/vendors/:id` | Retrieve vendor profile details | Protected (Equal Partner) |
| `POST` | `/api/v1/vendors/bills` | Record vendor payable bill (does NOT count as paid expense) | Protected (Equal Partner) |
| `GET` | `/api/v1/vendors/bills` | List vendor payable bills with filters (vendor, event, status, date) | Protected (Equal Partner) |
| `GET` | `/api/v1/vendors/dues` | Vendor dues overview with KPI totals and status breakdown | Protected (Equal Partner) |
| `POST` | `/api/v1/vendors/bills/:id/payments` | Settle vendor payment (creates atomic `BUSINESS_EXPENSE` in ledger) | Protected (Equal Partner) |

#### Record Vendor Payment Request Payload:
```json
{
  "amount": 12000.00,
  "paymentSource": "COMMON_BUSINESS",
  "paymentDate": "2026-11-02T14:30:00.000Z",
  "notes": "Paid by partner cash",
  "deductFromPartnerCash": true,
  "payingPartnerId": "6ae74e7f83df4e2c4c410093"
}
```

---

### 5.8 Cash Custody Endpoints (Phase 5)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cash-custody/balances` | Current business cash held per partner, total physical cash, common bank balance | Protected (Equal Partner) |
| `GET` | `/api/v1/cash-custody/movements` | List cash custody movements with filters and pagination | Protected (Equal Partner) |
| `POST` | `/api/v1/cash-custody/movements` | Record cash movement (Handover, Bank Deposit, Bank Withdrawal, Cash Expense) | Protected (Equal Partner) |

#### Partner Handover Request Payload:
```json
{
  "movementType": "PARTNER_HANDOVER",
  "amount": 10000.00,
  "sourcePartner": "6ae74e7f83df4e2c4c410093",
  "destinationPartner": "6ae74e7f83df4e2c4c410094",
  "description": "Handed over cash for market purchases"
}
```

---

### 5.9 Dashboard Overview Endpoint (Phase 5)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/overview` | Centralized executive metrics: Upcoming Events, 6 Financial KPIs, Partner Cash, Dues, Recent Activity | Protected (Equal Partner) |

#### Dashboard Overview Response Payload:
```json
{
  "success": true,
  "data": {
    "financialOverview": {
      "totalBusinessIncome": 250000.00,
      "totalBusinessExpenses": 140000.00,
      "commonBusinessBankBalance": 80000.00,
      "totalPartnerCashInHand": 30000.00,
      "totalCustomerDue": 45000.00,
      "totalVendorDue": 22000.00
    },
    "partnerCashOverview": {
      "partners": [
        { "partnerId": "...", "name": "Partner 1", "cashInHand": 10000.00 },
        { "partnerId": "...", "name": "Partner 2", "cashInHand": 12000.00 },
        { "partnerId": "...", "name": "Partner 3", "cashInHand": 8000.00 }
      ],
      "totalCashInHand": 30000.00,
      "bankBalance": 80000.00
    },
    "duesOverview": {
      "customerDue": 45000.00,
      "customerOverdue": 15000.00,
      "vendorDue": 22000.00,
      "vendorOverdue": 5000.00
    },
    "upcomingEvents": [ ... ],
    "recentTransactions": [ ... ]
  }
}
```

---

### 5.10 Event Financial Hub Endpoint (Phase 5)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/events/:id/financials` | 360-degree event financial breakdown (invoices, collections, expenses, vendor payables) | Protected (Equal Partner) |

