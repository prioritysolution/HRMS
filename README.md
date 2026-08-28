# Staffu HRMS Portal

Next.js App Router SaaS portal converted from the Staffu HTML/CSS admin template.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + Staffu theme tokens (`#4666e1` primary, Nunito)
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

## Theme

Design tokens live in `src/app/globals.css` and mirror the original Staffu palette (primary, soft avatars, card canvas `#eaedf1`, dark mode via topbar toggle).
