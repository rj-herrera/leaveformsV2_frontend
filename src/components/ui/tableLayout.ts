/**
 * Pattern A — content-sized viewport tables + pagination.
 *
 * Available height caps max rows per page; the table card hugs its rows
 * (do not use flex-1 / h-full on the table area or section).
 *
 * Structure:
 *   PAGE_ROOT
 *     shrink-0 chrome (title, tabs, filters, banners, …)
 *     TABLE_AVAILABLE_SLOT  (flex-1 — measures capacity only)
 *       TABLE_CONTENT_SECTION (max-h-full, no flex-1)
 *         section header (shrink-0)
 *         TABLE_CONTENT_AREA
 *         pagination wrapper (shrink-0)
 */

/** Full-height page column that must not scroll because of the table. */
export const TABLE_PAGE_ROOT =
  'flex h-full min-h-0 flex-col overflow-hidden'

/** Remaining viewport under shrink-0 chrome; used for page-size measurement. */
export const TABLE_AVAILABLE_SLOT =
  'flex min-h-0 flex-1 flex-col overflow-hidden'

/**
 * Table card: capped by the slot, sized to content.
 * Combine with border / bg classes as needed (e.g. `rounded-lg border …`).
 */
export const TABLE_CONTENT_SECTION =
  'flex max-h-full min-h-0 flex-col overflow-hidden'

/** Table wrapper: horizontal scroll only — never overflow-y / flex-1. */
export const TABLE_CONTENT_AREA = 'overflow-x-auto overflow-y-hidden'

/** Pagination / skeleton footer wrapper. */
export const TABLE_PAGINATION_WRAP = 'shrink-0'

/**
 * Invisible pagination-height placeholder while the real Pagination is hidden
 * (e.g. data skeleton). Keep height reserved for page-size measurement.
 */
export const TABLE_PAGINATION_PLACEHOLDER =
  'flex shrink-0 flex-col gap-3 border-t border-border px-5 py-2 sm:flex-row sm:items-center sm:justify-between'
