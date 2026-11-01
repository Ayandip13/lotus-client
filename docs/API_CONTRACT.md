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
