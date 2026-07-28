# Frontend (Revamp)

UI/UX specification for the Leave Form Revamp web app (`leaveforms-frontend`).

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router  
**API:** Laravel REST (formsdb + kdtphdb)  
**Backend contracts:** `SCHEMA.md` · `APPROVAL_RULES.md` · `BALANCE_FLOW.md` · `LEGACY_NOTES.md`

**Progress tracker:** `FRONTEND_PROGRESS.xlsx`

---

## Purpose

Modernize the legacy PHP/jQuery leaveforms UI while preserving business rules defined in the backend docs. The frontend must:

- Make the approval workflow transparent (requirements, status, who can act)
- Show balance as **available** / **reserved** (not legacy “used”)
- Support Employee, Approver, and Admin journeys with role-based routes
- Prefer reusable components, consistent routing, and responsive layouts over cloning legacy screens

Do **not** invent balance or approval rules in the UI. Display and gate actions from API state.

---

## Roles & capabilities

| Role | Who | Primary UI |
|------|-----|------------|
| **Employee** | Any authenticated user | File leave, balances, history, cancel/modify, request VL→SL conversion |
| **Approver** | `formspic` P1–P4, President (group-scoped) | Pending queue, approve/reject, team leave visibility |
| **Admin** | HR / leave admin | Conversion review, balance adjustments, reports, special leave admin requirements, reverse confirmed leave |

A user may hold more than one role (e.g. employee + approver). Nav and dashboards should adapt to capabilities returned by the API/session, not hardcoded employee IDs (see `LEGACY_NOTES.md`).

---

## Domain rules the UI must reflect

### Status badges (`leave_info.status`)

| Status | Label (suggested) | User meaning |
|--------|-------------------|--------------|
| `pending_approval` | Pending | Submitted; waiting for first approval |
| `partially_approved` | Partially approved | At least one requirement done; more remain |
| `confirmed` | Confirmed | All requirements satisfied; credits finalized |
| `rejected` | Rejected | Closed by approver; reserved credits released |
| `cancelled` | Cancelled | Closed by employee; reserved credits released |
| `converted_to_sl` | Converted to SL | VL→SL conversion approved |

Source: `APPROVAL_RULES.md` / `SCHEMA.md`.

### Approval UX (do not misrepresent)

Per `APPROVAL_RULES.md`:

- Requirements are **snapshotted at submit** — show the requirement list from the API, not live org charts.
- **One approval can finish VL** when that single requirement is satisfied (e.g. regular employee `[1,2,3,4]` → any P1–P4).
- **VL has no admin step** on the original request. Confirm happens when all requirements are satisfied.
- **Admin** appears when `required_approver_type = admin` (PTB, maternity, emergency, etc.) or on **`leave_conversion`** review.
- Reject on any open requirement **closes the entire leave**; remarks required.
- **First actor wins** per requirement — disable action buttons after another approver has acted.

### Balance UX (`available` / `reserved`)

Per `BALANCE_FLOW.md`:

| Show | Meaning |
|------|---------|
| **Available** | Credits the employee can still file against |
| **Reserved** | Held for pending / partially approved requests |
| **Do not show a “used” bucket** | Consumed leave = sum confirmed `leave_info` (`duration` / `paid_days` / `lwop_days`) |

On file:

- Preview `paid_days` vs `lwop_days` (`paid_days + lwop_days = duration`).
- Warn when request will use LWOP (partial or full).
- Full LWOP → no reserve; still submit/approve normally.

### Edit / cancel rules

| Situation | UI behavior |
|-----------|-------------|
| `pending_approval` and **no** requirement satisfied | Allow edit; if dates change, API re-reserves |
| At least one requirement satisfied | Block edit; prompt **cancel + refile** |
| `pending_approval` or `partially_approved` | Allow cancel with **required** `cancellation_reason` |
| `confirmed` / `rejected` / `cancelled` / `converted_to_sl` | Read-only (except conversion request / admin reverse where allowed) |

### Leave types

| Code | Filing | Notes |
|------|--------|-------|
| `VL` | Primary | Includes unexpected sickness (do **not** file as SL) |
| `SL` | Not filed directly | Created via approved VL→SL conversion |
| `EL`, `ML`, `PL`, `PTB`, `LL` | Per policy | May include `admin` requirement on original request |

Day types: `full` | `half_am` | `half_pm`.

### VL → SL conversion

1. Original leave must be **confirmed VL**.
2. Employee requests conversion + uploads med cert after return.
3. Status on conversion: `pending_review` → Admin approve/reject.
4. On approve: leave becomes `converted_to_sl`; balances update via API (`vl_to_sl_restore` / `vl_to_sl_deduct`).
5. On reject: leave stays confirmed VL; no balance change.

---

## Suggested information architecture

```
/                          → role-aware home / redirect
/login                     → portal redirect / session bootstrap (infra TBD)
/employee
  /dashboard               → balances + recent leaves + CTAs
  /leave/new               → file leave
  /leave/:id               → detail, timeline, cancel/edit/convert
  /history                 → leave history + filters
/approver
  /inbox                   → actionable pending requirements
  /team                    → group-scoped leave list
  /leave/:id               → approve / reject
/admin
  /dashboard
  /conversions             → pending VL→SL reviews
  /balances                → view / manual adjust / reverse
  /reports                 → usage, LWOP, absence warnings
  /leave/:id               → admin actions when applicable
```

Exact paths can differ; keep **role prefixes** and shared leave detail components.

---

## Screen requirements

### Employee dashboard

- VL / SL (and other) **available** + **reserved**
- Shortcuts: File leave, History, Pending conversions
- List of own leaves with status badges
- Optional quarterly absence warning (informational only — do not block filing/approval)

### File leave

- Leave type (default VL; hide or disable direct SL filing)
- Date range + day type → duration from API (workdays / holidays)
- Reason + optional attachment
- LWOP notice when `available` < requested paid days
- `filed_by_emp_id` support for Group Leader filing on behalf of a member
- On success: show new status `pending_approval` and reserved amount

### Leave detail (shared)

- Summary: type, dates, duration, paid/LWOP split, status, confirmed_at
- **Approval progress:** list `leave_approval_requirement` + whether satisfied + who acted (`leave_approval_history`)
- **Activity timeline:** `leave_activity_history` (submitted, modified, cancelled, rejected, confirmed, conversion_*)
- Actions gated by status + role (edit / cancel / approve / reject / convert / admin review)

### Approver inbox

- Only leaves where the current user **can act** on an open requirement (API filter preferred)
- Scope: filer’s primary group in approver’s `fldGroups` (or President/Admin)
- Approve / Reject; reject requires remarks
- After action, refresh status (may jump straight to `confirmed`)

### Admin

- Conversion queue (`leave_conversion.status = pending_review`) with med cert preview
- Manual balance adjustment (remarks required) → `manual_adjustment`
- Reverse confirmed paid leave → `leave_reversed`
- Reports from confirmed `leave_info` (not balance “used”)
- Do not rebuild legacy hardcoded HR emp UI (`LEGACY_NOTES.md`)

---

## Suggested frontend architecture

Repo is early (`App.tsx` + theme tokens in `src/index.css`). Target structure:

```
src/
  app/                 # router, providers, layout shells
  features/
    auth/
    employee/
    approver/
    admin/
    leave/             # shared leave detail, status, timeline
    balance/           # balance cards, transaction history
    conversion/
  components/ui/       # buttons, badges, forms, tables, dialogs
  lib/
    api/               # fetch client, endpoints, error mapping
    types/             # mirrors SCHEMA enums / DTOs
    constants/         # leave colors, status labels
  hooks/
  assets/
```

### Design tokens (already in `src/index.css`)

Use theme colors for leave types:

| Token | Use |
|-------|-----|
| `--color-primary` (#009688) | Primary actions, brand |
| `--color-secondary` (#ffc107) | Accents / warnings |
| `--color-leave-vacation` | VL |
| `--color-leave-sick` | SL |
| `--color-leave-maternity` | ML |
| `--color-leave-paternity` | PL |
| `--color-leave-ptb` | PTB |
| `--color-leave-emergency` | EL |

Typography: Poppins via `--font-sans`. Prefer existing scale (`h1`, `h2`, `header`, `body`, `small`).

### Types to mirror from backend

Keep frontend enums in sync with `SCHEMA.md`:

- `LeaveStatus`, `DayType`
- `ApproverType` (`leader` | `am` | `dm` | `sm` | `admin` | `president`)
- `ActivityType`, `BalanceTransactionReason`, `ConversionStatus`
- DTOs: `LeaveInfo`, `LeaveBalance`, `ApprovalRequirement`, `ApprovalHistory`, `ActivityHistory`, `LeaveConversion`

### API layer guidelines

- Thin pages → feature hooks → `lib/api`
- Never compute final balance/approval outcomes client-side beyond display helpers
- Optimistic UI only where safe (e.g. disabling double-submit); always revalidate from API after approve/reject/cancel
- Map validation errors (e.g. missing cancel reason, reject remarks) to form fields

---

## Auth & session

Per `LEGACY_NOTES.md`: reuse portal session (Sanctum / shared cookie — finalize with infra).

Frontend responsibilities:

- Bootstrap current user + roles/capabilities on load
- Redirect unauthenticated users to portal login
- Gate routes by capability (employee always; approver/admin as returned)
- Do not store secrets; rely on HTTP-only cookies if that is the chosen model

---

## Legacy UI to improve (not copy)

| Legacy pain | Revamp UI goal |
|-------------|----------------|
| Opaque serialized `l_status` | Clear requirement checklist + timeline |
| HR confirm as default VL path | VL confirms on approver completion; admin only where required |
| Unclear cancel | Dedicated cancel with reason + released reserved shown |
| Direct SL for sickness | VL file + conversion flow after return |
| Hardcoded admin IDs | Capability-based nav |
| Balance confusion | Available / reserved + history from ledger |

Source comparison: `LEGACY_NOTES.md`.

---

## Non-goals (frontend)

- Implementing approval matrix or ledger math (backend owns this)
- Altering kdtphdb schema or normalizing `formspic.fldGroups`
- Porting `confirmationAccepted.php` / bulk HR confirm flows for VL
- Filing unexpected sickness as SL

---

## Open items (stakeholder)

Same gaps as backend docs — UI should stay flexible until confirmed:

- Exact requirement sets for EL, ML, PL, PTB, LL beyond “admin when needed”
- Report access / special group rules (legacy KRM / `checkTier`)
- Final auth cookie / Sanctum approach with portal

---

## Using these docs in Cursor

In the frontend repo:

```
@docs/FRONTEND.md
@docs/SCHEMA.md
@docs/APPROVAL_RULES.md
@docs/BALANCE_FLOW.md
@docs/LEGACY_NOTES.md
```

Build screens and components from `FRONTEND.md`. Treat the three backend specs as the source of truth for status, actions, and copy. Use `LEGACY_NOTES.md` only when comparing or migrating old behavior.

---

## Related docs

| Doc | Use in frontend |
|-----|-----------------|
| `SCHEMA.md` | Types, enums, field labels |
| `APPROVAL_RULES.md` | Who can act, status transitions, conversion |
| `BALANCE_FLOW.md` | Available/reserved, LWOP messaging, ledger history |
| `LEGACY_NOTES.md` | What not to rebuild; migration context |
| `FRONTEND_PROGRESS.xlsx` | Module / task progress checklist |
