import { ChevronDown } from 'lucide-react'
import {
  fieldControlClassName,
  fieldControlDisabledClassName,
  fieldControlReadOnlyClassName,
  fieldLabelClassName,
  fieldShellClassName,
} from './fieldStyles'

export type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  readOnly?: boolean
  disabled?: boolean
  name?: string
  id?: string
  className?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  readOnly = false,
  disabled = false,
  name,
  id,
  className = '',
}: SelectFieldProps) {
  const selectId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()
  const isDisabled = disabled || readOnly

  const controlClass = readOnly
    ? fieldControlReadOnlyClassName
    : disabled
      ? fieldControlDisabledClassName
      : fieldControlClassName

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={selectId} className={fieldLabelClassName}>
        {label}
      </label>
      <div className={`relative ${fieldShellClassName}`}>
        <select
          id={selectId}
          name={name}
          value={value}
          disabled={isDisabled}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none pr-9 ${controlClass}`}
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
    </div>
  )
}
