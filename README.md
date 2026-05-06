# SkillBridge Attendance Management Prototype

SkillBridge is a role-based attendance management prototype for a fictional state-level skilling programme. It supports five roles: Student, Trainer, Institution, Programme Manager, and Monitoring Officer.

## Live URLs

- Frontend: TODO: add deployed Vercel URL
- Backend / API base URL: TODO: add deployed URL, usually the same Next.js deployment origin
- Database: Neon PostgreSQL
- Auth: Neon Auth

## Test Accounts

Replace these with the deployed test accounts you create before submission.

| Role | Email | Password |
| :--- | :--- | :--- |
| Student | student@test.com | password123 |
| Trainer | trainer@test.com | password123 |
| Institution | institution@test.com | password123 |
| Programme Manager | manager@test.com | password123 |
| Monitoring Officer | officer@test.com | password123 |

## Stack

- Frontend: Next.js 16 App Router, React 19, Tailwind CSS
- Backend: Next.js Route Handlers and Server Actions
- Database: Neon PostgreSQL
- Auth: Neon Auth
- Deployment target: Vercel

I used a single Next.js app for both frontend and backend because this assignment is scoped as a 2-3 day prototype. Keeping API routes, auth checks, and UI in one deployable app made the end-to-end flow faster to build and easier to verify.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the required values:

```bash
DATABASE_URL="your-neon-postgres-url"
NEON_AUTH_BASE_URL="your-neon-auth-url"
NEON_AUTH_COOKIE_SECRET="your-cookie-secret"
```

3. Run the development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Schema Decisions

The local application tables mirror the assignment entities:

- `users`: stores the internal user id, auth provider id, name, role, optional institution assignment, and creation timestamp.
- `batches`: owned by an institution.
- `batch_trainers`: many-to-many relationship between trainers and batches.
- `batch_students`: enrollment relationship between students and batches.
- `sessions`: created by trainers for a batch with date and start/end time.
- `attendance`: one attendance mark per student per session, with status and marked timestamp.

The important design choice is that role authorization is verified against the `users` table on protected backend calls, rather than trusting only the frontend dashboard state.

## Implemented API

- `POST /api/batches`
- `POST /api/batches/:id/invite`
- `POST /api/batches/:id/join`
- `POST /api/sessions`
- `POST /api/attendance/mark`
- `GET /api/sessions/:id/attendance`
- `GET /api/batches/:id/summary`
- `GET /api/institutions/:id/summary`
- `GET /api/programme/summary`

All protected endpoints check the authenticated user and validate allowed roles server-side.

## Role Flows

Student:
- signs up or logs in
- joins a batch through an invite link
- sees sessions for enrolled batches
- marks attendance for available sessions

Trainer:
- sees assigned batches
- generates batch invite links
- creates sessions through the REST API
- opens session details to view attendance

Institution:
- creates batches and assigns trainers
- views institution batches, enrolled students, and batch-level counts

Programme Manager:
- views programme-level totals and institution summaries
- has no create-session UI

Monitoring Officer:
- sees read-only programme-level data
- has no create, edit, or delete controls

## What Works

- Five-role sign-up and login flow
- Role-specific dashboards
- Batch invite links for student onboarding
- Student enrollment through invite links
- Session creation by trainers
- Student attendance marking
- Trainer attendance details page
- Programme and institution summary endpoints
- Server-side role checks on protected APIs

## Partial / Skipped

- Invite links are reusable batch links, not one-time tokenized links.
- Attendance currently focuses on self-marked `present`; richer late/absent workflows are represented in the schema/API summaries but not fully exposed in the UI.
- Deployment URLs and final test credentials must be filled in after deployment.

## With More Time

I would add geofencing or time-window validation for attendance marking, so students can only mark attendance during an active session and from an approved location.

## Verification

```bash
npm run lint
npm run build
```
