import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'

export type DistributionType =
  | 'annual'
  | 'newly-regularized'
  | 'parental'
  | 'contractual'

const OPTIONS: Array<{
  value: DistributionType
  title: string
  description: string
}> = [
  {
    value: 'annual',
    title: 'Annual Leave Credit Distribution',
    description: 'Grant yearly VL/SL credits to eligible regular employees.',
  },
  {
    value: 'newly-regularized',
    title: 'Newly Regularized Employees',
    description: 'Prorated VL/SL plus EL/PTB for newly regularized staff.',
  },
  {
    value: 'parental',
    title: 'Maternity / Paternity Leave',
    description: 'Apply ML/PL entitlements for employees with filed requests.',
  },
  {
    value: 'contractual',
    title: 'Contractual Employees',
    description: 'Manually assign leave credits to contractual employees.',
  },
]

type SelectDistributionModalProps = {
  open: boolean
  onClose: () => void
  /** Stub: landing only — wizards wire this in a later todo. */
  onContinue?: (type: DistributionType) => void
}

export function SelectDistributionModal({
  open,
  onClose,
  onContinue,
}: SelectDistributionModalProps) {
  const [selected, setSelected] = useState<DistributionType>('annual')

  useEffect(() => {
    if (open) setSelected('annual')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Leave Credit Distribution"
      maxWidthClass="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-surface px-4 py-2.5 text-body font-medium text-text-black transition-colors hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onContinue?.(selected)
              onClose()
            }}
            className="rounded-md bg-primary px-4 py-2.5 text-body font-medium text-white transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        </div>
      }
    >
      <p className="mb-4 text-body text-text-gray">
        Choose how leave credits should be distributed. Wizard steps will open
        from here in a later update.
      </p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => {
          const active = selected === option.value
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-md border px-4 py-3 transition-colors ${
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-surface-muted'
              }`}
            >
              <input
                type="radio"
                name="distribution-type"
                value={option.value}
                checked={active}
                onChange={() => setSelected(option.value)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block text-body font-semibold text-text-black">
                  {option.title}
                </span>
                <span className="mt-0.5 block text-small text-text-gray">
                  {option.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </Modal>
  )
}
