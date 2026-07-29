import { ChevronDown } from 'lucide-react'
import { fieldShellClassName } from './form/fieldStyles'

export type FilterOption<T extends string> = {
  value: T
  label: string
}

type FilterSelectProps<T extends string> = {
  label: string
  value: T
  onChange: (value: T) => void
  options: FilterOption<T>[]
  className?: string
  /** Size the control to its option text instead of a fixed min width */
  fitContent?: boolean
}

export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  className = '',
  fitContent = false,
}: FilterSelectProps<T>) {
  const selectWidthClass = fitContent
    ? 'w-auto min-w-0'
    : 'w-full min-w-[10.5rem]'

  return (
    <label
      className={`relative block ${fitContent ? 'w-auto shrink-0' : 'min-w-0'} ${className}`}
    >
      <span className="sr-only">{label}</span>
      <div className={`relative ${fieldShellClassName}`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={label}
          className={`box-border appearance-none rounded-md border border-border bg-surface py-1.5 pr-9 pl-3 text-body leading-normal text-text-black outline-none transition-[border-color,box-shadow] hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 ${selectWidthClass}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-gray"
          aria-hidden="true"
        />
      </div>
    </label>
  )
}
