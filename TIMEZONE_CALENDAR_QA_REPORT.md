# Timezone & Calendar QA Report

## Automated verification

- TypeScript: passed (`npx tsc --noEmit`).
- ESLint: passed with no errors (`npm run lint -- --quiet`).
- Unit/security/business-rule tests: 30/30 passed (`npm test`).
- Production build: passed (`npm run build`).

## Timezone test cases

1. A legacy database booking stored as `2026-07-18T12:00:00` is restored to `2026-07-18 19:00` in Vietnam.
2. A new V2 booking entered at `19:00` is stored and read back as `19:00` without a seven-hour shift.
3. An explicit UTC timestamp `2026-07-18T12:00:00.000Z` displays as `19:00` in `Asia/Ho_Chi_Minh`.
4. A Postgres timestamp without suffix used for `createdAt` is parsed as UTC.
5. Reservation IDs containing `Date.now()` are used to correctly order recent notifications when old database timestamps are inconsistent.

## Route smoke tests

A local production server was started without Supabase credentials and the following routes returned HTTP 200 using the project's safe fallback data:

- `/login`
- `/admin/bookings`
- `/admin/bookings/calendar`
- `/admin/notifications`
- `/vi/dia-diem/venue-2`

Admin login and signed session cookie were also verified locally.

## Limitation

The supplied environment did not include the user's production Supabase credentials. Database integration behavior was verified through code paths, unit tests and fallback smoke tests, but no destructive migration or write test was run against the production database.
