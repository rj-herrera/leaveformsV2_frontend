import { fieldLabelClassName, fieldShellClassName } from './fieldStyles'

type FileFieldProps = {
  label: string
  fileName: string | null
  onChange: (file: File | null) => void
  accept?: string
  required?: boolean
  hint?: string
  error?: string | null
  name?: string
  id?: string
  className?: string
}

export function FileField({
  label,
  fileName,
  onChange,
  accept,
  required = false,
  hint,
  error,
  name,
  id,
  className = '',
}: FileFieldProps) {
  const inputId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={inputId} className={fieldLabelClassName}>
        {label}
        {required ? <span className="text-status-rejected"> *</span> : null}
      </label>
      <div className={`flex flex-wrap items-center gap-3 ${fieldShellClassName}`}>
        <label
          htmlFor={inputId}
          className="box-border inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border bg-surface px-3 py-2.5 text-body leading-normal text-text-black transition-[border-color,box-shadow] hover:border-primary/50 hover:bg-surface-muted focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        >
          Choose file
        </label>
        <input
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            onChange(file)
          }}
        />
        <span className="text-body text-text-gray">
          {fileName ?? 'No file chosen'}
        </span>
      </div>
      {hint ? (
        <p className="mt-1 text-small text-text-gray">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-small text-status-rejected" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
