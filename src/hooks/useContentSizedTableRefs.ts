import { useRef } from 'react'
import {
  useContentSizedTablePageSize,
  type ContentSizedTablePageSizeOptions,
} from './useContentSizedTablePageSize'

/**
 * Creates the four Pattern A measurement refs and derives `pageSize`.
 * Attach the refs to the same layout slots as before (available slot, section
 * header, pagination wrap, table area).
 */
export function useContentSizedTableRefs(
  options?: ContentSizedTablePageSizeOptions,
) {
  const availableSlotRef = useRef<HTMLDivElement>(null)
  const sectionHeaderRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const pageSize = useContentSizedTablePageSize(
    {
      availableSlotRef,
      sectionHeaderRef,
      paginationRef,
      tableAreaRef,
    },
    options,
  )

  return {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize,
  }
}
