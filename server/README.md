# StudyKit API (MongoDB)

Normalized MongoDB collections with Express. Matches the frontend at `VITE_API_URL`.

## Setup

```bash
# From project root
cp server/.env.example server/.env
npm install --prefix server
npm run seed --prefix server
npm run dev:api
```

Ensure MongoDB is running locally (`mongodb://127.0.0.1:27017`).

**Frontend:** copy `.env.example` to `.env` (`VITE_API_URL=http://localhost:4000/api`) and restart `npm run dev`.

**Demo login (after seed):** `student@aau.edu.et` / `StudyKit123!`

## Collections (normalized)

| Collection | Purpose |
|------------|---------|
| `users` | Accounts (password hashed) |
| `departments` | University departments |
| `materials` | Files — refs `departmentId`, `uploadedById` |
| `plans` | Subscription tiers |
| `notifications` | Per-user — refs `userId` |
| `chatmessages` | Per-user — optional `materialId` |
| `badges` | Badge definitions |
| `userbadges` | User ↔ badge (junction) |
| `userprogresses` | Streaks & stats per user |
| `courseprogresses` | Course % per user |
| `supporttickets` | Support — refs `userId` |
| `auditlogs` | Admin audit trail |

## Auth

- No JWT in the client.
- Login returns user JSON; frontend stores session in `sessionStorage`.
- Protected routes use header `X-User-Email` (set automatically by the frontend).

## Endpoints

`GET /api/health` · `POST /api/auth/register` · `POST /api/auth/login` ·  
`GET /api/departments` · `GET /api/materials` · `GET /api/progress` ·  
`GET /api/notifications` · `GET /api/billing/plans` · `GET /api/admin/dashboard` ·  
`GET /api/search?q=` · `GET|POST /api/chat`
