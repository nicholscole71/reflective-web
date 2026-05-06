# Reflective Web (Minimal)

Simple Next.js (App Router) + Tailwind + Supabase auth setup with 3 pages:

- `/login`
- `/today`
- `/entries`

## 1) Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 2) Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. In Supabase SQL editor, run:

`supabase/schema.sql`

## 3) Auth settings

In Supabase Auth settings, enable Email/Password provider.

For local dev, add redirect URL:

- `http://localhost:3000`

## Notes

- This is intentionally the simplest working version.
- Auth protection is client-side (redirect to `/login` if no session).
