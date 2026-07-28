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
}

export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  className = '',
}: FilterSelectProps<T>) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="sr-only">{label}</span>
      <div className={`relative ${fieldShellClassName}`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={label}
          className="box-border w-full min-w-[10.5rem] appearance-none rounded-md border border-border bg-surface py-1.5 pr-9 pl-3 text-body leading-normal text-text-black outline-none transition-[border-color,box-shadow] hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
