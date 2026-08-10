import { Button } from '../ui/Button'
import { parseAttachmentFileNames } from '../../utils/attachments'

export function LeaveAttachmentRow({
  value,
  onView,
  alwaysShow = false,
}: {
  value: string | null | undefined
  onView: () => void
  /** Sick Leave Conversion requires supporting attachments — always show the row. */
  alwaysShow?: boolean
}) {
  const fileCount = parseAttachmentFileNames(value).length
  if (fileCount === 0 && !alwaysShow) return null

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-text-gray">Attachment</dt>
      <dd>
        {fileCount > 0 ? (
          <Button type="button" size="sm" onClick={onView}>
            View
          </Button>
        ) : (
          <span className="text-body text-text-gray">—</span>
        )}
      </dd>
    </div>
  )
}
