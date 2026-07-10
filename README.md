# DuyT Danang-Concierge

Next.js concierge website + admin dashboard with Supabase sync layer, multilingual public routes and secured admin login.

## Run

```bash
npm install
npm run dev
```

Public site: `http://localhost:3000/en` or `http://localhost:3000/vi`.
Admin: `http://localhost:3000/login`.

Demo admin:

```text
admin@duytconcierge.com
admin123
```

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
ADMIN_EMAIL=admin@duytconcierge.com
ADMIN_PASSWORD=change-this-password
ADMIN_SESSION_SECRET=change-this-secret
```
