import {
  fieldControlClassName,
  fieldControlDisabledClassName,
  fieldControlReadOnlyClassName,
  fieldLabelClassName,
  fieldShellClassName,
} from './fieldStyles'

type TextFieldProps = {
  label: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  type?: 'text' | 'email' | 'number'
  placeholder?: string
  name?: string
  id?: string
  className?: string
}

export function TextField({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  type = 'text',
  placeholder,
  name,
  id,
  className = '',
}: TextFieldProps) {
  const inputId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()

  const controlClass = readOnly
    ? fieldControlReadOnlyClassName
    : disabled
      ? fieldControlDisabledClassName
      : fieldControlClassName

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={inputId} className={fieldLabelClassName}>
        {label}
      </label>
      <div className={fieldShellClassName}>
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          className={controlClass}
        />
      </div>
    </div>
  )
}
