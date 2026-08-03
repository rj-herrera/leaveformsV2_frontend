import {
  fieldErrorMessageClassName,
  fieldLabelClassName,
  fieldLabelErrorClassName,
  fieldShellClassName,
  resolveFieldControlClassName,
} from './fieldStyles'

type TextAreaFieldProps = {
  label: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  /** Validation message — red outline + message below when set. */
  error?: string | null
  name?: string
  id?: string
  rows?: number
  className?: string
}

export function TextAreaField({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  placeholder,
  error = null,
  name,
  id,
  rows = 4,
  className = '',
}: TextAreaFieldProps) {
  const areaId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()
  const invalid = Boolean(error) && !readOnly && !disabled
  const errorId = `${areaId}-error`

  const controlClass = resolveFieldControlClassName({
    readOnly,
    disabled,
    invalid,
  })

  return (
    <div className={`min-w-0 ${className}`}>
      <label
        htmlFor={areaId}
        className={invalid ? fieldLabelErrorClassName : fieldLabelClassName}
      >
        {label}
      </label>
      <div className={fieldShellClassName}>
        <textarea
          id={areaId}
          name={name}
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(e) => onChange?.(e.target.value)}
          className={`!min-h-[4.5rem] resize-y ${controlClass}`}
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
