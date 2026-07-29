import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30',
  secondary:
    'border border-border bg-surface text-text-black hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/20',
  danger:
    'bg-status-rejected text-white hover:bg-status-rejected/90 focus:outline-none focus:ring-2 focus:ring-status-rejected/30',
  ghost:
    'bg-transparent text-text-black hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/20',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-[2.125rem] px-3 text-small',
  md: 'h-[2.375rem] px-4 text-body',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'secondary',
      size = 'md',
      type = 'button',
      className = '',
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={`${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
