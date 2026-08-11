import { Check, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { ConfirmReasonModal } from '../ui/ConfirmReasonModal'
import { SuccessDialog } from '../ui/SuccessDialog'
import { useLeaveDecisionModals } from '../../hooks/useLeaveDecisionModals'

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

type SuccessCopy = {
  approveTitle: string
  rejectTitle: string
  approveMessage: string
  rejectMessage: string
  confirmLabel?: string
}

export function LeaveDecisionBar({
  visible,
  reject,
  approve,
  success,
  onApprove,
  onReject,
  onSuccessClose,
}: {
  visible: boolean
  reject: RejectModalCopy
  approve: ApproveModalCopy
  success: SuccessCopy
  onApprove?: () => void
  onReject?: (reason: string) => void
  onSuccessClose: () => void
}) {
  const decision = useLeaveDecisionModals({
    onApprove,
    onReject,
    onSuccessClose,
  })

  return (
    <>
      {visible ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" onClick={decision.openReject}>
            <X className="size-4 text-status-rejected" aria-hidden="true" />
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
        onConfirm={decision.handleRejectConfirm}
        title={reject.title}
        description={reject.description}
        reasonLabel={reject.reasonLabel}
        reasonPlaceholder={reject.reasonPlaceholder}
        confirmLabel={reject.confirmLabel}
        cancelLabel={reject.cancelLabel}
        confirmVariant="danger"
      />

      <ConfirmReasonModal
        open={decision.approveOpen}
        onClose={decision.closeApprove}
        onConfirm={decision.handleApproveConfirm}
        requireReason={false}
        title={approve.title}
        description={approve.description}
        confirmLabel={approve.confirmLabel}
        cancelLabel={approve.cancelLabel}
        confirmVariant="primary"
      />

      <SuccessDialog
        open={decision.successOpen}
        onClose={decision.handleSuccessClose}
        title={
          decision.successKind === 'approve'
            ? success.approveTitle
            : success.rejectTitle
        }
        message={
          decision.successKind === 'approve'
            ? success.approveMessage
            : success.rejectMessage
        }
        confirmLabel={success.confirmLabel}
      />
    </>
  )
}
