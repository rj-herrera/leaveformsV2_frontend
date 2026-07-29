/** Room for outer focus rings so scroll/grid parents do not clip left/right edges */
export const fieldShellClassName = 'min-w-0 overflow-visible p-0.5 -m-0.5'

/** Shared focus/border styles for form controls (outer primary ring) */
export const fieldControlClassName =
  'box-border w-full rounded-md border border-border bg-surface px-3 text-body leading-normal text-text-black outline-none transition-[border-color,box-shadow] placeholder:text-text-gray hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border'

export const fieldControlReadOnlyClassName =
  'box-border w-full min-h-11 cursor-default rounded-md border border-border bg-surface-muted px-3 py-2.5 text-body leading-normal text-text-black outline-none'

export const fieldControlDisabledClassName =
  'box-border w-full min-h-11 cursor-not-allowed rounded-md border border-border bg-surface-muted px-3 py-2.5 text-body leading-normal text-text-black opacity-60 outline-none'

export const fieldLabelClassName =
  'mb-1.5 block text-small font-semibold text-text-black'
