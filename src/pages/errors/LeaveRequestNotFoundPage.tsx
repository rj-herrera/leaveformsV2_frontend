import { FileSearch } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function LeaveRequestNotFoundPage() {
  const navigate = useNavigate()

  return (
    <ErrorPage
      code="Leave request"
      title="Leave request not found"
      description="This leave request may have been deleted, cancelled, or is no longer available."
      icon={<FileSearch strokeWidth={1.75} />}
      primaryAction={{
        label: 'Return to Leave Requests',
        onClick: () => navigate('/dashboard'),
      }}
      secondaryAction={{
        label: 'Go Back',
        onClick: () => navigate(-1),
      }}
    />
  )
}
