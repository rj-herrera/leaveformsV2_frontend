import { ApiError } from '../api/axios-client'

/** Field-mapped leave form errors from Laravel `errors` / top-level `message`. */
export type LeaveFormApiErrors = {
  startDate: string | null
  endDate: string | null
  dayType: string | null
  reason: string | null
  attachment: string | null
  assignmentType: string | null
  qualifyingEvent: string | null
  /**
   * Shared message for the Start/End pair (overlap, range, working-day, etc.).
   * Prefer showing this once under the date fields.
   */
  dates: string | null
  /** Unmapped / generic failure — form-level banner. */
  form: string | null
}

const EMPTY: LeaveFormApiErrors = {
  startDate: null,
  endDate: null,
  dayType: null,
  reason: null,
  attachment: null,
  assignmentType: null,
  qualifyingEvent: null,
  dates: null,
  form: null,
}

const KNOWN_KEYS = new Set([
  'start_date',
  'end_date',
  'day_type',
  'leave_reason',
  'leave_attachment',
  'assignment_type',
  'qualifying_event',
  'emp_id',
  'code',
])

function isAttachmentErrorKey(key: string): boolean {
  return (
    key === 'leave_attachment' ||
    key.startsWith('leave_attachment.') ||
    key === 'med_cert' ||
    key.startsWith('med_cert.')
  )
}

function firstAttachmentMessage(
  errors: Record<string, string[]>,
): string | null {
  const direct =
    firstFieldMessage(errors, 'leave_attachment') ??
    firstFieldMessage(errors, 'med_cert')
  if (direct) return direct

  for (const [key, msgs] of Object.entries(errors)) {
    if (!isAttachmentErrorKey(key)) continue
    const first = msgs?.[0]
    if (typeof first === 'string' && first.trim()) return first.trim()
  }
  return null
}

function firstFieldMessage(
  errors: Record<string, string[]>,
  key: string,
): string | null {
  const first = errors[key]?.[0]
  return typeof first === 'string' && first.trim().length > 0
    ? first.trim()
    : null
}

function looksDateRelated(message: string): boolean {
  return /overlap|conflict|date|holiday|working.?day|start|end|range/i.test(
    message,
  )
}

/**
 * Map a leave create/update failure onto form fields.
 * Date-related messages land in `dates` (show under the date pickers).
 */
export function parseLeaveFormApiError(
  error: unknown,
  fallback = 'Unable to submit leave request. Please try again.',
): LeaveFormApiErrors {
  if (!(error instanceof ApiError)) {
    return { ...EMPTY, form: fallback }
  }

  const body = error.body
  if (body && typeof body === 'object' && 'errors' in body) {
    const raw = (body as { errors: unknown }).errors
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const errors = raw as Record<string, string[]>
      const startDate = firstFieldMessage(errors, 'start_date')
      const endDate = firstFieldMessage(errors, 'end_date')
      const dayType = firstFieldMessage(errors, 'day_type')
      const reason = firstFieldMessage(errors, 'leave_reason')
      const attachment = firstAttachmentMessage(errors)
      const assignmentType = firstFieldMessage(errors, 'assignment_type')
      const qualifyingEvent = firstFieldMessage(errors, 'qualifying_event')
      const empId = firstFieldMessage(errors, 'emp_id')
      const code = firstFieldMessage(errors, 'code')

      const unmapped: string[] = []
      if (empId) unmapped.push(empId)
      if (code) unmapped.push(code)
      for (const [key, msgs] of Object.entries(errors)) {
        if (KNOWN_KEYS.has(key) || isAttachmentErrorKey(key)) continue
        for (const msg of msgs ?? []) {
          if (typeof msg === 'string' && msg.trim()) unmapped.push(msg.trim())
        }
      }

      const dates = startDate ?? endDate
      const form = unmapped[0] ?? null

      if (
        dates ||
        dayType ||
        reason ||
        attachment ||
        assignmentType ||
        qualifyingEvent ||
        form
      ) {
        return {
          startDate,
          endDate,
          dayType,
          reason,
          attachment,
          assignmentType,
          qualifyingEvent,
          dates,
          form,
        }
      }
    }
  }

  const message =
    typeof error.message === 'string' && error.message.trim().length > 0
      ? error.message.trim()
      : fallback

  if (looksDateRelated(message)) {
    return { ...EMPTY, dates: message }
  }

  return { ...EMPTY, form: message }
}

export function clearLeaveFormApiErrors(): LeaveFormApiErrors {
  return { ...EMPTY }
}
