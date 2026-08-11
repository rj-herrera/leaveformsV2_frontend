import { useState } from 'react'

export type LeaveDecisionKind = 'approve' | 'reject'

export function useLeaveDecisionModals({
  onApprove,
  onReject,
  onSuccessClose,
}: {
  onApprove?: () => void
  onReject?: (reason: string) => void
  onSuccessClose: () => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [successKind, setSuccessKind] = useState<LeaveDecisionKind>('approve')

  function handleRejectConfirm(reason: string) {
    onReject?.(reason)
    setRejectOpen(false)
    setSuccessKind('reject')
    setSuccessOpen(true)
  }

  function handleApproveConfirm(_reason: string) {
    void _reason
    onApprove?.()
    setApproveOpen(false)
    setSuccessKind('approve')
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    onSuccessClose()
  }

  return {
    rejectOpen,
    approveOpen,
    successOpen,
    successKind,
    openReject: () => setRejectOpen(true),
    openApprove: () => setApproveOpen(true),
    closeReject: () => setRejectOpen(false),
    closeApprove: () => setApproveOpen(false),
    handleRejectConfirm,
    handleApproveConfirm,
    handleSuccessClose,
  }
}
