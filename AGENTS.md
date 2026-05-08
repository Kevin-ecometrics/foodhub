# AGENTS.md

## Commands

```bash
bun dev          # dev server (recommended over npm)
bun run build    # production build
bun run lint    # ESLint
```

## Stack

- Next.js 16 with App Router (React 19)
- Supabase (SSR) for auth/database
- Tailwind CSS 4 (no config file, uses CSS @theme)
- Bun for package management

## Architecture

Three user roles mapped to routes:
- `/admin` - product/table management, login
- `/waiter` - table orders, notifications
- `/customer` - menu browsing, QR entry, payment

DB client: `app/lib/supabase/client.ts` (creates Supabase client for SSR)
Auth: `app/context/SessionContext.tsx`

## TypeScript

- Strict mode enabled
- Path alias: `@/*` maps to project root

## Gotchas

- Tailwind 4 uses `@theme` in CSS, not `tailwind.config.js`
- Next.js 16 makes `params` async in dynamic routes
- No test framework configured