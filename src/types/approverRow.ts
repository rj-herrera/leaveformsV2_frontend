/** Presentation row for the Approvers / Approval Details table. */
export type ApproverRowStatus = 'approved' | 'no_action' | 'rejected'

export type ApproverRow = {
  id: string
  name: string
  status: ApproverRowStatus
  actionDate: string | null
  remarks: string | null
  role: 'approver' | 'admin'
}
