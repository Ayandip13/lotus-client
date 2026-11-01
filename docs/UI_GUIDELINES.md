# UI & Design System Guidelines: Lotus Caterer Management System

## 1. Design Philosophy

The user interface of the **Lotus Caterer Management System** is built specifically for **daily B2B operational efficiency and financial clarity**. 

### Core Principles:
- **Clutter-Free Visual Hierarchy**: Crucial financial metrics, action triggers, and ledger entries must be immediately legible without distraction.
- **Modern & Professional Aesthetic**: Clean neutral surfaces, subtle borders, crisp typography, and restrained status accents.
- **Mobile-First Responsiveness**: Fast, responsive interaction on desktop, tablet, and mobile devices so partners can record expenses and upload receipts on-site.
- **Consistency**: All interfaces adhere to a unified set of reusable UI components and design tokens.

---

## 2. Color Palette & Semantic Tokens

The color system uses Tailwind CSS slate/neutral scales paired with semantic status colors:

| Token | Class / Value | Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-50` (`#f8fafc`) | Main viewport background |
| **Surface / Card** | `bg-white` (`#ffffff`) | Card backgrounds, modal containers, table surfaces |
| **Primary Brand** | `bg-slate-900` / `text-white` | Primary action buttons, active navigation markers |
| **Secondary Neutral** | `bg-slate-100` / `text-slate-700` | Secondary buttons, subtle pill badges |
| **Border / Divider** | `border-slate-200` (`#e2e8f0`) | Card outlines, table gridlines, input borders |
| **Text Primary** | `text-slate-900` (`#0f172a`) | Page titles, primary numbers, headings |
| **Text Muted** | `text-slate-500` (`#64748b`) | Labels, helper text, timestamps, table headers |
| **Success / Inflow** | `emerald-600` (`#059669`) | Income, deposits, positive balances, active badges |
| **Warning / Notice** | `amber-600` (`#d97706`) | Pending actions, review flags, tentative statuses |
| **Danger / Outflow** | `rose-600` (`#e11d48`) | Expenses, negative balances, destructive actions |

---

## 3. Typography & Hierarchy

The interface utilizes a clean sans-serif typeface (Inter / system-ui):

| Scale | Class | Usage |
| :--- | :--- | :--- |
| **Display / Metric** | `text-3xl font-bold tracking-tight` | High-level summary metrics, large rupee totals |
| **Page Title (H1)** | `text-2xl font-semibold tracking-tight` | Main page headings |
| **Section Title (H2)**| `text-lg font-semibold` | Card header titles, modal titles |
| **Subheading (H3)** | `text-sm font-medium text-slate-500` | Metric labels, table section titles |
| **Body (Regular)** | `text-sm text-slate-700` | General table content, form text, ledger descriptions |
| **Caption / Meta** | `text-xs text-slate-500` | Timestamps, micro-labels, footnotes |

---

## 4. Spacing, Layout & Responsive Grid

- **Base Spacing**: Follows Tailwind's 4px grid (`p-2` = 8px, `p-4` = 16px, `p-6` = 24px).
- **Responsive Layout Shell**:
  - **Desktop (>= 1024px)**: Fixed 260px left sidebar + fluid main content container max-w-7xl with comfortable 32px padding (`p-8`).
  - **Tablet (768px - 1023px)**: Compact sidebar or collapsible drawer with 24px padding (`p-6`).
  - **Mobile (< 768px)**: Collapsible slide-over drawer triggered via top header hamburger button; full-width content with 16px padding (`p-4`).
- **Cards & Surfaces**:
  - Rounded corners: `rounded-xl` for cards, `rounded-lg` for buttons and inputs.
  - Subtle elevation: `shadow-sm border border-slate-200/80`. Avoid deep or exaggerated drop shadows.

---

## 5. Standard Component Guidelines

### 5.1 Buttons (`Button.tsx`)
- **Primary**: `bg-slate-900 text-white hover:bg-slate-800` (Main action per view).
- **Secondary**: `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`.
- **Destructive**: `bg-rose-600 text-white hover:bg-rose-700`.
- **Ghost**: `text-slate-600 hover:bg-slate-100 hover:text-slate-900`.
- **States**: Every button must provide a visual disabled state (`opacity-50 cursor-not-allowed`) and a loading state with an animated spinner.

### 5.2 Form Inputs (`Input.tsx`)
- Standard height: 40px (`h-10 px-3 py-2 text-sm`).
- Focus state: `focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent`.
- Error state: `border-rose-500 text-rose-900 focus:ring-rose-500` with an explicit red error message beneath the field.
- Clear label association: Every input must have an accessible label element.

### 5.3 Badges (`Badge.tsx`)
- Compact indicators (`px-2.5 py-0.5 text-xs font-medium rounded-full`).
- Color-coded by status (Success = emerald, Warning = amber, Danger = rose, Neutral = slate).

### 5.4 Data Tables (`Table.tsx`)
- Minimalist grid styling with light border dividers (`divide-y divide-slate-200`).
- Headers: `text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/75`.
- Row hover: `hover:bg-slate-50/50 transition-colors`.
- Mobile viewport: Wrapped with `overflow-x-auto` to allow horizontal scrolling without breaking the layout.

---

## 6. Accessibility (a11y) Standards

- **Keyboard Navigation**: All interactive elements must be focusable via `Tab` with visible focus rings.
- **Color Contrast**: All text elements must satisfy WCAG AA contrast ratio standards (minimum 4.5:1 against their backgrounds).
- **Icon Buttons**: Every icon-only button must contain an `aria-label` or `<span className="sr-only">`.
- **Screen Reader Alerts**: Dynamic form validation errors must provide appropriate ARIA live attributes.
