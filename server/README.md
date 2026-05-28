# StudyKit API (MongoDB)

Express + Mongoose backend. Matches the Vite + TanStack Start frontend
under `../src`. Auth is **JWT-in-cookie** plus Microsoft OAuth. AI is
**Gemini**, payments are **Chapa**, and email is **Resend**.

## Setup

```bash
# From project root
cp server/.env.example server/.env
# Fill in JWT_SECRET (32+ chars), MICROSOFT_*, GEMINI_API_KEY, CHAPA_*, RESEND_*

npm install --prefix server
npm run seed --prefix server
npm run dev:api
```

Ensure MongoDB is running locally (`mongodb://127.0.0.1:27017`).

**Frontend:** copy `.env.example` to `.env` (`VITE_API_URL=http://localhost:4000/api`)
and restart `npm run dev`.

**Demo logins (after seed)** — password is `StudyKit123!` for all three:

| Role      | Email                  |
| --------- | ---------------------- |
| Student   | `student@aau.edu.et`   |
| Professor | `prof.cs@aau.edu.et`   |
| Admin     | `admin@aau.edu.et`     |

## Required env vars

See `.env.example`. Highlights:

- `JWT_SECRET` — long random string (`openssl rand -hex 32`).
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` — Azure AD v2.0 app.
- `GEMINI_API_KEY` — needed for `POST /api/chat/ask`. Without it the endpoint
  returns 503.
- `CHAPA_SECRET_KEY`, `CHAPA_WEBHOOK_SECRET` — Chapa dashboard.
- `RESEND_API_KEY` — Resend dashboard.

If an integration's key is missing, its `GET /…/status` endpoint reports
`{configured:false}` and the corresponding action returns 503. Nothing
silently fakes responses.

## Collections

| Collection         | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| `users`            | Accounts; subscription embedded; OAuth via `microsoftId` |
| `departments`      | University departments                                   |
| `courses`          | Per-department courses                                   |
| `materials`        | Uploaded files (refs `departmentId`, `uploadedById`)     |
| `aicontexts`       | 500-char chunks of PDF text (text index for RAG)         |
| `plans`            | Subscription tiers                                       |
| `notifications`    | Per-user                                                 |
| `chatmessages`     | AI chat history                                          |
| `badges`           | Badge definitions                                        |
| `userbadges`       | User ↔ badge junction                                    |
| `userprogresses`   | Streaks & stats per user                                 |
| `courseprogresses` | Course % per user                                        |
| `supporttickets`   | Tickets (refs `userId`, optional `departmentId`)         |
| `auditlogs`        | Audit trail (download, ai_query, payment, etc.)          |

## Auth

- JWT (HS256) stored in HTTP-only cookie `sk_at`.
- `POST /api/auth/login` and the Microsoft OAuth callback set the cookie.
- `POST /api/auth/logout` clears it.
- The frontend uses `fetch(..., { credentials: "include" })` everywhere.
- `Authorization: Bearer <token>` also works (useful for the CLI / tests).

## Endpoints

### Public

```
GET  /api/health
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/microsoft           → 302 to Azure AD
GET  /api/auth/microsoft/callback  → sets cookie, redirects to client
GET  /api/auth/microsoft/status
GET  /api/departments
GET  /api/courses
GET  /api/billing/plans
```

### Authenticated (any approved user)

```
PATCH /api/auth/department         (student only)
GET   /api/materials               ?q&year&departmentId&uploadedById
GET   /api/materials/:id
GET   /api/download/:materialId    watermarked PDF stream, rate-limited
POST  /api/chat/ask                streaming SSE answer via Gemini
GET   /api/chat                    chat history
POST  /api/chat                    plain (non-streaming) send
GET   /api/streak/calendar         heatmap data (last N days)
POST  /api/streak/check            bump streak on app activity
GET   /api/notifications
POST  /api/tickets
GET   /api/tickets                 role-scoped (student=own, prof=dept, admin=all)
PATCH /api/tickets/:id/reply       admin / professor
PATCH /api/tickets/:id/close       admin / professor
POST  /api/billing/checkout        (delegates to Chapa)
POST  /api/chapa/initialize        returns { checkoutUrl, txRef }
POST  /api/chapa/confirm           polled after return URL
POST  /api/chapa/webhook           HMAC-verified, activates plan
```

### Admin only

```
GET   /api/admin/dashboard
GET   /api/admin/pending-users
PATCH /api/admin/users/:id/approve
PATCH /api/admin/users/:id/reject
PATCH /api/admin/users/:id/promote-professor  { departmentId }
GET   /api/admin/analytics                    ?days=30
POST  /api/admin/broadcast                    Notification fan-out + Resend
```

### Professor (or admin)

```
POST   /api/materials              multer.single('file') + scoping
DELETE /api/materials/:id
GET    /api/professor/analytics    scoped to user.professorDepartmentId
```

## Notes

- Materials expire 4 months after upload (`Material.expiryDate`). The download
  endpoint returns 403 once expired.
- Daily download quota is per-plan (`free: 5`, `student/premium: 50`) and resets
  at 00:00 UTC. Quota state lives on `User.subscription.dailyDownloadsLeft`.
- PDFs are watermarked with `<user.email> · <ISO timestamp>` on every download
  via `pdf-lib`. PPT/DOC are streamed as-is (still audited + rate-limited).
- Webhook body verification uses the **raw** request body — `express.json` is
  configured with a `verify` hook to keep a copy on `req.rawBody`.
