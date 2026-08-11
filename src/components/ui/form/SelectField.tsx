import { ChevronDown } from 'lucide-react'
import {
  fieldErrorMessageClassName,
  fieldLabelClassName,
  fieldLabelErrorClassName,
  fieldShellClassName,
  resolveFieldControlClassName,
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
  placeholder?: string
  readOnly?: boolean
  disabled?: boolean
  /** Validation message — red outline + message below when set. */
  error?: string | null
  name?: string
  id?: string
  className?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  readOnly = false,
  disabled = false,
  error = null,
  name,
  id,
  className = '',
}: SelectFieldProps) {
  const selectId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()
  const isDisabled = disabled || readOnly
  const invalid = Boolean(error) && !isDisabled
  const errorId = `${selectId}-error`

  const controlClass = resolveFieldControlClassName({
    readOnly,
    disabled,
    invalid,
  })

  return (
    <div className={`min-w-0 ${className}`}>
      <label
        htmlFor={selectId}
        className={invalid ? fieldLabelErrorClassName : fieldLabelClassName}
      >
        {label}
      </label>
      <div className={`relative ${fieldShellClassName}`}>
        <select
          id={selectId}
          name={name}
          value={value}
          disabled={isDisabled}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none pr-9 ${controlClass}`}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 ${
            invalid ? 'text-status-rejected' : 'text-text-gray'
          }`}
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p id={errorId} className={fieldErrorMessageClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
