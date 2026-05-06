# SkillBridge Attendance Management Prototype

SkillBridge is a role-based attendance management system built for a fictional state-level skilling programme. It features five distinct user workflows and a server-verified REST API.

## 🚀 Live URLs
- Frontend & API Base: [INSERT YOUR VERCEL URL HERE]
- Database: Neon PostgreSQL (Serverless)
- Authentication: Neon Auth

## 🔑 Test Accounts
Use the credentials below to verify role-based access. All roles use the same password for convenience.
Password for all: `Test#625`

| Role | Email |
| :--- | :--- |
| Student 1 | `student@gmail.com` |
| Student 2 | `student2@gmail.com` |
| Trainer | `trainer@gmail.com` |
| Institution | `institution@gmail.com` |
| Programme Manager | `manager@gmail.com` |
| Monitoring Officer | `officer@gmail.com` |

## 🛠️ Stack & Architecture
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS.
- Backend: Next.js Route Handlers (REST API) and Server Actions.
- Database: Neon PostgreSQL - Chosen for its serverless scalability and rapid branching.
- Auth: Neon Auth - Integrated directly with the database for low-latency role checks.

Decision Note: I utilized a unified Next.js architecture to maintain a single source of truth for types and schema, allowing for a rapid 3-day development cycle from prototype to deployment.

## 📊 Data Schema
- users: Maps auth IDs to roles (Student, Trainer, etc.) and institutions.
- batches: Institution-owned groups linked to trainers (many-to-many) and students.
- sessions: Event-specific records created by trainers for specific batches.
- attendance: Real-time marking with server-side validation against session dates.

## ✅ Implemented Features
- Task 1 (Auth): Secure sign-up/login with automatic dashboard routing based on role.
- Task 2 (API): Full REST suite including `/api/batches/[id]/invite` and `/api/programme/summary`.
- Task 3 (UI): Role-gated views (e.g., Monitoring Officer sees a read-only dashboard; Students only see "Mark Attendance" for their active batch).
- Task 4 (Security): Server-side role verification on every protected API call.

## ⚠️ What's Next / Improvements
- Geofencing: With more time, I would implement location-based validation to ensure students are physically present at the center.
- Tokenized Links: Currently, invite links are reusable. I would move to one-time tokenized invites for higher security.