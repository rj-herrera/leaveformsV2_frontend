import { Button } from '../ui/Button'

export function LeaveAttachmentRow({
  fileCount = 0,
  onView,
  alwaysShow = false,
}: {
  fileCount?: number
  onView: () => void
  /** Sick Leave Conversion requires supporting attachments — always show the row. */
  alwaysShow?: boolean
}) {
  if (fileCount === 0 && !alwaysShow) return null

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-small text-text-gray">Attachment</dt>
      <dd>
        {fileCount > 0 ? (
          <Button type="button" size="sm" onClick={onView}>
            View{fileCount > 1 ? ` (${fileCount})` : ''}
          </Button>
        ) : (
          <span className="text-body text-text-gray">—</span>
        )}
      </dd>
    </div>
  )
}
