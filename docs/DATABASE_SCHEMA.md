# Database Schema Specification: Lotus Caterer Management System

## 1. Introduction & Methodology

This document outlines the proposed entity-relationship model and schema specifications for MongoDB using Mongoose.

> [!IMPORTANT]
> **Schema Design Principle**: This document strictly separates **Confirmed Entities** from **Proposed Technical Models**. Unresolved relationships (such as Bookings vs. Events and Role hierarchies) are highlighted as **Tentative** and must NOT be permanently locked into Mongoose models until client confirmation is received.

---

## 2. Confirmed Domain Entities & Responsibilities

Based on confirmed requirements, the domain requires persisting data for:
1. **Partner Accounts**: 3 distinct partners with deposits, expenses, and running balances.
2. **Bookings & Guests**: Client/guest details and booking specifications.
3. **Events / Jobs**: Specific catering assignments with associated income and expenditures.
4. **Transactions (Income & Expense)**: Financial movements with category, source/payee, amount, partner attribution, and receipt attachments.

---

## 3. Implemented Schemas (Phase 2)

### 3.1 Partner Entity (`partners`)
Represents the three business partners holding equal operational and financial authority.

| Field | Type | Required | Unique | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Unique partner identifier |
| `name` | String | Yes | No | Full partner name (min 2 chars) |
| `email` | String | No | Sparse | Contact email address |
| `phone` | String | No | No | Contact phone number |
| `status` | String (Enum) | Yes | No | Account status: `ACTIVE` \| `INACTIVE` (default: `ACTIVE`) |
| `createdAt` | Date | Auto | No | Mongoose timestamp |
| `updatedAt` | Date | Auto | No | Mongoose timestamp |

### 3.2 User Entity (`users`)
Maintains login authentication credentials mapped 1-to-1 with a partner.

| Field | Type | Required | Unique | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Unique user identifier |
| `partner` | ObjectId (Ref) | Yes | Yes | Reference to associated `Partner` document |
| `username` | String | Yes | Yes | Login identifier (lowercase, trimmed, min 3 chars) |
| `passwordHash`| String | Yes | No | Bcrypt hashed password (`select: false`, stripped from JSON) |
| `status` | String (Enum) | Yes | No | Login status: `ACTIVE` \| `INACTIVE` (default: `ACTIVE`) |
| `lastLoginAt` | Date | No | No | Timestamp of most recent successful login |
| `createdAt` | Date | Auto | No | Mongoose timestamp |
| `updatedAt` | Date | Auto | No | Mongoose timestamp |

### 3.3 Event / Booking Entity (`events`) — Implemented in Phase 3
Unified catering job record combining booking specifications, event execution date, guest contact information, and partner audit tracking.

| Field | Type | Required | Unique / Index | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Unique event/booking identifier |
| `title` | String | Yes | No | Event / Booking name (min 2, max 200 chars) |
| `eventDate` | Date | Yes | Yes (Index) | Scheduled date of the catering event |
| `eventDetails` | String | No | No | Detailed menu specs, instructions, notes (max 2000 chars) |
| `guestName` | String | Yes | Yes (Index) | Primary client or guest contact name (min 2, max 100 chars) |
| `guestPhone` | String | Yes | Yes (Index) | Primary contact phone number (min 5, max 20 chars) |
| `guestEmail` | String | No | No | Optional client contact email address |
| `guestAddress` | String | No | No | Optional venue location or contact address (max 500 chars) |
| `createdByPartner` | ObjectId (Ref) | Yes | Yes (Index) | Reference to creating `Partner` document |
| `isDeleted` | Boolean | Yes | Yes (Index) | Soft delete flag (default: `false`) |
| `deletedAt` | Date | No | No | Timestamp of soft deletion |
| `deletedByPartner` | ObjectId (Ref) | No | No | Reference to partner who deleted the record |
| `createdAt` | Date | Auto | No | Mongoose timestamp |
| `updatedAt` | Date | Auto | No | Mongoose timestamp |

### 3.4 Centralized Transaction Ledger Entity (`transactions`) — Implemented in Phase 4
Captures all business money movements: business income, partner contributions, common cash expenses, and partner personally paid expenses in ONE unified collection.

| Field | Type | Required | Unique / Index | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Unique transaction identifier |
| `transactionType` | String (Enum) | Yes | Yes (Index) | `BUSINESS_INCOME` \| `PARTNER_CONTRIBUTION` \| `BUSINESS_EXPENSE` |
| `amountPaise` | Number (Integer) | Yes | Yes (Index) | Monetary value in whole integer paise (prevents float rounding errors) |
| `transactionDate` | Date | Yes | Yes (Index) | Business calendar date of transaction occurrence |
| `description` | String | Yes | No | Detailed description or purpose (min 2, max 1000 chars) |
| `paymentSource` | String (Enum) | Yes | Yes (Index) | `COMMON_BUSINESS` \| `PARTNER_PERSONAL` (default: `COMMON_BUSINESS`) |
| `partner` | ObjectId (Ref) | Conditional | Yes (Index) | Ref to `Partner` (required for contributions & partner personal expenses) |
| `relatedEvent` | ObjectId (Ref) | No | Yes (Index) | Optional Ref to `Event` (links expenditure or income to catering job) |
| `attachments` | Array[Subdoc] | No | No | Attached bills/receipts: `[{ url, publicId, fileSize, mimeType, originalName, uploadedByPartner, uploadedAt }]` |
| `createdByPartner` | ObjectId (Ref) | Yes | Yes (Index) | Reference to partner session who recorded the entry |
| `isDeleted` | Boolean | Yes | Yes (Index) | Soft delete flag (default: `false`). Excluded from accounting calculations |
| `deletedAt` | Date | No | No | Timestamp of soft deletion |
| `deletedByPartner` | ObjectId (Ref) | No | No | Reference to partner who soft-deleted the record |
| `createdAt` | Date | Auto | No | Mongoose timestamp |
| `updatedAt` | Date | Auto | No | Mongoose timestamp |

**Virtuals & Precision**:
- `amount`: Virtual getter returns `amountPaise / 100` formatted as INR float, ensuring JavaScript floating point inaccuracies never corrupt stored database integers.

---

## 4. Unresolved Schema Relationships

The following entity relationships are marked as **TENTATIVE** and must not be implemented in code until the corresponding questions are answered:

```
               ┌───────────────────────┐
               │        Booking        │
               └───────────┬───────────┘
                           │
                 [ 1:1 OR 1:N ? ]   <--- UNRESOLVED (Questions Q1 & Q2)
                           │
                           ▼
               ┌───────────────────────┐
               │      Event / Job      │
               └───────────┬───────────┘
                           │
                           │ 1:N
                           ▼
               ┌───────────────────────┐           ┌──────────────────────┐
               │      Transaction      │──────────▶│    Partner Account   │
               └───────────────────────┘           └──────────────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │  Receipt Attachments  │
               └───────────────────────┘
```

1. **Booking vs. Event Coupling**:
   - If Bookings and Events are 1-to-1, `bookingId` can be embedded or linked via a single foreign key.
   - If a Booking can contain multiple Events (e.g., Haldi, Sangeet, Reception), `events` will reference `bookingId` with a 1-to-many relationship.
   - If Bookings and Events are determined to be synonymous, they will be unified into a single schema.
2. **Inter-Partner Transfer Entity**:
   - If partners can transfer money directly between themselves, a `Transfer` entity or `PARTNER_TRANSFER` transaction type with `fromPartnerId` and `toPartnerId` will be required.
