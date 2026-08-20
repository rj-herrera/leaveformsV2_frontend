import { Check, X } from 'lucide-react'
import {
  TOAST_LEAVE_CONVERSION_APPROVED,
  TOAST_LEAVE_CONVERSION_REJECTED,
} from '../../constants/toastMessages'
import { useLeaveDecisionModals } from '../../hooks/useLeaveDecisionModals'
import { Button } from '../ui/Button'
import { ConfirmReasonModal } from '../ui/ConfirmReasonModal'
import { useToast } from '../ui/ToastProvider'

type RejectModalCopy = {
  title: string
  description: string
  confirmLabel: string
  reasonLabel?: string
  reasonPlaceholder?: string
  cancelLabel?: string
}

type ApproveModalCopy = {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
}

export function LeaveDecisionBar({
  visible,
  reject,
  approve,
  approveSuccessMessage = TOAST_LEAVE_CONVERSION_APPROVED,
  rejectSuccessMessage = TOAST_LEAVE_CONVERSION_REJECTED,
  onApprove,
  onReject,
  onSuccessClose,
}: {
  visible: boolean
  reject: RejectModalCopy
  approve: ApproveModalCopy
  /** Defaults to VL → SL conversion validation copy. */
  approveSuccessMessage?: string
  rejectSuccessMessage?: string
  onApprove?: () => void
  onReject?: (reason: string) => void
  onSuccessClose: () => void
}) {
  const toast = useToast()
  const decision = useLeaveDecisionModals({
    onApprove,
    onReject,
    onSuccessClose,
  })

  return (
    <>
      {visible ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="dangerOutline" onClick={decision.openReject}>
            <X className="size-4" aria-hidden="true" />
            Reject
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={decision.openApprove}
          >
            <Check className="size-4 text-white" aria-hidden="true" />
            Approve
          </Button>
        </div>
      ) : null}

      <ConfirmReasonModal
        open={decision.rejectOpen}
        onClose={decision.closeReject}
        onConfirm={(reason) => {
          toast.success(rejectSuccessMessage)
          decision.handleRejectConfirm(reason)
        }}
        title={reject.title}
        description={reject.description}
        reasonLabel={reject.reasonLabel}
        reasonPlaceholder={reject.reasonPlaceholder}
        confirmLabel={reject.confirmLabel}
        cancelLabel={reject.cancelLabel}
        confirmVariant="danger"
        iconVariant="reject"
      />

      <ConfirmReasonModal
        open={decision.approveOpen}
        onClose={decision.closeApprove}
        onConfirm={() => {
          toast.success(approveSuccessMessage)
          decision.handleApproveConfirm('')
        }}
        requireReason={false}
        title={approve.title}
        description={approve.description}
        confirmLabel={approve.confirmLabel}
        cancelLabel={approve.cancelLabel}
        confirmVariant="primary"
        iconVariant="approve"
      />
    </>
  )
}
