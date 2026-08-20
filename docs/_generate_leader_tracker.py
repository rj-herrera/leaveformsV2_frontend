"""Generate FRONTEND_LEADER_TRACKER.xlsx — manager-friendly frontend tracker."""

from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import ColorScaleRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).with_name("FRONTEND_LEADER_TRACKER.xlsx")

# Development commitment: start 21 Jul → finish by end of August
PROJECT_START = date(2026, 7, 21)
TODAY = date(2026, 8, 13)  # last code sync date
DEV_END = date(2026, 8, 31)  # development only
# Testing & documentation start after development (dates beyond start are TBD)
POST_DEV_START = date(2026, 9, 1)

SECTION_FILL = {
    "1. Project Setup": "FCE4D6",
    "2. Core App Shell": "FFF2CC",
    "3. Employee Features": "DDEBF7",
    "4. Approver / Team Features": "BDD7EE",
    "5. Admin Features": "E2D5F1",
    "6. UI Polish & Cleanup": "EAD1DC",
    "7. Backend Integration (TBD)": "F4CCCC",
    "8. Testing (after development)": "C6EFCE",
    "9. Documentation (after development)": "D9EAD3",
}

HEADER_FILL = PatternFill("solid", fgColor="1F4E79")
TITLE_FONT = Font(name="Calibri", size=20, bold=True, color="1F4E79")
SUB_FONT = Font(name="Calibri", size=11, color="595959")
HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
SECTION_LABEL = Font(name="Calibri", size=14, bold=True, color="1F4E79")
THIN = Border(
    left=Side(style="thin", color="B0B0B0"),
    right=Side(style="thin", color="B0B0B0"),
    top=Side(style="thin", color="B0B0B0"),
    bottom=Side(style="thin", color="B0B0B0"),
)

FILL_DONE = PatternFill("solid", fgColor="C6EFCE")
FILL_IP = PatternFill("solid", fgColor="FFE699")
FILL_NS = PatternFill("solid", fgColor="F8CBAD")
FILL_BLOCKED = PatternFill("solid", fgColor="FF6B6B")
FILL_OVERALL = PatternFill("solid", fgColor="D6EAF8")

NOTE_BACKEND = (
    "Duration TBD — frontend and backend work separately. Update Start/End when schedule is known."
)
NOTE_POST_DEV = (
    "Starts after development. End of August commitment covers development only — dates TBD."
)

# (section, task, start|None, end|None, status, notes)
TASKS: list[tuple[str, str, date | None, date | None, str, str]] = [
    # --- 1. Project Setup ---
    (
        "1. Project Setup",
        "Set up frontend project (React, TypeScript, styling tools)",
        date(2026, 7, 21),
        date(2026, 7, 21),
        "Completed",
        "",
    ),
    (
        "1. Project Setup",
        "Apply brand colors, fonts, and base page styles",
        date(2026, 7, 21),
        date(2026, 7, 22),
        "Completed",
        "",
    ),
    (
        "1. Project Setup",
        "Define page routes for Employee, Approver, and Admin areas",
        date(2026, 7, 21),
        date(2026, 7, 22),
        "Completed",
        "Routes include RequireAuth / RequireCapability gates and error preview paths.",
    ),
    # --- 2. Core App Shell ---
    (
        "2. Core App Shell",
        "Build main app layout (sidebar menu and top header)",
        date(2026, 7, 21),
        date(2026, 7, 22),
        "Completed",
        "",
    ),
    (
        "2. Core App Shell",
        "Show different menus based on user role (Employee / Approver / Admin)",
        date(2026, 7, 21),
        date(2026, 8, 13),
        "Completed",
        "Sidebar + RequireCapability use live roles from /api/me (approver/admin). Dev persona switcher removed as auth is wired.",
    ),
    (
        "2. Core App Shell",
        "Create reusable screen parts (buttons, forms, tables, status labels)",
        date(2026, 7, 22),
        date(2026, 8, 13),
        "Completed",
        "Built: StatusBadge, FilterSelect, Pagination, Button, Modal, ConfirmReasonModal, AttachmentPreviewModal, SuccessDialog, Skeleton, EmptyState, TableEmptyRow, SortableHeader, ListTabButton, PageBackLink, NotificationPanel, form fields, shared leave panels, tableStyles/tableLayout, admin components.",
    ),
    (
        "2. Core App Shell",
        "Collapsible sidebar menu with saved user preference",
        date(2026, 7, 29),
        date(2026, 7, 30),
        "Completed",
        "Collapsible sidebar with flyouts, localStorage preference, and responsive/mobile behavior (useMediaQuery).",
    ),
    (
        "2. Core App Shell",
        "In-app notifications panel (header bell)",
        date(2026, 7, 31),
        date(2026, 7, 31),
        "Completed",
        "NotificationPanel in TopHeader (unread filter, mark read). Still uses mock notifications until a notifications API is available.",
    ),
    (
        "2. Core App Shell",
        "Error and system feedback pages (401, 403, 404, 409, 500, 503, offline)",
        date(2026, 7, 31),
        date(2026, 7, 31),
        "Completed",
        "Shared ErrorPage layout + dedicated routes. Catch-all invalid URLs show NotFound without redirecting away from the URL.",
    ),
    (
        "2. Core App Shell",
        "Replace temporary placeholder pages with real screens",
        date(2026, 7, 22),
        date(2026, 8, 11),
        "Completed",
        "All feature routes use real pages. PagePlaceholder and unused icons removed. Empty lists use EmptyState / TableEmptyRow.",
    ),
    # --- 3. Employee Features ---
    (
        "3. Employee Features",
        "Employee dashboard: leave balances and recent requests",
        date(2026, 7, 22),
        date(2026, 8, 13),
        "Completed",
        "UI complete; now loads live balances and leave list via useMyBalances / useMyLeaves (SWR).",
    ),
    (
        "3. Employee Features",
        "File leave request (dates, leave type, reason, attachment)",
        date(2026, 7, 23),
        date(2026, 8, 13),
        "Completed",
        "Apply Leave submits via createLeave API; holiday dates from live holidays hook. Multi-file attachments supported.",
    ),
    (
        "3. Employee Features",
        "Show unpaid leave (LWOP) warning when credits are not enough",
        date(2026, 7, 23),
        date(2026, 8, 13),
        "Completed",
        "LWOP / remaining-balance warning shown in filing forms using live balance data where available.",
    ),
    (
        "3. Employee Features",
        "Leave request details: status, approvals needed, and activity history",
        date(2026, 7, 22),
        date(2026, 8, 13),
        "Completed",
        "Details page uses live useLeaveDetail + Approval Details table. Cancel calls live cancelLeave API.",
    ),
    (
        "3. Employee Features",
        "Activity log / leave history with filters",
        date(2026, 7, 23),
        date(2026, 8, 13),
        "Completed",
        "Activity Log page wired to live useActivities API with filters, sorting, and pagination.",
    ),
    (
        "3. Employee Features",
        "Edit leave request (only while still waiting for first approval)",
        date(2026, 7, 22),
        date(2026, 8, 13),
        "Completed",
        "Edit Leave loads live detail and saves via updateLeave API; holiday dates from live hook.",
    ),
    (
        "3. Employee Features",
        "Cancel leave request (with required reason)",
        date(2026, 7, 22),
        date(2026, 8, 13),
        "Completed",
        "Cancel flow on details page with required reason; live cancelLeave + cache revalidation.",
    ),
    (
        "3. Employee Features",
        "Request vacation-to-sick leave conversion (upload medical certificate)",
        date(2026, 7, 23),
        date(2026, 8, 13),
        "Completed",
        "Conversion page uses live leave detail and requestConversion API (multipart med cert).",
    ),
    # --- 4. Approver / Team Features ---
    (
        "4. Approver / Team Features",
        "Approver inbox: list of leave requests waiting for action",
        date(2026, 7, 23),
        date(2026, 8, 13),
        "Completed",
        "Leave Approvals inbox uses live usePendingApprovals / useApprovals (pending + all tabs).",
    ),
    (
        "4. Approver / Team Features",
        "Approve or reject leave (reject requires remarks)",
        date(2026, 7, 23),
        date(2026, 8, 13),
        "Completed",
        "Review page calls live approveLeave / rejectLeave APIs with confirmation modals.",
    ),
    (
        "4. Approver / Team Features",
        "Show clear approval details (who still needs to act)",
        date(2026, 7, 22),
        date(2026, 8, 10),
        "Completed",
        "Changed: progress-bar UI removed. Shared Approval Details table + ApproverStatusBadge on employee/approver/admin request pages.",
    ),
    (
        "4. Approver / Team Features",
        "File leave on behalf of a team member",
        date(2026, 7, 23),
        date(2026, 8, 13),
        "In Progress",
        "UI complete; holidays hook wired. Full live submit / member directory API still being finished.",
    ),
    (
        "4. Approver / Team Features",
        "Team leave calendar and upcoming approved leaves",
        date(2026, 7, 29),
        date(2026, 7, 29),
        "Completed",
        "Calendar + upcoming pages built. Still on mock calendar data until team-calendar API is connected.",
    ),
    # --- 5. Admin Features ---
    (
        "5. Admin Features",
        "Admin view of leave requests and request details",
        date(2026, 7, 29),
        date(2026, 7, 29),
        "Completed",
        "Admin Leave Requests list + detail/validate UIs built. Still mock data until admin API wiring.",
    ),
    (
        "5. Admin Features",
        "Review vacation-to-sick leave conversion requests",
        date(2026, 7, 29),
        date(2026, 7, 29),
        "Completed",
        "Conversion review via Admin Leave Validate page (UI). Live admin conversion API not wired yet.",
    ),
    (
        "5. Admin Features",
        "Manage leave balances and credit distribution",
        date(2026, 7, 29),
        date(2026, 7, 29),
        "Completed",
        "Balances + distribution flows (annual, newly-regularized, parental, contractual) built with mock data.",
    ),
    (
        "5. Admin Features",
        "Administrative logs",
        date(2026, 7, 29),
        date(2026, 7, 29),
        "Completed",
        "Admin Administrative Log UI built with mock data.",
    ),
    (
        "5. Admin Features",
        "Monthly Attendance Report",
        date(2026, 7, 29),
        date(2026, 7, 29),
        "Completed",
        "Report UI built (filters, grid, print/download). Mock data until reports API.",
    ),
    (
        "5. Admin Features",
        "Leave Monetization Candidates report",
        date(2026, 7, 30),
        date(2026, 7, 30),
        "Completed",
        "Report UI built. Mock data until reports API.",
    ),
    (
        "5. Admin Features",
        "Employees with LWOP report",
        date(2026, 7, 30),
        date(2026, 7, 30),
        "Completed",
        "Report UI built. Mock data until reports API.",
    ),
    (
        "5. Admin Features",
        "Support other leave types (emergency, maternity, etc.) in the screens",
        date(2026, 7, 22),
        date(2026, 7, 29),
        "Completed",
        "Emergency, PTB, Maternity/Paternity handled across filing and admin screens.",
    ),
    # --- 6. UI Polish & Cleanup ---
    (
        "6. UI Polish & Cleanup",
        "Review and clean up global CSS (colors, fonts, spacing, typography)",
        date(2026, 7, 30),
        date(2026, 8, 22),
        "In Progress",
        "STILL IN PROGRESS as of 2026-08-13 — codebase review and CSS cleanup ongoing.",
    ),
    (
        "6. UI Polish & Cleanup",
        "Check and fix app shell layout (sidebar, top header, main content area)",
        date(2026, 7, 30),
        date(2026, 8, 22),
        "In Progress",
        "STILL IN PROGRESS as of 2026-08-13 — AppLayout, sidebar, header, overflow, and content spacing under review.",
    ),
    (
        "6. UI Polish & Cleanup",
        "Standardize screen layouts (tables, filter bars, forms, and reports)",
        date(2026, 7, 30),
        date(2026, 8, 22),
        "In Progress",
        "STILL IN PROGRESS as of 2026-08-13 — table/filter/form consistency and empty states being aligned across pages.",
    ),
    (
        "6. UI Polish & Cleanup",
        "Extract shared leave UI and remove unused placeholder code",
        date(2026, 8, 6),
        date(2026, 8, 11),
        "Completed",
        "Shared leave components added; PagePlaceholder removed; EmptyState / TableEmptyRow rolled out.",
    ),
    # --- 7. Backend Integration ---
    (
        "7. Backend Integration (TBD)",
        "Connect frontend to backend API (base connection and shared data types)",
        date(2026, 8, 11),
        date(2026, 8, 13),
        "Completed",
        "Axios client (/api), ApiError + 401 handling, typed API modules, and SWR provider/hooks are in place.",
    ),
    (
        "7. Backend Integration (TBD)",
        "Use portal cookies / session to identify the user (no separate login page)",
        date(2026, 8, 11),
        date(2026, 8, 13),
        "In Progress",
        "Auth bootstraps from userID cookie + GET /api/me. Dev-only Employee ID entry (/login) for local testing — production remains cookie/portal session.",
    ),
    (
        "7. Backend Integration (TBD)",
        "Connect employee leave screens to live API (file, history, cancel, edit)",
        date(2026, 8, 11),
        date(2026, 8, 13),
        "In Progress",
        "Dashboard, activity log, file/edit/cancel/convert, and details are on live APIs. Continue hardening error handling and edge cases.",
    ),
    (
        "7. Backend Integration (TBD)",
        "Connect approver / team screens to live API (inbox, approve, reject)",
        date(2026, 8, 11),
        date(2026, 8, 13),
        "In Progress",
        "Approvals inbox + approve/reject live. Team calendar / file-for-member still need fuller API coverage.",
    ),
    (
        "7. Backend Integration (TBD)",
        "Connect admin screens to live API (balances, conversion, reports)",
        None,
        None,
        "Not Started",
        NOTE_BACKEND + " Admin screens still use mock data.",
    ),
    (
        "7. Backend Integration (TBD)",
        "Joint frontend–backend smoke check once APIs are available",
        None,
        None,
        "Not Started",
        NOTE_BACKEND,
    ),
    # --- 8. Testing (after development) ---
    (
        "8. Testing (after development)",
        "Employee flow testing (file, edit, cancel, view history)",
        POST_DEV_START,
        None,
        "Not Started",
        NOTE_POST_DEV,
    ),
    (
        "8. Testing (after development)",
        "Approver flow testing (approve, reject, team views)",
        POST_DEV_START,
        None,
        "Not Started",
        NOTE_POST_DEV,
    ),
    (
        "8. Testing (after development)",
        "Admin flow testing (balances, conversion, reports)",
        POST_DEV_START,
        None,
        "Not Started",
        NOTE_POST_DEV,
    ),
    (
        "8. Testing (after development)",
        "Mobile / responsive check on common screens",
        POST_DEV_START,
        None,
        "Not Started",
        NOTE_POST_DEV,
    ),
    (
        "8. Testing (after development)",
        "Fix issues found during testing",
        POST_DEV_START,
        None,
        "Not Started",
        NOTE_POST_DEV,
    ),
    # --- 9. Documentation (after development) ---
    (
        "9. Documentation (after development)",
        "Finalize frontend guide for the team (FRONTEND.md)",
        POST_DEV_START,
        None,
        "Not Started",
        NOTE_POST_DEV,
    ),
    (
        "9. Documentation (after development)",
        "Prepare short demo / walkthrough notes for stakeholders",
        POST_DEV_START,
        None,
        "Not Started",
        NOTE_POST_DEV,
    ),
    (
        "9. Documentation (after development)",
        "Handover checklist (how to run, deploy, and who owns what)",
        POST_DEV_START,
        None,
        "Not Started",
        NOTE_POST_DEV,
    ),
]

# Phases: development through Aug; backend TBD; testing/docs after
PHASES = [
    (
        "Phase 1 — Foundation (development)",
        date(2026, 7, 21),
        date(2026, 7, 30),
        "Project setup, layout, collapsible sidebar, menus, reusable UI.",
    ),
    (
        "Phase 2 — Employee features (development)",
        date(2026, 7, 28),
        date(2026, 8, 13),
        "Dashboard, file leave, request details, history, edit, and cancel.",
    ),
    (
        "Phase 3 — Approver / team (development)",
        date(2026, 8, 11),
        date(2026, 8, 21),
        "Approvals inbox, approve/reject, file for member, team calendar.",
    ),
    (
        "Phase 4 — Admin features (development)",
        date(2026, 8, 18),
        date(2026, 8, 28),
        "Admin requests, conversion review, balances, logs, and all three reports (UI complete ahead of schedule).",
    ),
    (
        "Phase 5 — UI polish & cleanup (development)",
        date(2026, 7, 30),
        date(2026, 8, 22),
        "CSS/layout review STILL IN PROGRESS; shared leave components and empty states landed.",
    ),
    (
        "Phase 6 — Development complete (commitment)",
        date(2026, 8, 28),
        date(2026, 8, 31),
        "Frontend development screens targeted complete. End of August = development only.",
    ),
]

# Backend / post-dev rows for schedule (no fixed end)
FLEX_PHASES = [
    (
        "Backend integration (in progress)",
        "Employee + key approver APIs wired (as of 2026-08-13). Admin APIs and remaining team screens still TBD.",
    ),
    (
        "Testing (after development)",
        f"Planned to start on/after {POST_DEV_START.isoformat()}. End date TBD.",
    ),
    (
        "Documentation (after development)",
        f"Planned to start on/after {POST_DEV_START.isoformat()}. End date TBD.",
    ),
]


def apply_status_fill(cell, status: str) -> None:
    if status == "Completed":
        cell.fill = FILL_DONE
    elif status == "In Progress":
        cell.fill = FILL_IP
    elif status == "Blocked":
        cell.fill = FILL_BLOCKED
    else:
        cell.fill = FILL_NS


def main() -> None:
    wb = Workbook()

    # ========== Progress Tracker ==========
    ws = wb.active
    ws.title = "Progress Tracker"

    headers = [
        "Section",
        "Task",
        "Start Date",
        "End Date",
        "Days (weekdays)",
        "Status",
        "Progress %",
        "Weekly Date",
        "Notes",
    ]
    for col, h in enumerate(headers, 1):
        cell = ws.cell(1, col, h)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = THIN

    ws.row_dimensions[1].height = 32

    for i, (section, task, start, end, status, notes) in enumerate(TASKS, 2):
        fill = PatternFill("solid", fgColor=SECTION_FILL[section])
        ws.cell(i, 1, section).fill = fill
        ws.cell(i, 2, task).fill = fill

        c_start = ws.cell(i, 3, start if start else None)
        c_start.number_format = "YYYY-MM-DD"
        c_start.fill = fill
        if not start:
            c_start.value = None

        c_end = ws.cell(i, 4, end if end else None)
        c_end.number_format = "YYYY-MM-DD"
        c_end.fill = fill
        if not end:
            c_end.value = None

        # Weekdays only when both dates present
        c_days = ws.cell(
            i,
            5,
            f'=IF(OR(C{i}="",D{i}=""),"",NETWORKDAYS(C{i},D{i}))',
        )
        c_days.fill = fill
        c_days.alignment = Alignment(horizontal="center")

        c_status = ws.cell(i, 6, status)
        c_status.alignment = Alignment(horizontal="center")
        apply_status_fill(c_status, status)

        c_prog = ws.cell(
            i,
            7,
            f'=IF(F{i}="Completed",1,IF(F{i}="In Progress",0.5,0))',
        )
        c_prog.number_format = "0%"
        c_prog.alignment = Alignment(horizontal="center")
        c_prog.fill = fill

        c_week = ws.cell(
            i,
            8,
            f'=IF(C{i}="","",C{i}+MOD(5-WEEKDAY(C{i},2),7))',
        )
        c_week.number_format = "YYYY-MM-DD"
        c_week.fill = fill
        c_week.alignment = Alignment(horizontal="center")

        ws.cell(i, 9, notes).fill = fill
        for col in range(1, 10):
            ws.cell(i, col).border = THIN

    last = 1 + len(TASKS)

    dv = DataValidation(
        type="list",
        formula1='"Not Started,In Progress,Completed,Blocked"',
        allow_blank=False,
    )
    ws.add_data_validation(dv)
    dv.add(f"F2:F{last}")

    ws.conditional_formatting.add(
        f"G2:G{last}",
        ColorScaleRule(
            start_type="num",
            start_value=0,
            start_color="F8696B",
            mid_type="num",
            mid_value=0.5,
            mid_color="FFEB84",
            end_type="num",
            end_value=1,
            end_color="63BE7B",
        ),
    )

    ws.column_dimensions["A"].width = 34
    ws.column_dimensions["B"].width = 72
    ws.column_dimensions["C"].width = 13
    ws.column_dimensions["D"].width = 13
    ws.column_dimensions["E"].width = 15
    ws.column_dimensions["F"].width = 14
    ws.column_dimensions["G"].width = 12
    ws.column_dimensions["H"].width = 13
    ws.column_dimensions["I"].width = 55
    ws.auto_filter.ref = f"A1:I{last}"
    ws.freeze_panes = "A2"

    note_row = last + 2
    ws.cell(
        note_row,
        1,
        "Commitment: frontend DEVELOPMENT finished by end of August (weekdays = NETWORKDAYS). "
        "Backend Integration has TBD end dates (teams work separately — fill dates when known). "
        "Testing and Documentation start after development (from Sep 2026); end dates TBD. "
        "No login page — portal cookies/session with backend.",
    ).font = SUB_FONT
    ws.merge_cells(start_row=note_row, start_column=1, end_row=note_row, end_column=9)

    # ========== Dashboard ==========
    dash = wb.create_sheet("Dashboard", 0)
    dash["A1"] = "Leave Forms Revamp — Frontend Leader Tracker"
    dash["A1"].font = TITLE_FONT
    dash.merge_cells("A1:G1")

    dash["A2"] = (
        f"Development started {PROJECT_START.isoformat()}. "
        f"Commitment: DEVELOPMENT complete by {DEV_END.isoformat()} (end of August). "
        "Testing & documentation are AFTER development (dates TBD)."
    )
    dash["A2"].font = SUB_FONT
    dash.merge_cells("A2:G2")

    dash["A3"] = (
        "Backend Integration is underway (employee + key approver screens on live API). "
        "Production auth is portal cookies/session (dev-only employee ID entry for local testing). "
        "Days = weekdays only when both dates are set."
    )
    dash["A3"].font = SUB_FONT
    dash.merge_cells("A3:G3")

    dash["A4"] = (
        f"Last aligned to codebase: {TODAY.isoformat()} — "
        "live API wired for auth + employee + key approver flows; admin still mock; "
        "CODEBASE REVIEW AND CLEANUP STILL IN PROGRESS (section 6)."
    )
    dash["A4"].font = Font(name="Calibri", size=11, italic=True, color="595959")
    dash.merge_cells("A4:G4")

    dash["A5"] = (
        "Scoring for Progress % / Overall %:  Completed = 100%   |   In Progress = 50%   |   Not Started / Blocked = 0%"
        "     ·     Overall % = average of ALL task Progress % (not average of section %)"
    )
    dash["A5"].font = Font(name="Calibri", size=11, bold=True, color="1F4E79")
    dash["A5"].fill = PatternFill("solid", fgColor="DEEBF7")
    dash.merge_cells("A5:G5")

    dash["A6"] = "Overall %"
    dash["A6"].font = Font(bold=True, color="1F4E79")
    dash["A6"].alignment = Alignment(horizontal="center")
    dash["A6"].border = THIN
    dash["A7"] = "=IF(COUNTA('Progress Tracker'!F:F)<=1,0,AVERAGE('Progress Tracker'!G:G))"
    dash["A7"].number_format = "0%"
    dash["A7"].font = Font(name="Calibri", size=28, bold=True, color="1F4E79")
    dash["A7"].fill = FILL_OVERALL
    dash["A7"].alignment = Alignment(horizontal="center", vertical="center")
    dash["A7"].border = THIN
    dash.row_dimensions[7].height = 42

    def kpi(col: str, label: str, formula: str, fill: PatternFill) -> None:
        dash[f"{col}6"] = label
        dash[f"{col}6"].font = Font(bold=True)
        dash[f"{col}6"].fill = fill
        dash[f"{col}6"].alignment = Alignment(horizontal="center")
        dash[f"{col}6"].border = THIN
        dash[f"{col}7"] = formula
        dash[f"{col}7"].font = Font(name="Calibri", size=22, bold=True)
        dash[f"{col}7"].fill = fill
        dash[f"{col}7"].alignment = Alignment(horizontal="center", vertical="center")
        dash[f"{col}7"].border = THIN

    kpi("C", "Completed (=100%)", "=COUNTIF('Progress Tracker'!F:F,\"Completed\")", FILL_DONE)
    kpi("E", "In Progress (=50%)", "=COUNTIF('Progress Tracker'!F:F,\"In Progress\")", FILL_IP)
    kpi("G", "Not Started (=0%)", "=COUNTIF('Progress Tracker'!F:F,\"Not Started\")", FILL_NS)

    dash["A9"] = "Section"
    dash["B9"] = "Tasks"
    dash["C9"] = "Completed"
    dash["D9"] = "In Progress"
    dash["E9"] = "Not Started"
    dash["F9"] = "Blocked"
    dash["G9"] = "Progress %"
    for col in range(1, 8):
        cell = dash.cell(9, col)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center")
        cell.border = THIN

    sections = list(SECTION_FILL.keys())
    for i, section in enumerate(sections):
        row = 10 + i
        dash.cell(row, 1, section).font = Font(bold=True)
        dash.cell(row, 1).fill = PatternFill("solid", fgColor=SECTION_FILL[section])
        dash.cell(row, 2, f"=COUNTIF('Progress Tracker'!A:A,A{row})")
        dash.cell(row, 3, f"=COUNTIFS('Progress Tracker'!A:A,A{row},'Progress Tracker'!F:F,\"Completed\")")
        dash.cell(row, 4, f"=COUNTIFS('Progress Tracker'!A:A,A{row},'Progress Tracker'!F:F,\"In Progress\")")
        dash.cell(row, 5, f"=COUNTIFS('Progress Tracker'!A:A,A{row},'Progress Tracker'!F:F,\"Not Started\")")
        dash.cell(row, 6, f"=COUNTIFS('Progress Tracker'!A:A,A{row},'Progress Tracker'!F:F,\"Blocked\")")
        dash.cell(row, 7, f"=IF(B{row}=0,0,(C{row}+0.5*D{row})/B{row})")
        dash.cell(row, 7).number_format = "0%"
        for col in range(1, 8):
            cell = dash.cell(row, col)
            cell.border = THIN
            if col > 1:
                cell.fill = PatternFill("solid", fgColor=SECTION_FILL[section])
                cell.alignment = Alignment(horizontal="center")

    sec_end = 9 + len(sections)
    # Dev-only % = average of progress for sections 1-6 (rows 10-15)
    dash.cell(sec_end + 2, 1, "Development progress (sections 1–6 only)").font = Font(
        bold=True, color="1F4E79"
    )
    dash.cell(sec_end + 2, 2, f"=IF(SUM(B10:B15)=0,0,SUMPRODUCT(B10:B15,G10:G15)/SUM(B10:B15))")
    dash.cell(sec_end + 2, 2).number_format = "0%"
    dash.cell(sec_end + 2, 2).font = Font(size=16, bold=True, color="1F4E79")
    dash.cell(sec_end + 2, 2).fill = FILL_OVERALL

    dash.conditional_formatting.add(
        f"G10:G{sec_end}",
        ColorScaleRule(
            start_type="num",
            start_value=0,
            start_color="F8696B",
            mid_type="num",
            mid_value=0.5,
            mid_color="FFEB84",
            end_type="num",
            end_value=1,
            end_color="63BE7B",
        ),
    )

    dash.column_dimensions["A"].width = 38
    for col in ("B", "C", "D", "E", "F", "G"):
        dash.column_dimensions[col].width = 14

    # ========== Tentative Schedule ==========
    sched = wb.create_sheet("Tentative Schedule", 1)
    sched["A1"] = "Tentative Schedule — Frontend development (to end of August 2026)"
    sched["A1"].font = TITLE_FONT
    sched.merge_cells("A1:F1")

    sched["A2"] = (
        f"Started {PROJECT_START.isoformat()}. "
        f"August commitment = DEVELOPMENT only (through {DEV_END.isoformat()}). "
        "Backend integration dates TBD. Testing & documentation after development."
    )
    sched["A2"].font = SUB_FONT
    sched.merge_cells("A2:F2")

    sched_headers = [
        "Phase",
        "Start Date",
        "End Date",
        "Days (weekdays)",
        "Focus",
        "Weekly Date",
    ]
    for col, h in enumerate(sched_headers, 1):
        cell = sched.cell(4, col, h)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", wrap_text=True)
        cell.border = THIN

    phase_fills = ["FCE4D6", "DDEBF7", "BDD7EE", "E2D5F1", "FFF2CC"]
    for i, (name, start, end, focus) in enumerate(PHASES):
        row = 5 + i
        fill = PatternFill("solid", fgColor=phase_fills[i % len(phase_fills)])
        sched.cell(row, 1, name).fill = fill
        c_s = sched.cell(row, 2, start)
        c_s.number_format = "YYYY-MM-DD"
        c_s.fill = fill
        c_e = sched.cell(row, 3, end)
        c_e.number_format = "YYYY-MM-DD"
        c_e.fill = fill
        c_d = sched.cell(row, 4, f"=NETWORKDAYS(B{row},C{row})")
        c_d.fill = fill
        c_d.alignment = Alignment(horizontal="center")
        sched.cell(row, 5, focus).fill = fill
        c_w = sched.cell(row, 6, f"=B{row}+MOD(5-WEEKDAY(B{row},2),7)")
        c_w.number_format = "YYYY-MM-DD"
        c_w.fill = fill
        for col in range(1, 7):
            sched.cell(row, col).border = THIN

    flex_row = 5 + len(PHASES) + 2
    sched.cell(flex_row, 1, "After / alongside development (no fixed end dates yet)").font = (
        SECTION_LABEL
    )
    for col, h in enumerate(["Item", "Notes"], 1):
        cell = sched.cell(flex_row + 1, col, h)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.border = THIN

    flex_fills = ["F4CCCC", "C6EFCE", "D9EAD3"]
    for i, (name, note) in enumerate(FLEX_PHASES):
        row = flex_row + 2 + i
        fill = PatternFill("solid", fgColor=flex_fills[i])
        sched.cell(row, 1, name).fill = fill
        sched.cell(row, 1).border = THIN
        sched.cell(row, 2, note).fill = fill
        sched.cell(row, 2).border = THIN

    m_row = flex_row + 2 + len(FLEX_PHASES) + 2
    sched.cell(m_row, 1, "Key milestones (development)").font = SECTION_LABEL
    for col, h in enumerate(
        ["Milestone", "Target Date", "Weekly Date", "Related section"], 1
    ):
        cell = sched.cell(m_row + 1, col, h)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.border = THIN

    milestones = [
        ("App shell & menus ready (dev kickoff)", date(2026, 7, 22), "2. Core App Shell"),
        ("Admin screens usable (UI) — done early", date(2026, 7, 30), "5. Admin Features"),
        ("UI polish & layout cleanup underway", date(2026, 7, 30), "6. UI Polish & Cleanup"),
        ("Notifications + error pages", date(2026, 7, 31), "2. Core App Shell"),
        ("Employee + approver live API wiring started", date(2026, 8, 11), "7. Backend Integration"),
        ("Codebase review & cleanup still in progress", date(2026, 8, 13), "6. UI Polish & Cleanup"),
        ("Live auth + employee/approver APIs in progress", date(2026, 8, 13), "7. Backend Integration"),
        ("Development complete (August commitment)", date(2026, 8, 31), "Sections 1–7"),
    ]
    for i, (name, target, related) in enumerate(milestones):
        row = m_row + 2 + i
        sched.cell(row, 1, name).border = THIN
        c = sched.cell(row, 2, target)
        c.number_format = "YYYY-MM-DD"
        c.border = THIN
        w = sched.cell(row, 3, f"=B{row}+MOD(5-WEEKDAY(B{row},2),7)")
        w.number_format = "YYYY-MM-DD"
        w.border = THIN
        sched.cell(row, 4, related).border = THIN

    sched.column_dimensions["A"].width = 52
    sched.column_dimensions["B"].width = 14
    sched.column_dimensions["C"].width = 14
    sched.column_dimensions["D"].width = 15
    sched.column_dimensions["E"].width = 78
    sched.column_dimensions["F"].width = 14

    w_row = m_row + 2 + len(milestones) + 2
    sched.cell(w_row, 1, "Weekly checkpoints (Fridays) — development").font = SECTION_LABEL
    for col, h in enumerate(
        ["Week ending (Friday)", "What leaders should expect to see"], 1
    ):
        cell = sched.cell(w_row + 1, col, h)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.border = THIN

    weeks = [
        (date(2026, 7, 24), "Kickoff: layout/menus; align cookie/session & API approach with backend"),
        (date(2026, 7, 31), "Reusable UI done; employee + approver + admin screens largely complete (ahead of plan)"),
        (date(2026, 8, 7), "CSS/layout cleanup in progress; shared leave detail layout improvements"),
        (date(2026, 8, 14), "Codebase review still in progress; live auth + employee/approver APIs wired"),
        (date(2026, 8, 21), "Continue UI polish + finish remaining API wiring (team calendar, admin)"),
        (date(2026, 8, 28), "Wrap remaining polish and admin API work before Aug commitment"),
        (date(2026, 8, 31), "Target: frontend DEVELOPMENT complete (not testing/docs)"),
    ]
    for i, (friday, expect) in enumerate(weeks):
        row = w_row + 2 + i
        c = sched.cell(row, 1, friday)
        c.number_format = "YYYY-MM-DD"
        c.border = THIN
        sched.cell(row, 2, expect).border = THIN

    # ========== How to use ==========
    help_ws = wb.create_sheet("How to use")
    lines = [
        "How to use this workbook",
        "",
        "August commitment",
        "Only frontend DEVELOPMENT is committed to finish by end of August.",
        "Testing and documentation come AFTER development (start ~1 Sep; end dates TBD).",
        "Backend Integration is underway (employee + key approver). Admin APIs and remaining team screens still TBD.",
        "",
        "For leaders / managers",
        "1. Dashboard — overall % and section progress (also see Development progress for sections 1–6).",
        "2. Tentative Schedule — development phases through August; backend/testing/docs called out as TBD/after.",
        "3. Progress Tracker — update Status here.",
        "",
        "For the development team",
        "1. Change Status on Progress Tracker (dropdown).",
        "2. For Backend Integration / Testing / Documentation: fill Start and End dates when known.",
        "3. Keyword for Cursor: Update the leader tracker from the code",
        "",
        "Workdays",
        "Days (weekdays) uses NETWORKDAYS when both Start and End are filled (Mon–Fri only).",
        "",
        "Authentication",
        "No login page. User identity via portal cookies/session with the backend partner.",
        "",
        "Status meanings",
        "Completed / In Progress / Not Started / Blocked",
        "Scoring: Completed = 100%, In Progress = 50%, else 0%.",
        "",
        "Related files",
        "docs/FRONTEND.md",
    ]
    for i, line in enumerate(lines, 1):
        cell = help_ws.cell(i, 1, line)
        if i == 1:
            cell.font = TITLE_FONT
        elif line in (
            "August commitment",
            "For leaders / managers",
            "For the development team",
            "Workdays",
            "Authentication",
            "Status meanings",
            "Related files",
        ):
            cell.font = Font(name="Calibri", size=12, bold=True, color="1F4E79")
        else:
            cell.font = Font(name="Calibri", size=11)
    help_ws.column_dimensions["A"].width = 100

    wb.save(OUT)

    completed = sum(1 for t in TASKS if t[4] == "Completed")
    in_prog = sum(1 for t in TASKS if t[4] == "In Progress")
    not_started = sum(1 for t in TASKS if t[4] == "Not Started")
    overall = (completed + 0.5 * in_prog) / len(TASKS)
    print(f"Wrote {OUT}")
    print(
        f"Tasks={len(TASKS)} Completed={completed} InProgress={in_prog} "
        f"NotStarted={not_started} Overall~={overall:.0%}"
    )


if __name__ == "__main__":
    main()
