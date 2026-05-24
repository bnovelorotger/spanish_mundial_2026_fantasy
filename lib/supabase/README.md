# lib/supabase

Supabase client factories.

Expected files (Phase 3):

- `client.ts` — Browser client (uses anon key only, safe to import in Client Components).
- `server.ts` — Server client bound to the request cookies (Server Components / Route Handlers / Server Actions).
- `admin.ts` — Service-role client. **Server-only.** Must never be imported from a Client Component.

Rules:

- All three must read env via `process.env` only.
- `admin.ts` must throw at import time if `SUPABASE_SERVICE_ROLE_KEY` is missing.
- Use `@supabase/ssr` for `client.ts` and `server.ts`.
