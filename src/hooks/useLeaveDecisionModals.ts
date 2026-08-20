import { useState } from 'react'

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

  function handleRejectConfirm(reason: string) {
    onReject?.(reason)
    setRejectOpen(false)
    onSuccessClose()
  }

  function handleApproveConfirm(_reason: string) {
    void _reason
    onApprove?.()
    setApproveOpen(false)
    onSuccessClose()
  }

  return {
    rejectOpen,
    approveOpen,
    openReject: () => setRejectOpen(true),
    openApprove: () => setApproveOpen(true),
    closeReject: () => setRejectOpen(false),
    closeApprove: () => setApproveOpen(false),
    handleRejectConfirm,
    handleApproveConfirm,
  }
}
