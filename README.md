# Lotus Caterer — Catering Management System

A production-oriented, internal B2B operational and financial management platform for a three-partner catering enterprise. Built with React, Vite, TypeScript, Tailwind CSS, Node.js, Express, MongoDB, and Mongoose.

---

## Architecture & Project Structure

The project is structured with a decoupled frontend and backend:

```
Lotus Caterer/
├── AGENTS.md                  # Mandatory engineering rules & AI agent instructions
├── README.md                  # Project overview and run guide
├── .gitignore                 # Root gitignore
├── .env.example               # Root environment variables reference
├── docs/                      # Central engineering & business documentation
│   ├── PROJECT_OVERVIEW.md    # Product purpose & confirmed scope
│   ├── REQUIREMENTS.md        # Confirmed client requirements & unresolved questions
│   ├── ARCHITECTURE.md        # Technical architecture, module boundaries, data flow
│   ├── DATABASE_SCHEMA.md     # Proposed MongoDB schemas & tentative relations
│   ├── API_CONTRACT.md        # Standardized API response format & conventions
│   ├── UI_GUIDELINES.md       # Design tokens, typography, component rules
│   └── ENGINEERING_BACKLOG.md # Implementation roadmap and progress tracking
├── client/                    # Frontend React + Vite + TypeScript application
└── server/                    # Backend Node.js + Express + TypeScript application
```

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended, tested on v24+)
- npm (v10+ recommended)
- MongoDB instance (local or MongoDB Atlas connection string)

### 1. Environment Setup

Copy `.env.example` in both `server/` and `client/`:

**Server:**
```bash
cp server/.env.example server/.env
```
Ensure `PORT=5000` and `MONGODB_URI` points to your MongoDB instance.

**Client:**
```bash
cp client/.env.example client/.env
```
Ensure `VITE_API_BASE_URL=http://localhost:5000/api`.

---

### 2. Backend Setup & Run

```bash
cd server
npm install
npm run build    # Verify TypeScript compilation and emit to dist/
npm run dev      # Launch in development mode with auto-reload
```

Server will start on port `5000`. Test the health check:
```bash
curl http://localhost:5000/api/health
```

---

### 3. Frontend Setup & Run

```bash
cd client
npm install
npm run build    # Verify TypeScript compilation and bundle production build
npm run dev      # Launch Vite development server
```

The web application will be available at `http://localhost:5173`.

---

## Engineering Guidelines

Please read [AGENTS.md](file:///d:/exponew/Lotus%20Caterer/AGENTS.md) before making any modifications to the codebase. It details the 12 immutable principles, coding standards, and architectural rules.
