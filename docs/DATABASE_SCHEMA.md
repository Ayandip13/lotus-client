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

## 3. Proposed Schema Specifications

### 3.1 Partner Account Entity (`partners`)
Represents the three business partners.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique partner identifier |
| `name` | String | Yes | Full name of the partner |
| `email` | String | Yes (Unique)| Email address for login and notifications |
| `phone` | String | No | Contact phone number |
| `currentBalance` | Number | Yes | Calculated/cached current funds held by this partner |
| `isActive` | Boolean | Yes | Account status (default: `true`) |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

### 3.2 Booking Entity (`bookings`)
Maintains customer reservation records.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique booking identifier |
| `guestName` | String | Yes | Name of primary guest/customer |
| `guestPhone` | String | Yes | Contact number of guest |
| `guestEmail` | String | No | Email address of guest |
| `bookingDate` | Date | Yes | Date the booking was logged |
| `notes` | String | No | Special client instructions |
| `status` | String (Enum) | Yes | Proposed: `INQUIRY`, `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

### 3.3 Event / Job Entity (`events`)
Maintains catering job execution details and event-specific financial aggregates.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique event identifier |
| `bookingId` | ObjectId | Tentative | Reference to associated Booking (Subject to Q1/Q2 resolution) |
| `title` | String | Yes | Event name (e.g., "Sharma Wedding Reception") |
| `eventDate` | Date | Yes | Scheduled date of the event |
| `venue` | String | No | Venue location or address |
| `guestCount` | Number | No | Expected number of guests/plates |
| `totalIncome` | Number | Yes | Total funds received for this event (computed/cached) |
| `totalExpenses` | Number | Yes | Total expenditures incurred for this event (computed/cached) |
| `status` | String (Enum) | Yes | Proposed: `UPCOMING`, `IN_PROGRESS`, `COMPLETED`, `SETTLED` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

### 3.4 Transaction Entity (`transactions`)
Captures all money movements: partner deposits, personal business expenses, event income, and event expenses.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique transaction identifier |
| `type` | String (Enum) | Yes | `INCOME` \| `EXPENSE` \| `PARTNER_DEPOSIT` |
| `amount` | Number | Yes | Transaction value (always positive number) |
| `partnerId` | ObjectId | Yes | Partner who received the income or incurred the expense |
| `eventId` | ObjectId | No | Associated event (optional for general business overhead) |
| `bookingId` | ObjectId | Tentative | Associated booking (if applicable) |
| `sourceOrPayee`| String | Yes | Source of income or payee of expense |
| `category` | String | Yes | Classification (e.g., "Groceries", "Advance", "Labor", "Crockery") |
| `description` | String | No | Detailed transaction notes |
| `date` | Date | Yes | Transaction occurrence date |
| `attachments` | Array[Object] | No | Receipt/bill images: `[{ url, publicId, fileName }]` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

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
