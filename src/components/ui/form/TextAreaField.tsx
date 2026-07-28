import {
  fieldControlClassName,
  fieldControlDisabledClassName,
  fieldControlReadOnlyClassName,
  fieldLabelClassName,
  fieldShellClassName,
} from './fieldStyles'

type TextAreaFieldProps = {
  label: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
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
  name,
  id,
  rows = 4,
  className = '',
}: TextAreaFieldProps) {
  const areaId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()

  const controlClass = readOnly
    ? fieldControlReadOnlyClassName
    : disabled
      ? fieldControlDisabledClassName
      : fieldControlClassName

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={areaId} className={fieldLabelClassName}>
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
          onChange={(e) => onChange?.(e.target.value)}
          className={`!min-h-[4.5rem] resize-y ${controlClass}`}
        />
      </div>
    </div>
  )
}
