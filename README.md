# VendorBridge

**Enterprise Procurement and Vendor Management ERP**

---

![React](https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)

---

## Executive Summary

VendorBridge is a purpose-built procurement management platform designed to digitize and centralize the end-to-end vendor engagement lifecycle. It replaces fragmented spreadsheet-driven workflows with structured, auditable processes spanning vendor registration, request-for-quotation issuance, competitive bid evaluation, multi-tier approval chains, purchase order generation, and automated invoice dispatch. The system is architected around strict relational integrity and role-based access control, enabling procurement teams to enforce compliance, reduce cycle times, and maintain a complete audit trail across all sourcing operations.

---

## System Architecture

VendorBridge follows a decoupled client-server architecture with clear separation of concerns between presentation, business logic, and data persistence layers.

### Frontend

| Attribute         | Detail                                                       |
| :---------------- | :----------------------------------------------------------- |
| **Framework**     | React 19 with TypeScript, scaffolded via Vite 8              |
| **Styling**       | Tailwind CSS 4 with a custom design token system             |
| **Component Kit** | shadcn/ui (Radix UI primitives) for accessible, composable UI |
| **Charting**      | Recharts for data-dense analytics visualizations             |
| **Routing**       | React Router DOM 7 with protected route guards               |
| **Animations**    | Framer Motion for layout transitions and micro-interactions  |

### Backend

| Attribute          | Detail                                                                  |
| :----------------- | :---------------------------------------------------------------------- |
| **Runtime**        | Node.js with Express 5                                                  |
| **Authentication** | JWT-based stateless auth with bcrypt password hashing                   |
| **Email**          | Nodemailer (SMTP transport) with Ethereal fallback for development      |
| **PDF Generation** | PDFKit for server-rendered invoice documents                            |
| **Architecture**   | Vertically partitioned by domain: Identity, Catalog, Approvals, Financials |

### Database

| Attribute     | Detail                                                              |
| :------------ | :------------------------------------------------------------------ |
| **Engine**    | PostgreSQL 16+                                                      |
| **ORM**       | Prisma 7 with the `@prisma/adapter-pg` driver adapter               |
| **Schema**    | 13 models with strict foreign-key constraints and composite indices  |
| **Enums**     | 7 domain-specific enums enforcing valid state transitions            |

> The schema enforces referential integrity at the database level. All identifiers use UUID v4. Timestamps are managed via Prisma's `@default(now())` and `@updatedAt` directives.

---

## Core Modules

| Module                    | Capabilities                                                                                                    | API Domain            |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------- | :--------------------- |
| **Identity and Access**   | User registration, JWT authentication, role-based authorization (Admin, Officer, Vendor, Approver), password reset via SMTP | `/api/auth`            |
| **Vendor Directory**      | Vendor profile creation with GST validation, status lifecycle management (Active, Inactive, Suspended), category-based filtering | `/api/directory`       |
| **RFQ Engine**            | Multi-item RFQ creation with unit-of-measure tracking, deadline enforcement, selective vendor invitation, status progression (Draft, Active, Closed, Awarded) | `/api/rfqs`            |
| **Quotation System**      | Vendor bid submission with per-line-item pricing, delivery timeline capture, automated comparison matrix, status workflow (Draft through Approved/Rejected) | `/api/quotations`      |
| **Approval Workflow**     | Multi-tier approval chains, approver remarks and audit trails, quotation status synchronization upon approval or rejection | `/api/approvals`       |
| **Financials**            | Automated Purchase Order generation with sequential numbering, tax computation (subtotal, tax percentage, tax amount, total), PDF invoice rendering via PDFKit, SMTP email dispatch with PDF attachment | `/api/financials`      |
| **Analytics**             | Dashboard aggregate metrics, spending trend data, procurement KPIs                                               | `/api/analytics`       |

---

## Data Model

The persistence layer comprises 13 relational entities managed via Prisma ORM, enforcing strict foreign-key constraints and composite indices across the procurement domain.

**Interactive Schema Diagram:**
[View on DrawSQL](https://drawsql.app/teams/goon-squad/diagrams/vendorbridgedb)

![VendorBridgeDB Schema Diagram](docs/drawsql_schema.png)

### Entity Hierarchy

```
User
 +-- PasswordResetToken
 +-- VendorProfile
 |    +-- RfqVendorInvite
 |    +-- Quotation
 |         +-- QuotationItem
 |         +-- Approval
 |         +-- PurchaseOrder
 |              +-- Invoice
 +-- Rfq
 |    +-- RfqItem
 |    +-- RfqVendorInvite
 +-- ActivityLog
```

> Refer to `backend/prisma/schema.prisma` for the complete schema definition including field types, constraints, and index specifications.

---

## Project Structure

```
VendorBridge-odoo/
+-- Frontend/                        # React client application
|   +-- src/
|   |   +-- components/
|   |   |   +-- layout/              # DashboardLayout, navigation shell
|   |   |   +-- ui/                  # shadcn/ui primitives (Button, Card, Dialog, Table, ...)
|   |   +-- lib/                     # API client, auth context, utilities
|   |   +-- pages/                   # Route-level page components
|   |   |   +-- Dashboard.tsx        # Metrics overview, spending chart, recent POs
|   |   |   +-- Vendors.tsx          # Vendor directory with add/search/filter
|   |   |   +-- RFQList.tsx          # RFQ listing and status management
|   |   |   +-- CreateRFQ.tsx        # Multi-item RFQ creation form
|   |   |   +-- Quotations.tsx       # Bid comparison matrix
|   |   |   +-- Approvals.tsx        # Multi-tier approval dashboard
|   |   |   +-- InvoiceView.tsx      # PO and Invoice management
|   |   |   +-- Reports.tsx          # Analytics and spend reporting
|   |   |   +-- ActivityLogs.tsx     # Procurement audit trail
|   |   |   +-- Login.tsx            # Authentication with mock bypass
|   |   |   +-- Register.tsx         # User registration
|   |   |   +-- ForgotPassword.tsx   # Password reset request
|   |   |   +-- ResetPassword.tsx    # Token-based password update
|   |   +-- App.tsx                  # Route definitions
|   |   +-- main.tsx                 # Application entry point
|   +-- vite.config.ts               # Vite configuration with API proxy
|   +-- package.json
|
+-- backend/                         # Express API server
|   +-- prisma/
|   |   +-- schema.prisma            # Database schema (13 models, 7 enums)
|   +-- src/
|   |   +-- config/                  # Prisma client singleton
|   |   +-- middleware/              # JWT auth, role authorization, async error handler
|   |   +-- routes/
|   |   |   +-- auth.js              # Signup, login, password reset
|   |   |   +-- directory.js         # Vendor CRUD, user listing
|   |   |   +-- rfqs.js              # RFQ lifecycle management
|   |   |   +-- quotations.js        # Bid submission and review
|   |   |   +-- approvals.js         # Approval chain operations
|   |   |   +-- financials.js        # PO generation, invoicing, PDF, email
|   |   |   +-- analytics.js         # Dashboard aggregation queries
|   |   +-- services/                # Business logic (financial calculations)
|   |   +-- utils/                   # Mailer (Nodemailer), PDF generator (PDFKit)
|   +-- server.js                    # Express app entry point
|   +-- package.json
|   +-- .env.example
```

---

## Local Development Setup

### Prerequisites

- **Node.js** version 22 or later
- **PostgreSQL** version 16 or later (running and accessible)
- **npm** version 10 or later

---

### 1. Database Initialization

Ensure PostgreSQL is running. Create a database for the project:

```bash
psql -U postgres -c "CREATE DATABASE vendorbridge;"
```

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, and optional SMTP credentials

# Generate the Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push

# Start the development server (with file watching)
npm run dev
```

The API server will start on `http://localhost:5000`. Verify with:

```bash
curl http://localhost:5000/api/health
```

---

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd Frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The client application will start on `http://localhost:5173`. The Vite dev server is pre-configured to proxy all `/api` requests to the backend at `localhost:5000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Required | Description                                                                 |
| :------------- | :------: | :-------------------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/vendorbridge`) |
| `JWT_SECRET`   | Yes      | Secret key for signing and verifying JSON Web Tokens                        |
| `NODE_ENV`     | No       | Runtime environment; defaults to `development`                              |
| `SMTP_USER`    | No       | SMTP username for outbound email (Gmail address or equivalent)              |
| `SMTP_PASS`    | No       | SMTP password or app-specific password                                      |
| `PORT`         | No       | API server port; defaults to `5000`                                         |

> When `SMTP_USER` and `SMTP_PASS` are omitted, the mailer automatically provisions an Ethereal test account. Emails can be viewed at [ethereal.email](https://ethereal.email).

### Frontend

The frontend requires no environment variables for local development. The API base URL is configured via the Vite proxy in `vite.config.ts`, which forwards `/api` requests to the backend.

---

## Authentication

VendorBridge implements stateless JWT authentication with role-based access control across four tiers:

| Role         | Access Scope                                                                           |
| :----------- | :------------------------------------------------------------------------------------- |
| **Admin**    | Full system access: user management, vendor lifecycle, all procurement operations       |
| **Officer**  | RFQ creation, vendor directory access, quotation review, PO issuance                   |
| **Approver** | Quotation approval and rejection with remarks                                          |
| **Vendor**   | Quotation submission against invited RFQs                                              |

> For development and demonstration purposes, a mock authentication bypass is available using the credentials `admin@vendorbridge.com` / `password`. This bypass is clearly marked in the codebase with a `TODO` comment for removal prior to production deployment.

---

## API Route Reference

| Method   | Endpoint                         | Auth Required | Description                                |
| :------- | :------------------------------- | :-----------: | :----------------------------------------- |
| `POST`   | `/api/auth/signup`               | No            | Register a new user account                |
| `POST`   | `/api/auth/login`                | No            | Authenticate and receive JWT               |
| `POST`   | `/api/auth/forgot-password`      | No            | Request a password reset email             |
| `POST`   | `/api/auth/reset-password`       | No            | Reset password using emailed token         |
| `GET`    | `/api/auth/me`                   | Yes           | Retrieve current user profile              |
| `GET`    | `/api/directory/vendors`         | Yes           | List all vendors with optional filters     |
| `POST`   | `/api/directory/vendors`         | Yes           | Create a new vendor account                |
| `PATCH`  | `/api/directory/vendors/:id`     | Yes           | Update vendor status or details            |
| `GET`    | `/api/directory/users`           | Yes           | List users with optional role filter       |
| `GET`    | `/api/rfqs`                      | Yes           | List all RFQs                              |
| `POST`   | `/api/rfqs`                      | Yes           | Create a new RFQ with items and invites    |
| `PATCH`  | `/api/rfqs/:id`                  | Yes           | Update RFQ status                          |
| `GET`    | `/api/quotations`                | Yes           | List quotations (filtered by user role)    |
| `POST`   | `/api/quotations`                | Yes           | Submit a quotation against an RFQ          |
| `POST`   | `/api/approvals`                 | Yes           | Submit an approval or rejection decision   |
| `GET`    | `/api/financials/purchase-orders`| Yes           | List purchase orders                       |
| `POST`   | `/api/financials/purchase-orders`| Yes           | Generate a PO from an approved quotation   |
| `GET`    | `/api/financials/invoices`       | Yes           | List invoices                              |
| `POST`   | `/api/financials/invoices`       | Yes           | Generate an invoice from a PO              |
| `GET`    | `/api/analytics/dashboard`       | Yes           | Retrieve dashboard aggregate metrics       |

---

## Technology Stack

| Layer          | Technology                     | Version | Purpose                                  |
| :------------- | :----------------------------- | :------ | :--------------------------------------- |
| Runtime        | Node.js                        | 22+     | Server-side JavaScript execution         |
| Framework      | Express                        | 5.x     | HTTP routing and middleware pipeline      |
| ORM            | Prisma                         | 7.x     | Type-safe database access and migrations |
| Database       | PostgreSQL                     | 16+     | Relational data persistence              |
| Auth           | jsonwebtoken, bcryptjs          | --      | JWT signing and password hashing         |
| Email          | Nodemailer                     | 7.x     | SMTP email dispatch                      |
| PDF            | PDFKit                         | 0.18    | Server-side PDF document generation      |
| UI Framework   | React                          | 19      | Component-based user interface           |
| Language       | TypeScript                     | 6.0     | Static type safety                       |
| Build Tool     | Vite                           | 8.x     | Development server and production builds |
| CSS            | Tailwind CSS                   | 4.x     | Utility-first styling                    |
| Components     | shadcn/ui (Radix UI)           | --      | Accessible, composable UI primitives     |
| Charts         | Recharts                       | 3.x     | Data visualization                       |
| Animation      | Framer Motion                  | 12.x    | Layout transitions and micro-interactions|
| Routing        | React Router DOM               | 7.x     | Client-side navigation                   |

---

## License

This project is developed as part of an academic/hackathon initiative. Licensing terms are to be determined by the repository owner.

---

> **VendorBridge** -- Structured procurement for modern enterprises.
