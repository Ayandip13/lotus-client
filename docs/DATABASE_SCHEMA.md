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

### 3.4 Centralized Transaction Ledger Entity (`transactions`) — Implemented in Phase 4 & Extended in Phase 5
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
| `relatedInvoice` | ObjectId (Ref) | No | Yes (Index) | Optional Ref to `Invoice` (links payment to customer invoice) |
| `relatedVendorBill`| ObjectId (Ref) | No | Yes (Index) | Optional Ref to `VendorBill` (links payment to vendor payable) |
| `relatedCashMovement`| ObjectId (Ref)| No | Yes (Index) | Optional Ref to `CashMovement` (links cash expense to custody deduction) |
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

### 3.5 Customer Invoice Entity (`invoices`) — Implemented in Phase 5
Maintains professional customer billing documents, GST and Non-GST line items, payment tracking, and accounts receivable.

| Field | Type | Required | Unique / Index | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Unique invoice identifier |
| `invoiceNumber` | String | Yes | Unique Index | Formatted sequential number: `LC-YYYY-XXXX` |
| `invoiceDate` | Date | Yes | Yes (Index) | Issue date of invoice |
| `invoiceType` | String (Enum) | Yes | Yes (Index) | `GST` \| `NON_GST` |
| `relatedEvent` | ObjectId (Ref) | Yes | Yes (Index) | Reference to catering `Event` |
| `customerName` | String | Yes | Yes (Index) | Client or customer name |
| `customerPhone` | String | Yes | Yes (Index) | Contact phone number |
| `customerEmail` | String | No | No | Contact email address |
| `customerAddress` | String | No | No | Billing address |
| `customerGstin` | String | No | No | Client GST Identification Number (for GST invoices) |
| `businessDetails` | Subdoc | Yes | No | Snapshot: `{ legalName, tradeName, address, gstin, phone, email }` |
| `items` | Array[Subdoc] | Yes | No | Line items: `{ description, quantity, unitRatePaise, amountPaise, gstRate, cgstAmountPaise, sgstAmountPaise, igstAmountPaise, totalAmountPaise }` |
| `isInterState` | Boolean | Yes | No | Flag indicating IGST vs (CGST + SGST) |
| `subtotalPaise` | Number (Integer) | Yes | No | Pre-tax line items sum in paise |
| `discountPaise` | Number (Integer) | Yes | No | Overall discount applied in paise |
| `totalTaxPaise` | Number (Integer) | Yes | No | Total accumulated taxes in paise |
| `grandTotalPaise`| Number (Integer) | Yes | No | Final invoice payable amount in paise |
| `paidAmountPaise`| Number (Integer) | Yes | No | Total collected payments in paise |
| `remainingAmountPaise` | Number (Integer) | Yes | Yes (Index) | Outstanding balance in paise |
| `status` | String (Enum) | Yes | Yes (Index) | `UNPAID` \| `PARTIALLY_PAID` \| `PAID` \| `OVERDUE` \| `CANCELLED` |
| `dueDate` | Date | No | Yes (Index) | Optional payment deadline |
| `paymentHistory` | Array[Subdoc] | No | No | Recorded payments: `[{ paymentDate, amountPaise, paymentMethod, reference, recordedByPartner, transactionId }]` |
| `notes` | String | No | No | Payment instructions, bank details or terms |
| `createdByPartner`| ObjectId (Ref) | Yes | Yes (Index) | Reference to partner session who generated invoice |
| `isDeleted` | Boolean | Yes | Yes (Index) | Soft delete flag (default: `false`) |
| `deletedAt` | Date | No | No | Timestamp of cancellation |
| `deletedByPartner`| ObjectId (Ref) | No | No | Reference to partner who cancelled the invoice |
| `createdAt` | Date | Auto | No | Mongoose timestamp |
| `updatedAt` | Date | Auto | No | Mongoose timestamp |

---

### 3.6 Vendor Directory Entity (`vendors`) — Implemented in Phase 5
Maintains external supplier and contractor profiles with category classification and banking credentials.

| Field | Type | Required | Unique / Index | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Unique vendor identifier |
| `name` | String | Yes | Yes (Index) | Vendor / Agency name |
| `contactPerson` | String | No | No | Contact person's name |
| `phone` | String | Yes | Unique Index | Primary contact phone |
| `email` | String | No | No | Contact email |
| `category` | String (Enum) | Yes | Yes (Index) | `RAW_MATERIALS` \| `VEGETABLES` \| `FISH_MEAT` \| `GROCERY` \| `SWEETS_BAKERY` \| `DECORATION` \| `CROCKERY` \| `TRANSPORT` \| `LABOUR` \| `OTHER` |
| `address` | String | No | No | Vendor physical address |
| `gstin` | String | No | No | Vendor GSTIN |
| `bankDetails` | Subdoc | No | No | `{ accountName, accountNumber, ifscCode, bankName, upiId }` |
| `status` | String (Enum) | Yes | Yes (Index) | `ACTIVE` \| `INACTIVE` (default: `ACTIVE`) |
| `notes` | String | No | No | Internal remarks |
| `createdByPartner` | ObjectId (Ref) | Yes | Yes (Index) | Creating partner |
| `createdAt` | Date | Auto | No | Mongoose timestamp |
| `updatedAt` | Date | Auto | No | Mongoose timestamp |

---

### 3.7 Vendor Payable Bill Entity (`vendor_bills`) — Implemented in Phase 5
Tracks outstanding liabilities owed to vendors. Creating a bill registers an accounts payable liability without early cash expense recognition.

| Field | Type | Required | Unique / Index | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Unique vendor bill identifier |
| `billNumber` | String | No | Yes (Index) | Vendor invoice / bill number |
| `vendor` | ObjectId (Ref) | Yes | Yes (Index) | Reference to `Vendor` document |
| `relatedEvent` | ObjectId (Ref) | No | Yes (Index) | Optional catering `Event` linkage |
| `billDate` | Date | Yes | Yes (Index) | Date of invoice |
| `dueDate` | Date | No | Yes (Index) | Expected payment date |
| `description` | String | Yes | No | Description of materials/services supplied |
| `category` | String (Enum) | Yes | Yes (Index) | Same categorization as `Vendor` |
| `totalAmountPaise` | Number (Integer) | Yes | No | Total billed amount in paise |
| `paidAmountPaise` | Number (Integer) | Yes | No | Total settled payments in paise |
| `remainingAmountPaise`| Number (Integer) | Yes | Yes (Index) | Outstanding payable balance in paise |
| `status` | String (Enum) | Yes | Yes (Index) | `UNPAID` \| `PARTIALLY_PAID` \| `PAID` \| `OVERDUE` \| `CANCELLED` |
| `paymentHistory` | Array[Subdoc] | No | No | Settlements: `[{ paymentDate, amountPaise, paymentSource, partner, transactionId, recordedByPartner, notes }]` |
| `attachments` | Array[Subdoc] | No | No | Scanned receipts/bills |
| `notes` | String | No | No | Operational remarks |
| `createdByPartner` | ObjectId (Ref) | Yes | Yes (Index) | Recording partner |
| `isDeleted` | Boolean | Yes | Yes (Index) | Soft delete flag (default: `false`) |
| `deletedAt` | Date | No | No | Timestamp of cancellation |
| `deletedByPartner` | ObjectId (Ref) | No | No | Cancelling partner |
| `createdAt` | Date | Auto | No | Mongoose timestamp |
| `updatedAt` | Date | Auto | No | Mongoose timestamp |

---

### 3.8 Physical Cash Movement Entity (`cash_movements`) — Implemented in Phase 5
Maintains an immutable audit ledger of physical banknote custody held by partners, handovers, and bank deposits.

| Field | Type | Required | Unique / Index | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Unique movement identifier |
| `movementType` | String (Enum) | Yes | Yes (Index) | `CASH_INCOME_ASSIGNED` \| `PARTNER_HANDOVER` \| `BANK_DEPOSIT` \| `BANK_WITHDRAWAL` \| `CASH_EXPENSE` \| `OPENING_BALANCE` |
| `amountPaise` | Number (Integer) | Yes | Yes (Index) | Monetary value in whole integer paise |
| `movementDate` | Date | Yes | Yes (Index) | Calendar timestamp of cash handover/movement |
| `sourcePartner` | ObjectId (Ref) | Conditional | Yes (Index) | Partner giving cash (required for handover, bank deposit, cash expense) |
| `destinationPartner` | ObjectId (Ref)| Conditional | Yes (Index) | Partner receiving cash (required for income assign, handover, bank withdrawal) |
| `channel` | String (Enum) | Yes | No | `PARTNER_CUSTODY` \| `BANK_ACCOUNT` \| `EXTERNAL_CUSTOMER` \| `EXTERNAL_VENDOR` \| `INITIAL_SETUP` |
| `relatedEvent` | ObjectId (Ref) | No | Yes (Index) | Optional reference to `Event` |
| `relatedTransaction`| ObjectId (Ref)| No | Yes (Index) | Optional reference to corresponding `Transaction` in ledger |
| `description` | String | Yes | No | Purpose or explanation of cash movement |
| `recordedByPartner` | ObjectId (Ref) | Yes | Yes (Index) | Partner session who logged the movement |
| `createdAt` | Date | Auto | No | Mongoose timestamp |
| `updatedAt` | Date | Auto | No | Mongoose timestamp |

---

## 4. Entity Relationships & Integration Summary

```
   ┌──────────────────────────────────────────────────────────────┐
   │                         Event / Job                          │
   │               (Central operational anchor)                   │
   └───────▲──────────────────────▲──────────────────────▲────────┘
           │ 1:N                  │ 1:N                  │ 1:N
           │                      │                      │
   ┌───────┴──────────┐   ┌───────┴──────────┐   ┌───────┴──────────┐
   │ Customer Invoice │   │   Transaction    │   │   Vendor Bill    │
   │ (invoices)       │   │  (transactions)  │   │  (vendor_bills)  │
   └───────┬──────────┘   └───────▲──────────┘   └───────▲──────────┘
           │                      │                      │
           │ Payment recorded     │                      │ Payment settled
           └──────────────────────┼──────────────────────┘
                                  │
                                  │ Cash movement linkage
                          ┌───────┴──────────┐
                          │  Cash Movement   │
                          │ (cash_movements) │
                          └──────────────────┘
```

1. **Bookings & Events**: Resolved as unified independent records in Phase 3.
2. **Customer Dues**: Derived from `Invoice` remaining balances. Customer payments atomically create `BUSINESS_INCOME` ledger transactions.
3. **Vendor Dues**: Derived from `VendorBill` remaining balances. Bill settlements atomically create `BUSINESS_EXPENSE` ledger transactions.
4. **Partner Cash Custody**: Managed via `CashMovement` audit log. Conserved across handovers and reconciled with common bank balances.

