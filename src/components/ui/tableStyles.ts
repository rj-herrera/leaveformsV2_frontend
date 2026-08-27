/**
 * Shared styles for Action-column controls in data tables
 * (Review / View / Adjust / Send Reminder, etc.).
 *
 * Equivalent to: <Button variant="secondary" size="sm" />
 * Keep this constant for use on <Link> elements and other non-button elements
 * that need the same visual style.
 */
export const TABLE_ACTION_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-text-black transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:transition-none disabled:hover:bg-surface'

/** Standard tbody row divider — matches thead / section borders. */
export const TABLE_BODY_ROW_BORDER_CLASS =
  'border-b border-border last:border-b-0'

/** Leave-detail info fields: equal 2-column stacked label-over-value grid. */
export const INFO_FIELD_GRID_CLASS =
  'grid min-w-0 grid-cols-2 gap-x-6 gap-y-3'

/**
 * Shared search field chrome for table filter bars (left icon inset via pl-9).
 * Append height/disabled modifiers when a page needs a non-default size.
 */
export const TABLE_SEARCH_INPUT_BASE_CLASS =
  'w-full rounded-md border border-border bg-surface pr-3 pl-9 text-small text-text-black outline-none placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20'

/** Default table search input — fixed control height matching FilterSelect sm. */
export const TABLE_SEARCH_INPUT_CLASS = `h-[2.125rem] ${TABLE_SEARCH_INPUT_BASE_CLASS}`

/** Numeric standard content table row height (`h-[50px]`). */
export const TABLE_ROW_HEIGHT = 50

/** Standard content table row height class (`h-[50px]`). */
export const TABLE_ROW_HEIGHT_CLASS = 'h-[50px]'

/** Numeric taller list-row height for Approvals and similar tables. */
export const APPROVALS_TABLE_ROW_HEIGHT = 56

/** CSS class matching `APPROVALS_TABLE_ROW_HEIGHT`. */
export const APPROVALS_TABLE_ROW_HEIGHT_CLASS = 'h-[56px]'

/** Minimum approvals row height; grows when cell content wraps to multiple lines. */
export const APPROVALS_TABLE_ROW_MIN_HEIGHT_CLASS = 'min-h-[56px]'

/** Standard tbody cell padding — matches thead `px-5 py-3`. */
export const TABLE_BODY_CELL_CLASS = 'px-5 py-3'
