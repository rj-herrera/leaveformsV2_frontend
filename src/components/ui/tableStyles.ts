/**
 * Shared styles for Action-column controls in data tables
 * (Review / View / Adjust / Send Reminder, etc.).
 *
 * Equivalent to: <Button variant="secondary" size="sm" />
 * Keep this constant for use on <Link> elements and other non-button elements
 * that need the same visual style.
 */
export const TABLE_ACTION_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-text-black transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50'

/** Standard tbody row divider — matches thead / section borders. */
export const TABLE_BODY_ROW_BORDER_CLASS =
  'border-b border-border last:border-b-0'

/** Leave-detail info fields: ~40% / ~60% columns for longer right-side values. */
export const INFO_FIELD_GRID_CLASS =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-6 gap-y-3'
