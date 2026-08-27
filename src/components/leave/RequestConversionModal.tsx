import { useEffect, useState } from 'react'
import {
  EMERGENCY_LEAVE_THEME,
  SICK_LEAVE_THEME,
  type LeaveTypeTheme,
} from '../../constants/leaveTypeTheme'
import { Modal } from '../ui/Modal'

export type ConversionLeaveType = 'sick' | 'emergency'

const OPTIONS: Array<{
  value: ConversionLeaveType
  theme: LeaveTypeTheme
  description: string
  /** Soft fill + icon tint using the leave type’s assigned CSS color. */
  iconToneClass: string
}> = [
  {
    value: 'sick',
    theme: SICK_LEAVE_THEME,
    description:
      'For illness or medical conditions that prevent you from working.',
    iconToneClass: 'bg-leave-sick/15 text-leave-sick',
  },
  {
    value: 'emergency',
    theme: EMERGENCY_LEAVE_THEME,
    description:
      'For urgent or unexpected situations that require immediate attention.',
    iconToneClass: 'bg-leave-emergency/20 text-leave-emergency',
  },
]

type RequestConversionModalProps = {
  open: boolean
  onClose: () => void
  onContinue: (type: ConversionLeaveType) => void
}

export function RequestConversionModal({
  open,
  onClose,
  onContinue,
}: RequestConversionModalProps) {
  const [selected, setSelected] = useState<ConversionLeaveType>('sick')

  useEffect(() => {
    if (open) setSelected('sick')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert Vacation Leave"
      maxWidthClass="max-w-lg"
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
              onContinue(selected)
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
        Select the leave type you want to convert this request to.
      </p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => {
          const active = selected === option.value
          const Icon = option.theme.icon
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-3 transition-colors ${
                active
                  ? 'border-primary border-2'
                  : 'border-border hover:bg-surface-muted/50'
              }`}
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-md ${option.iconToneClass}`}
              >
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-text-black">
                  {option.theme.label}
                </span>
                <span className="mt-0.5 block text-small text-text-gray">
                  {option.description}
                </span>
              </span>
              <input
                type="radio"
                name="conversion-leave-type"
                value={option.value}
                checked={active}
                onChange={() => setSelected(option.value)}
                className="size-4 shrink-0 accent-primary"
              />
            </label>
          )
        })}
      </div>
    </Modal>
  )
}
