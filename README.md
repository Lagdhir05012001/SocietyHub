# SocietyHub

Society management dashboard built with React, Vite, and Supabase. It uses Supabase directly from the browser and does not include a Node or Express API server.

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env`, then add the Supabase project URL and anon key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run `supabase/schema.sql` in the Supabase SQL Editor before connecting live data. Authentication uses Supabase Auth; the trigger creates a profile for each newly registered user.

## Included workspace areas

- Overview dashboard with collection, expenses, maintenance, and member metrics
- Members, workers, maintenance, expenses, and attendance navigation
- Responsive mobile navigation and search
- Notice and quick-action workflows
- Supabase client configuration and starter RLS schema

The current dashboard displays seeded demo values until the data hooks for each module are connected to the schema.
