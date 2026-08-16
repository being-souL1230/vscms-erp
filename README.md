# Apex University ERP - System Architecture and Module Manual

Apex University ERP (Visual Student and Campus Management System) is an enterprise-grade university management system built with a decoupled architecture featuring a Next.js 16 frontend and an ASP.NET Core (.NET 10) backend.

The system manages academic governance, student records, fee collections, faculty registers, examination workflows, coursework submissions, document verification, and granular role-based security.

## System Architecture

The project consists of a Next.js client application and a C# ASP.NET Core web API backend connected through a same-origin proxy rewrite pipeline.

```
apex-university-erp/
├── aspnet-backend/             # ASP.NET Core (.NET 10) API Server
│   ├── Auth/                   # Cookie management, session tokens, and rate limiters
│   ├── Data/                   # Database configuration and DDL schema handlers
│   ├── Endpoints/              # C# API Controllers (24 distinct module endpoints)
│   ├── Lib/                    # Business logic, grading formulas, and seed logic
│   ├── Program.cs              # Server boot pipeline, CORS, and middleware setup
│   └── aspnet-backend.csproj   # C# project specification and dependencies
├── src/                        # Next.js 16 Client Application
│   ├── app/                    # Next.js App Router pages, layout, and global CSS
│   ├── components/             # React UI components (Shell, Dashboards, Features, Charts)
│   ├── db/                     # TypeScript database schemas and Drizzle ORM setup
│   ├── lib/                    # Client utility functions, grading, and auth helpers
│   ├── types/                  # TypeScript interface definitions for ERP models
│   └── middleware.ts           # Next.js authentication middleware handler
├── next.config.ts              # API proxy rewrite configuration and security headers
├── package.json                # Frontend dependencies and CLI scripts
└── LICENSE                     # Proprietary software license agreement
```

## Technology Stack

| Layer | Technology | Purpose and Implementation Details |
| :--- | :--- | :--- |
| Frontend Framework | Next.js 16 (React 19, TypeScript) | Provides client-side rendering, dynamic dashboard switching, and server routing. |
| Styling & UI | Tailwind CSS v4, Lucide Icons | Responsive layout design, brutalist visual styling, mobile drawer navigation, and accessible forms. |
| Backend Server | ASP.NET Core (.NET 10) | RESTful API backend handling data validation, business logic, rate limiting, and database access. |
| Database Layer | PostgreSQL / SQLite | Relational storage for user accounts, fee records, grades, timetable, and attendance logs. |
| Security Pipeline | BCrypt, HttpOnly Cookies, CORS | Password hashing, session token validation, per-IP rate limiting, and origin check middleware. |

## Detailed Module Specifications and Workflows

| Module | Roles Involved | Technical Working and Workflow Description |
| :--- | :--- | :--- |
| Authentication & Sessions | Admin, Faculty, Student | Validates credentials against BCrypt hashes. Issues HttpOnly `apex_erp_session` cookies with automated session expiration and per-IP brute-force lockout defense. |
| Student Records | Admin, Faculty, Student | Tracks scholar profiles, roll numbers, department assignments, GPA, contact numbers, and status. Supports filtering by department, keyword search, and CSV export. |
| Faculty Management | Admin, Faculty | Manages academic staff, employee IDs, area designations, department mappings, and contact details. |
| Course Administration | Admin, Faculty, Student | Defines course codes, credits, semester levels, room locations, and assigned area faculty. |
| Departmental Setup | Admin | Configures university divisions, assigns Heads of Department (HOD), tracks student/faculty counts, and manages office locations. |
| Student Attendance | Faculty, Student | Faculty log daily or period-wise student attendance (Present, Absent, Late). Calculates individual attendance percentages and flags low attendance. |
| Faculty Attendance | Admin, Faculty | Tracks staff daily attendance registers. Admins can log or update faculty attendance records. |
| Fee Structures & Invoicing | Admin, Accountant, Student | Admin defines semester fee structures by course and semester. Automated background generator creates student invoices. Students or accountants record payments. |
| Fee Payments & Receipts | Student, Accountant, Admin | Processes partial or full fee payments via Cash, UPI, Card, or Bank Transfer. Generates printable receipts with transaction IDs. |
| Grading & Internal Marks | Faculty, Admin, Student | Faculty input theory and practical internal exam marks. Automated formula calculates grade letters (A+, A, B, C, F), GPA, and pass/fail statuses. |
| Examination Cell | Admin, Faculty, Student | Defines offline exam schedules (Mid-Term, End-Term), passing percentages, exam dates, room allocations, and publishes examination timetables. |
| Timetable Allocation | Admin, Faculty, Student | Maps weekly lecture slots by day, start time, end time, assigned room, faculty, and semester. |
| Coursework & Assignments | Faculty, Student | Faculty post assignments with due dates and mark weightage. Students submit text or file links. Faculty grade submissions and provide feedback. |
| Campus Noticeboard | Admin, Faculty, Student | Broadcasts academic bulletins and urgent news categorized by priority (Urgent, Normal). |
| Leave Governance | Student, Faculty, Admin | Students submit leave requests with date ranges and reasons. Faculty or admins review requests with approval/rejection remarks and self-approval guards. |
| Document Vault | Student, Admin, Registrar | Students upload identity documents (PDF/images). Admins or registrars verify documents and update verification status. |
| Academic Setup | Admin | Manages academic sessions (e.g. 2025-26), semester durations, section divisions (Section A, B), and student course enrollments. |
| Permissions Matrix | Admin | Granular security matrix defining view, create, edit, and delete permissions for each role across all system modules. |

## API Endpoints Reference

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | Public | System health check returning API status. |
| POST | `/api/auth/login` | Public | Authenticates user email and password. |
| POST | `/api/auth/demo` | Public | Instant demo login for specified role. |
| POST | `/api/auth/logout` | Authenticated | Clears session cookie and invalidates session token. |
| GET | `/api/students` | Authenticated | Fetches list of registered students. |
| POST | `/api/students` | Admin | Registers a new student record. |
| PUT | `/api/students` | Admin | Updates existing student details. |
| DELETE | `/api/students?id={id}` | Admin | Deletes student record by ID. |
| GET | `/api/faculty` | Authenticated | Fetches list of faculty members. |
| POST | `/api/faculty` | Admin | Registers a new faculty record. |
| PUT | `/api/faculty` | Admin | Updates faculty member details. |
| DELETE | `/api/faculty?id={id}` | Admin | Removes faculty record by ID. |
| GET | `/api/courses` | Authenticated | Fetches course catalog. |
| POST | `/api/courses` | Admin | Adds new course definition. |
| DELETE | `/api/courses?id={id}` | Admin | Deletes course from catalog. |
| GET | `/api/departments` | Authenticated | Fetches university departments. |
| POST | `/api/departments` | Admin | Creates a new department. |
| PUT | `/api/departments` | Admin | Updates department details. |
| DELETE | `/api/departments?id={id}` | Admin | Deletes department. |
| GET | `/api/fees` | Authenticated | Fetches student fee invoices. |
| PUT | `/api/fees` | Authenticated | Records fee payment against an invoice. |
| POST | `/api/fees/generate` | Admin | Generates student invoices from fee structures. |
| GET | `/api/fee-structures` | Authenticated | Fetches configured fee structures. |
| POST | `/api/fee-structures` | Admin | Creates a new fee structure. |
| DELETE | `/api/fee-structures?id={id}` | Admin | Deletes fee structure. |
| GET | `/api/attendance` | Authenticated | Fetches student attendance logs. |
| POST | `/api/attendance` | Faculty, Admin | Logs student attendance entries. |
| GET | `/api/faculty-attendance` | Admin | Fetches staff attendance logs. |
| POST | `/api/faculty-attendance` | Admin | Logs faculty attendance entries. |
| GET | `/api/internal-marks` | Authenticated | Fetches internal exam marks. |
| POST | `/api/internal-marks` | Faculty | Saves draft or submitted internal mark sheets. |
| PATCH | `/api/internal-marks` | Faculty, Admin | Approves or changes status of internal mark sheets. |
| GET | `/api/assignments` | Authenticated | Fetches assignments and submissions. |
| POST | `/api/assignments` | Faculty | Posts a new assignment. |
| GET | `/api/notices` | Authenticated | Fetches active campus notices. |
| POST | `/api/notices` | Admin | Publishes a campus notice. |
| DELETE | `/api/notices?id={id}` | Admin | Removes a notice. |
| GET | `/api/timetable` | Authenticated | Fetches lecture timetable slots. |
| POST | `/api/timetable` | Admin | Adds a new timetable slot. |
| PUT | `/api/timetable` | Admin | Updates a timetable slot. |
| DELETE | `/api/timetable?id={id}` | Admin | Removes a timetable slot. |
| GET | `/api/leaves` | Authenticated | Fetches leave requests. |
| POST | `/api/leaves` | Student, Faculty | Submits a new leave request. |
| PUT | `/api/leaves` | Faculty, Admin | Reviews and approves or rejects leave requests. |
| GET | `/api/documents` | Authenticated | Fetches student uploaded documents. |
| POST | `/api/documents` | Student | Uploads identity or academic documents. |
| PUT | `/api/documents` | Admin, Registrar | Updates document verification status. |
| DELETE | `/api/documents?id={id}` | Admin | Deletes document from vault. |
| GET | `/api/permissions` | Authenticated | Fetches security permissions matrix. |
| POST | `/api/permissions` | Admin | Saves updated permissions matrix. |
| POST | `/api/seed` | Admin | Resets and seeds database with initial demo data. |

## CLI Commands Reference

### Frontend CLI Commands

| Command | Working Directory | Description |
| :--- | :--- | :--- |
| `npm run dev` | `./` (Root) | Starts Next.js development server on http://localhost:3000 |
| `npm run build` | `./` (Root) | Builds optimized Next.js production bundle with Turbopack |
| `npm run start` | `./` (Root) | Launches Next.js production server |
| `npm run typecheck` | `./` (Root) | Runs TypeScript type checker without emitting output files |
| `npm run lint` | `./` (Root) | Runs ESLint validation across project files |
| `npm run db:push` | `./` (Root) | Applies schema updates using Drizzle Kit |

### Backend CLI Commands

| Command | Working Directory | Description |
| :--- | :--- | :--- |
| `dotnet run` | `./aspnet-backend` | Launches ASP.NET Core backend server on http://localhost:5199 |
| `dotnet build` | `./aspnet-backend` | Compiles C# ASP.NET Core project files |
| `dotnet test` | `./aspnet-backend` | Runs backend unit and integration test suite |
| `dotnet clean` | `./aspnet-backend` | Cleans build output binaries |

## Local Installation and Execution

### System Prerequisites
- Node.js version 18.x or higher
- .NET 10 SDK or .NET 8 SDK
- npm package manager

### Step-by-Step Local Setup

1. Install frontend dependencies in the root project directory:
```bash
npm install
```

2. Open a terminal and start the ASP.NET Core API backend:
```bash
cd aspnet-backend
dotnet run
```
The backend starts on `http://localhost:5199` and automatically initializes the database tables and demo seed records.

3. Open a second terminal window and start the Next.js development server:
```bash
npm run dev
```
The application interface starts on `http://localhost:3000`. Requests sent to `/api/*` are automatically rewritten to the backend API running on `http://localhost:5199`.

### Pre-configured Demo User Accounts

| Console Role | Full Name | Email Address | Account ID | Password | Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Admin | Prof. (Dr.) Gauri Singh Gaur | director@vscms.edu | EMP-1 | demo12345 | Full system administration, fee setup, user management, and security controls. |
| Faculty | Dr. Tanya Mishra | tanya.m@vscms.edu | FAC-2 | demo12345 | Attendance logging, internal marks entry, assignments, and student evaluation. |
| Student | Aarav Rao | aarav.r@vscms.edu | SCH-101 | demo12345 | View grades, attendance reports, pay fees, submit assignments, and request leaves. |

## Proprietary License

This project is proprietary software. All Rights Reserved. Unauthorized copying, distribution, modification, reverse engineering, or public display of this software is strictly prohibited. See the [LICENSE](file:///c:/Users/risha/OneDrive/Desktop/new%20improved%20erp%20system/LICENSE) file for complete legal terms.
