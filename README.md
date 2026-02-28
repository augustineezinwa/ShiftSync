# ShiftSync

Minimal MVP dashboard for **Coastal Eats** — multi-location staff scheduling (Priority Soft assessment).

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roles

- **Admin** — All locations, audit log, overtime view.
- **Manager** — My locations: shifts, staff, swap approval, overtime, fairness.
- **Staff** — My shifts, swap/drop requests, pick up shifts, notifications.

Use the home page to choose a role; the dashboard URL keeps `?role=…&userId=…` for navigation.

## Stack

- Next.js 14 (App Router)
- TypeScript, Tailwind CSS
- Mock data in `src/lib/mock-data.ts`
- Reusable UI: `Card`, `Button`, `Badge`, `Table`, `Sidebar`, `DashboardLayout`

## Notes

- UI only (MVP): no API or persistence; all data from mock.
- Role/user from query params for quick switching.
