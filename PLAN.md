# Financial Tracker - Implementation Plan

## Overview

A business management app for a cleaning company owner (single admin user). Tracks employees across multiple client locations, auto-calculates salaries, revenue, profit, and generates monthly reports. Replaces manual Excel work with a 2-3 click daily workflow.

**Key principle:** Maximum simplicity. Daily input should take under a minute.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** shadcn/ui + Tailwind CSS + Framer Motion
- **Backend/DB:** Supabase (Auth + Postgres)
- **i18n:** next-intl (Serbian + English, JSON translation files)
- **PDF:** (TBD - e.g. @react-pdf/renderer or jspdf)
- **Auth:** Supabase Auth (already set up)
- **Responsive:** Mobile-first, works on laptop and phone

---

## Database Schema

### employees
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| first_name | text | required |
| last_name | text | required |
| phone | text | optional |
| is_active | boolean | default true |
| created_at | timestamptz | |

### clients
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | e.g. "Ahilej", "Dok Bar" |
| pib | text | optional, for PDF invoices |
| type | text | 'regular' or 'one-time' |
| is_active | boolean | default true |
| created_at | timestamptz | |

### jobs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| client_id | uuid | FK -> clients |
| location_name | text | e.g. "Ahilej - Banovo brdo" |
| employee_rate | numeric | hourly rate paid to employee (RSD) |
| client_rate | numeric | hourly rate charged to client (RSD) |
| default_hours | numeric | default shift duration (e.g. 3.5, 5) |
| work_days | int[] | array of days [1=Mon..6=Sat] |
| is_active | boolean | default true |
| created_at | timestamptz | |

### job_assignments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | FK -> jobs |
| employee_id | uuid | FK -> employees |
| custom_rate | numeric | nullable, overrides job.employee_rate for this worker |
| created_at | timestamptz | |

### work_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | FK -> jobs |
| employee_id | uuid | FK -> employees |
| date | date | work date |
| hours | numeric | actual hours worked |
| checked | boolean | confirmed by admin |
| is_extra | boolean | true if ad-hoc/unscheduled work |
| notes | text | optional |
| created_at | timestamptz | |

**Unique constraint:** (job_id, employee_id, date)

### bonuses_penalties
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| employee_id | uuid | FK -> employees |
| type | text | 'bonus' or 'penalty' |
| amount | numeric | RSD |
| date | date | |
| description | text | optional |
| created_at | timestamptz | |

### fixed_costs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | e.g. "Accountant", "Taxes", "Ads" |
| amount | numeric | default monthly amount (RSD) |
| day_of_month | int | when it hits (1st, 15th, etc.) |
| is_recurring | boolean | auto-repeat monthly |
| is_active | boolean | default true |
| created_at | timestamptz | |

### monthly_cost_entries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| fixed_cost_id | uuid | FK -> fixed_costs, nullable |
| name | text | cost name (for manual entries) |
| amount | numeric | actual amount for this month |
| month | date | first day of month (e.g. 2026-04-01) |
| is_disabled | boolean | skipped this month |
| created_at | timestamptz | |

### variable_costs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | description |
| amount | numeric | RSD |
| date | date | |
| created_at | timestamptz | |

---

## Modules & Pages

### 1. HOME - Daily Overview (most important screen)

**Route:** `/dashboard` (default landing page)

**What it does:**
- Auto-generates today's schedule based on job work_days + assigned employees
- Groups by client/job
- Each entry shows: employee name, default hours
- Admin actions per entry:
  - Checkmark to confirm attendance (1 click)
  - Edit hours if different
  - Swap employee for the day
  - Mark as not working (holiday etc.)
- Button to add extra/unscheduled work for today
- Visual indicator if days are unchecked (late input warning)

**Auto-schedule logic:**
1. Get today's day of week (1-6, Mon-Sat)
2. Find all active jobs where `work_days` includes today
3. For each job, get assigned employees from `job_assignments`
4. Pre-populate work_log entries (unchecked) for each
5. Admin confirms or modifies

**Calendar navigation:** ability to go to past days to fill in missed entries.

---

### 2. EMPLOYEES (Radnici)

**Route:** `/employees`

**Features:**
- List all employees with current month earnings (live calculated)
- Add/edit employee (name, phone)
- Employee detail page:
  - List of assigned jobs with rates
  - Current earnings: weekly + monthly breakdown
  - Bonus/penalty management (add, view history)
  - Work history (calendar or list view)

**Salary formula:**
```
salary = SUM(checked_hours * employee_rate per job) + bonuses - penalties
```

---

### 3. CLIENTS (Klijenti)

**Route:** `/clients`

**Features:**
- List all clients with current month revenue
- Add/edit client (name, PIB, type: regular/one-time)
- Client detail page:
  - Jobs/locations under this client
  - Revenue breakdown (current month, by month)
  - PDF report generation (monthly):
    - Number of visits
    - Hours worked
    - Which employees worked
    - Total cost to client
  - Option to add one-time/ad-hoc job

---

### 4. JOBS (Poslovi)

**Route:** `/jobs`

(Can also be managed from client detail page)

**Features:**
- Create job:
  - Select client
  - Location name
  - Employee rate (per hour, paid to worker)
  - Client rate (per hour, charged to client)
  - Default shift hours
  - Work days (Mon-Sat checkboxes)
- Assign employees to job (with optional custom rate override)
- View/edit existing jobs

---

### 5. FINANCES (Finansije)

**Route:** `/finances`

**Sections:**

#### Revenue (auto-calculated)
```
revenue = SUM(checked_hours * client_rate) per job
```
- Breakdown by client
- Daily / weekly / monthly views

#### Costs
- **Salaries** (auto from work_logs): pulled automatically
- **Fixed costs** (recurring monthly):
  - List with ability to add/edit/disable
  - Auto-generated each month
  - Can override amount for specific month
  - Can skip/disable for specific month
- **Variable costs** (manual one-off entries):
  - Add with name, amount, date

#### Profit
```
profit = revenue - salaries - fixed_costs - variable_costs
```
- Daily / weekly / monthly views
- Clear breakdown showing each component

---

### 6. STATISTICS (Statistika)

**Route:** `/statistics`

**Features:**
- **By client:**
  - Monthly revenue trend (chart)
  - Growth month-over-month
  - Top client highlight
- **By employee:**
  - Hours worked per month
  - Earnings per month
  - Overworked alert (too many days)
- **General:**
  - Monthly profit trend
  - "Input delay" tracker (how many days behind on check-ins)
  - Revenue vs costs chart

---

### 7. PDF REPORTS

**Generated from UI buttons (not a separate page):**

#### Client Report (monthly)
- Client name + PIB
- Period
- Table: date | employee | hours
- Total hours, total cost
- Generated from client detail page

#### Accountant Report (monthly)
- Total revenue (by client)
- Total salaries (by employee)
- Fixed costs breakdown
- Variable costs
- Net profit
- Generated from finances page

---

### 8. NOTIFICATIONS

- Daily reminder to check in today's work (if not done by evening)
- Warning if past days are unchecked
- Visual badge on HOME showing "X days behind"
- Implementation: in-app notifications (toast/banner), optionally browser push notifications

---

## Navigation (Main Menu)

Sidebar on desktop, bottom tabs on mobile:

1. **Home** - Daily overview + check-in
2. **Employees** - Manage workers + view earnings
3. **Clients** - Manage clients + jobs
4. **Finances** - Revenue, costs, profit
5. **Statistics** - Charts + insights

---

## i18n Setup (next-intl)

- `/messages/en.json` - English translations
- `/messages/sr.json` - Serbian translations
- Default locale: `sr` (Serbian)
- Language switcher in settings/header
- All UI text must use translation keys

---

## Key Formulas

| Metric | Formula |
|--------|---------|
| Employee salary | `SUM(hours * employee_rate per job) + bonuses - penalties` |
| Client revenue | `SUM(hours * client_rate per job)` |
| Job profit | `SUM(hours * (client_rate - employee_rate))` |
| Monthly profit | `total_revenue - total_salaries - fixed_costs - variable_costs` |

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Database schema (Supabase migrations)
- [ ] next-intl setup with SR/EN JSON files
- [ ] App layout with navigation (sidebar + mobile bottom tabs)
- [ ] Auth flow (already partially done)

### Phase 2: Core Data Management
- [ ] Employees CRUD
- [ ] Clients CRUD
- [ ] Jobs CRUD (with work days, rates, employee assignment)

### Phase 3: Daily Operations (HOME)
- [ ] Auto-schedule generation logic
- [ ] Daily check-in UI (confirm/edit/swap/skip)
- [ ] Calendar navigation for past days
- [ ] Extra/ad-hoc work entry

### Phase 4: Financial Calculations
- [ ] Salary auto-calculation (live)
- [ ] Revenue auto-calculation
- [ ] Fixed costs management (recurring + monthly overrides)
- [ ] Variable costs entry
- [ ] Profit calculation with breakdowns
- [ ] Daily/weekly/monthly views

### Phase 5: Statistics & Reports
- [ ] Client statistics with charts
- [ ] Employee statistics
- [ ] General business insights
- [ ] PDF generation for client reports
- [ ] PDF generation for accountant reports

### Phase 6: Polish
- [ ] Notifications (late input reminders)
- [ ] "Input delay" tracker
- [ ] Top client / overworked employee alerts
- [ ] Mobile responsive fine-tuning
- [ ] Performance optimization

---

## Use Case Summary

The owner manages a cleaning company with employees working at various client locations (gyms, bars, offices, restaurants). Currently uses Excel with manual calculations. Daily workflow should be:

1. Open app -> see today's auto-generated schedule
2. Check off each employee that worked (1 click each)
3. Adjust hours if needed (rare)
4. Done. Everything else calculates automatically.

Monthly workflow:
1. Review finances (auto-calculated)
2. Add/adjust any fixed costs
3. Generate PDF reports for clients and accountant
4. Review statistics for business insights

Ad-hoc:
- Add one-time jobs (e.g. deep cleaning at a regular client's location)
- Add bonuses/penalties for employees
- Add variable costs as they occur
