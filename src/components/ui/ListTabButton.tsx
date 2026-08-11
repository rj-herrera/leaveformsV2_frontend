export function ListTabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  label: string
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 pb-2.5 text-body transition-colors ${
        active
          ? 'border-primary font-medium text-primary'
          : 'border-transparent text-text-gray hover:text-text-black'
      }`}
    >
      <span>{label}</span>
      {typeof badge === 'number' ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-small font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  )
}
