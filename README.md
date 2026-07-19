# Eko Telehealth — Admin Console

Next.js admin website for the Eko Telehealth virtual care marketplace. Covers
the admin duties named in the pitch: provider ID verification, two-way review
moderation, and oversight of users and appointments — in the same warm,
card-based design language as the mobile app.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The console runs entirely on mock data until a backend is configured, so every
flow is demoable out of the box.

## Going live

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_URL` to the backend base URL and
   `NEXT_PUBLIC_USE_MOCK_API=false`.
3. Every function in `src/lib/api.ts` documents the backend route it calls —
   implement those under `/admin/*` and the console goes live without UI
   changes. Admin authentication is a TODO flagged in the same file.

## Structure

```
src/
├── app/               # Routes: dashboard, providers, reviews, users, appointments
├── components/        # Sidebar + shared card/badge/table primitives
└── lib/               # Types, mock data, API client (mock ↔ live switch)
```

Deploy like any Next.js app (Vercel is the shortest path — see the
integration guide PDF).
