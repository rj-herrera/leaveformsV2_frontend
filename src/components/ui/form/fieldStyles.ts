/** Room for outer focus rings so scroll/grid parents do not clip left/right edges */
export const fieldShellClassName = 'min-w-0 overflow-visible p-0.5 -m-0.5'

/** Shared focus/border styles for form controls (outer primary ring) */
export const fieldControlClassName =
  'box-border w-full min-h-11 rounded-md border border-border bg-surface px-3 py-2.5 text-body leading-normal text-text-black outline-none transition-[border-color,box-shadow] placeholder:text-text-gray hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border'

export const fieldControlErrorClassName =
  'box-border w-full min-h-11 rounded-md border-2 border-status-rejected bg-status-rejected/5 px-3 py-2.5 text-body leading-normal text-text-black outline-none transition-[border-color,box-shadow] placeholder:text-text-gray hover:border-status-rejected focus:border-status-rejected focus:ring-2 focus:ring-status-rejected/30'

export const fieldControlReadOnlyClassName =
  'box-border w-full min-h-11 cursor-default rounded-md border border-border bg-surface-muted px-3 py-2.5 text-body leading-normal text-text-black outline-none'

export const fieldControlDisabledClassName =
  'box-border w-full min-h-11 cursor-not-allowed rounded-md border border-border bg-surface-muted px-3 py-2.5 text-body leading-normal text-text-black opacity-60 outline-none'

export const fieldLabelClassName =
  'mb-1.5 block text-small font-semibold text-text-black'

export const fieldLabelErrorClassName =
  'mb-1.5 block text-small font-semibold text-status-rejected'

export const fieldErrorMessageClassName =
  'mt-1.5 text-small font-semibold text-status-rejected'

/** Pick the control class for editable fields (error wins over default). */
export function resolveFieldControlClassName(options: {
  readOnly?: boolean
  disabled?: boolean
  invalid?: boolean
}): string {
  if (options.readOnly) return fieldControlReadOnlyClassName
  if (options.disabled) return fieldControlDisabledClassName
  if (options.invalid) return fieldControlErrorClassName
  return fieldControlClassName
}
