/** Subpixel / border rounding slack so the last row is never clipped. */
const TABLE_FIT_SLACK = 1
const MIN_PAGE_SIZE = 3

/**
 * How many full body rows fit in the scroll container without clipping,
 * accounting for sticky thead/tfoot when present.
 */
export function computePageSizeFromHeight(
  containerHeight: number,
  rowHeight: number,
  headerHeight: number,
  footerHeight: number = 0,
): number {
  if (containerHeight <= 0 || rowHeight <= 0) return MIN_PAGE_SIZE

  const budget = containerHeight - TABLE_FIT_SLACK
  let pageSize = MIN_PAGE_SIZE

  while (
    headerHeight + footerHeight + (pageSize + 1) * rowHeight <= budget
  ) {
    pageSize += 1
  }

  return pageSize
}
