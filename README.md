# Apex University ERP

Apex University ERP (Visual Student & Campus Management System) is a university management platform. It provides administrative tools, academic tracking, student billing, attendance management, examination workflows, document verification, and role-based security.

## Technology Stack

| Layer | Technology Used | Description |
| :--- | :--- | :--- |
| Frontend | Next.js 16 (React 19, TypeScript) | Modern UI with App Router, server-side rendering, and responsive components |
| Styling | Tailwind CSS v4, Lucide Icons | Responsive layout design, mobile sidebar drawer, and accessible controls |
| Backend API | ASP.NET Core (.NET 10) | High-performance C# RESTful Web API backend |
| Database | PostgreSQL / SQLite | Data persistence handled via Drizzle ORM and C# data access handlers |
| Security | BCrypt.js, HttpOnly Session Cookies | Password hashing, rate limiting, origin protection, and session tokens |

## Project Architecture

```
apex-university-erp/
├── aspnet-backend/             # ASP.NET Core C# API Backend
│   ├── Auth/                   # Session authentication and cookie handlers
│   ├── Data/                   # Database connection and DDL initialization
│   ├── Endpoints/              # C# API Endpoint Controllers (24 modules)
│   ├── Lib/                    # Business logic, grading formulas, and seed logic
│   └── Program.cs              # Application entry point and security pipeline
├── src/                        # Next.js Frontend Application
│   ├── app/                    # Next.js App Router pages and global CSS
│   ├── components/             # React UI components (Shell, Dashboards, Features, Charts)
│   ├── db/                     # TypeScript schema and database definitions
│   ├── lib/                    # Client-side utility functions and helper scripts
│   └── middleware.ts           # Authentication and session validation middleware
├── next.config.ts              # API rewrite proxies and HTTP security headers
└── package.json                # Project dependencies and script definitions
```

## System Modules and Working Guide

| Module Name | Purpose | How It Works |
| :--- | :--- | :--- |
| User & Auth Module | Authentication & Access Control | Handles user login, session token management using HttpOnly cookies, password hashing with BCrypt, and instant role switching between Admin, Faculty, and Student roles. |
| Student Management | Scholar Records & Profiles | Stores student demographics, roll numbers, department assignments, GPA, contact info, and status. Admins can create, edit, and delete student records. |
| Faculty Management | Academic Staff Administration | Manages teacher profiles, employee IDs, area specializations, designations, and department assignments. |
| Course Management | Curriculum & Credits Control | Manages course codes, course titles, credit values, semester allocations, assigned faculty, and room locations. |
| Department Management | Academic Divisions | Configures university departments, assigns Heads of Department (HOD), tracks student and faculty counts, and manages office locations. |
| Attendance Module | Student & Staff Register | Allows faculty to record daily or period-wise student attendance, calculate attendance percentages, and track faculty attendance. |
| Fees & Billing Module | Tuition & Structure Control | Manages semester fee structures, generates automated student invoices, processes full or partial fee payments, and prints payment receipts. |
| Grading & Marks Module | Academic Evaluation & CGPA | Enables faculty to input internal assessment marks, practical marks, calculate letter grades, and auto-compute GPA and result statuses. |
| Timetable Module | Class Schedule Allocation | Manages weekly lecture slots by day, time, room number, faculty, course code, and semester. |
| Examination Cell | Offline Exam Planning | Defines exam schedules (Mid-Term, End-Term), configures passing thresholds, tracks schedules, and manages exam cells. |
| Assignment Module | Coursework & Submissions | Faculty publish assignments with due dates and descriptions. Students submit coursework text or files for faculty grading. |
| Noticeboard Module | Campus Announcements | Publishes priority bulletins and news to scholars and staff based on urgent or normal priorities. |
| Leave Governance | Leave Request Workflow | Students submit leave requests with date ranges and reasons. Faculty or admins approve or reject requests with review remarks. |
| Document Vault | Identity & Verification | Allows students to upload identity documents (PDF/images) for administrative verification and approval tracking. |
| Academic Setup | Semesters, Sections & Sessions | Configures academic years, semesters, section divisions, and student course enrollments. |
| Permissions Matrix | Dynamic Access Control | Controls granular read, create, edit, and delete permissions for each role across all system modules. |

## Quick Command Reference

### Frontend Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start Next.js development server on http://localhost:3000 |
| `npm run build` | Build Next.js production bundle with Turbopack |
| `npm run start` | Run Next.js production server |
| `npm run typecheck` | Execute TypeScript compiler check without emitting files |
| `npm run lint` | Run ESLint check across all project files |
| `npm run db:push` | Push schema changes via Drizzle Kit |

### Backend Commands

| Command | Working Directory | Purpose |
| :--- | :--- | :--- |
| `dotnet run` | `./aspnet-backend` | Start ASP.NET Core backend server on http://localhost:5199 |
| `dotnet build` | `./aspnet-backend` | Compile ASP.NET Core project files |
| `dotnet test` | `./aspnet-backend` | Run backend unit and integration tests |

## How to Setup and Run Locally

### Prerequisites
- Node.js version 18.x or higher
- .NET 10 SDK or .NET 8 SDK
- npm package manager

### Installation Steps

1. Install frontend dependencies in the root directory:
```bash
npm install
```

2. Start the ASP.NET Core API backend:
```bash
cd aspnet-backend
dotnet run
```
The backend server runs on `http://localhost:5199` and automatically initializes the database schema and demo records.

3. In a separate terminal window, start the Next.js development server:
```bash
npm run dev
```
The application runs on `http://localhost:3000`. Requests to `/api/*` are automatically proxied to the backend on `http://localhost:5199`.

### Demo Login Accounts

| Role | Email | Default Password |
| :--- | :--- | :--- |
| Admin (Director) | director@vscms.edu | demo12345 |
| Faculty (Professor) | tanya.m@vscms.edu | demo12345 |
| Student (Scholar) | aarav.r@vscms.edu | demo12345 |

## License

This project is proprietary software. All Rights Reserved. Unauthorized copying, distribution, modification, or public display of this software is strictly prohibited. See the [LICENSE](file:///c:/Users/risha/OneDrive/Desktop/new%20improved%20erp%20system/LICENSE) file for details.
