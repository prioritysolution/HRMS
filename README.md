# PrioHRM HRMS Portal

Next.js App Router SaaS portal converted from the PrioHRM HTML/CSS admin template.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + PrioHRM theme tokens (`#4666e1` primary, Nunito)
- Lucide React icons
- Scalable feature folders under `src/app/(app)` and shared UI in `src/components`

## Structure

```
src/
  app/
    (auth)/          # signin, signup, forgot, OTP, reset
    (app)/           # dashboard shell + all product modules
  components/
    layout/          # AppShell, Sidebar, Topbar, UIProvider
    ui/              # StatCard, DataTable, ModulePage, badges
  config/            # navigation map
  data/              # mock datasets
```

## Run

```bash
cd hrms_portal
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

Auth demo: `/signin`

## Backend proxy

The browser sends HRMS API requests to `/backend`, which Next.js rewrites to the backend server. Set `API_BACKEND_URL` in Vercel to the backend base URL (for example, `http://116.193.129.229/priohrm`), without `/api/v1`. The existing `NEXT_PUBLIC_API_BASE_URL` is also accepted for compatibility. Redeploy after changing this setting. The backend must be reachable from Vercel. HTTPS is recommended for the backend because an HTTP connection from Vercel to the backend is unencrypted.

## Theme

Design tokens live in `src/app/globals.css` and mirror the original PrioHRM palette (primary, soft avatars, card canvas `#eaedf1`, dark mode via topbar toggle).
