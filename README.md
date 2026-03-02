## ShiftSync – Scheduling MVP

Minimal, sleek scheduling dashboard for the **Priority Soft – Coastal Eats** assessment.  
Supports three roles (Admin, Manager, Staff) across multiple locations with shift fairness, overtime visibility, and controlled swap/pick‑up flows.

---

## 1. High‑Level Features

### 1.1 Core App & Auth

- Clean dark‑theme dashboard built with **Next.js App Router**, **TypeScript**, and **Tailwind CSS**.
- Role‑aware layout and navigation for:
  - **Admin** – global configuration and oversight.
  - **Manager** – location‑scoped operations.
  - **Staff** – personal schedule and availability.
- Email/password login, logout, and `GET /auth/me` for current user.

### 1.2 Admin Experience

- **Dashboard overview**
  - High‑level snapshot of locations, staffing, overtime, and fairness signals.
- **Settings – Skills**
  - CRUD for skills with a verified badge.
  - Skills surfaced across manager/staff flows (assignment, qualification).
- **Settings – Locations**
  - Manage locations (name, timezone, offset, verified).
  - Offset auto‑prefill based on timezone.
  - Reusable modal used for create/edit.
- **Settings – Config**
  - Key/value config entries (e.g. `cut-off` hours) with `x-y-z` DB keys rendered as `X Y Z` on the client.
- **Staff Management (Admin)**
  - Staff table (excluding admins) with per‑user modal:
    - Assign/unassign locations.
    - Assign/unassign skills.

### 1.3 Manager Experience

- **Shifts Management**
  - View, create, edit, delete shifts for managed locations.
  - Store times in UTC; **display in the shift’s location timezone**.
  - Headcount column on manager+admin shift tables.
  - “Premium” badge for Friday/Saturday evening shifts (location timezone).
  - Week‑range schedule filter (current and nearby weeks, browser‑local timezone).
  - “Publish schedule” with cut‑off validation via configurable hours.
- **Assigning Staff to Shifts**
  - Per‑row **Assign** icon opens `AssignUserToShiftModal`.
  - Green “waiting list” badges for candidates; single Assign action to commit.
  - Unassign via badge `×`; double‑booking, availability, and rest‑period rules enforced.
  - Pre‑assignment status check:
    - Calls `GET /users/:userId/shifts/:shiftId/status`.
    - Qualified users appear as green badges; rejected ones appear in a red list with error details.
- **Swap / Drop Requests (Manager view)**
  - Requests table populated from `GET /my/manager/requests`.
  - Manager can **Approve** or **Reject** requests in `pending_manager_approval`.
  - Status badge reflects request lifecycle (pending, pending_manager_approval, accepted, rejected, cancelled).

### 1.4 Staff Experience

- **Dashboard**
  - “Current shift” and “Next shift” tiles with check‑in CTA when in progress.
  - Live on‑duty style tables (for admins) showing who is currently clocked in.
- **Profile**
  - **Weekly hours** target, editable and pre‑populated.
  - **Availability**:
    - Weekly grid (Mon–Sun) with active/inactive + time windows.
    - Stored with weekday index (Mon=0 … Sun=6).
  - **Skills**:
    - Assign/unassign personal skills.
    - Displayed as badges with removable chips.
- **Shifts (Staff tab)**
  - Only shifts the staff member is assigned to.
  - Same week‑range filter semantics as manager.
  - All manager‑only actions disabled.
- **Swap / Drop Requests (Staff view)**
  - Modal‑based request form:
    - **Type first** (Swap / Drop).
    - If **Swap**: shifts dropdown backed by `GET /me/shifts/qualified`.
    - If **Drop**: shifts dropdown backed by `GET /me/shifts`.
    - Qualified users dropdown (disabled for Drop).
  - Requests table powered by `GET /my/requests`:
    - Columns: Type, Shift (location timezone), Requester, Receiver, Status, Action.
    - Requester can cancel while `pending`.
    - Receiver can accept (→ `pending_manager_approval`) or reject.

### 1.5 Pick‑Up Requests

- **Pick‑up page** for staff:
  - Table populated via `GET /my/pick-up-requests`.
  - Shows Location (name), Shift (location timezone), Requester, Status, and Pick button.
  - Pick action:
    - Sends `PUT /my/requests/:id` with `status = "pending_manager_approval"`.
    - Button disabled when already in `pending_manager_approval`.

### 1.6 Overtime & Fairness Analytics

- **Overtime tab**
  - Overtime table with:
    - Staff name, projected hours, status (OK / Over / Caution), and notes/warnings.
  - Status derived from weekly and daily thresholds.
- **Fairness tab**
  - Per‑staff premium shift counts with:
    - Location, team median, premium diff, status.
  - Status labels:
    - **Under‑scheduled**, **Normal**, **Overscheduled**.
  - Uses premium shift detection (Friday/Saturday evenings) and medians per location.

---

## 2. Setup & Running (High Level)

> Implementation is already wired; this section is intentionally minimal.

- **Install dependencies**
  - `npm install`
- **Run dev server**
  - `npm run dev`
- **Default URL**
  - `http://localhost:3000`

---

## 3. Feature Checklist (High‑Level)

### 3.1 Core & Auth

- [x] Next.js App Router structure
- [x] Dark‑theme UI + Tailwind
- [x] Email/password login (`/auth/login`)
- [x] Current user via `/auth/me`
- [x] Logout that clears auth cookie
- [x] Global 401 handling (redirect to `/` when not on login)

### 3.2 Admin Features

- [x] Admin dashboard shell
- [x] Settings tab
- [x] Skills section (list, add, edit, verified badge)
- [x] Locations section (list + modal add/edit)
- [x] Auto‑offset from timezone
- [x] Config section (x-y-z ↔ X Y Z mapping)
- [x] Staff table (all non‑admin users)
- [x] Per‑user modal: assign/unassign locations
- [x] Per‑user modal: assign/unassign skills

### 3.3 Manager Features

- [x] Manager dashboard shell
- [x] Shifts table (manager view)
- [x] Week‑range schedule filter (current + nearby weeks)
- [x] Premium shift detection and badge
- [x] Headcount column on manager+admin tables
- [x] Create/edit shift modal with validation
- [x] Delete shift (+ cascade unassign)
- [x] Publish schedule button (`PUT /shifts/publish`)
- [x] Cut‑off enforcement via config middleware
- [x] Assign staff modal (green waiting list)
- [x] Unassign staff via badges
- [x] Pre‑assign `status` check (`/users/:userId/shifts/:shiftId/status`)
- [x] Red list for failed candidates (with detailed errors)
- [x] Manager swap/drop approval table (`GET /my/manager/requests`)

### 3.4 Staff Features

- [x] Staff dashboard shell
- [x] Current + Next shift tiles (with check‑in)
- [x] Staff shifts tab (`GET /me/shifts`, filtered)
- [x] Weekly hours section (`GET/PUT /me/weekly-hours`)
- [x] Availability grid (Mon–Sun, active + time windows)
- [x] Availability persistence (`PUT /me/availability`)
- [x] Profile skills assign/unassign (`/me/skills/*`)
- [x] Swap/Drop request modal (type → shift list → user)
- [x] Swap/Drop request table (`GET /my/requests`)
- [x] Requester cancel (pending)
- [x] Receiver accept/reject (pending)

### 3.5 Pick‑Up Flow

- [x] Pick‑up list page (staff)
- [x] Data from `GET /my/pick-up-requests`
- [x] Status badge per pick‑up request
- [x] Pick button (`PUT /my/requests/:id` → `pending_manager_approval`)
- [x] Disable pick when already pending manager approval

### 3.6 Overtime & Fairness

- [x] Overtime table with projected hours + notes
- [x] Fairness table columns: location, team median, premium diff
- [x] Status labels: Under‑scheduled / Normal / Overscheduled
- [x] Mock data updated to show all three statuses

### 3.7 Quality & UX

- [x] Minimalistic, consistent dark theme
- [x] Reusable primitives (`Card`, `Button`, `Badge`, `Table`, `Modal`, etc.)
- [x] Role‑aware navigation and views
- [x] User‑friendly validation errors (especially for shift forms)
- [x] Timezone‑correct displays using shift location

> This README is intentionally **high‑level** and conceptual.  
> For implementation details, see the corresponding source files in `src/app`, `src/server`, and `src/lib`.
