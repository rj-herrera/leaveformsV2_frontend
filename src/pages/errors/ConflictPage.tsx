import { RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function ConflictPage() {
  const navigate = useNavigate()

  return (
    <ErrorPage
      code="409"
      title="This request has already been updated"
      description="Another user may have approved, rejected, cancelled, or modified this leave request while you were viewing it."
      icon={<RefreshCw strokeWidth={1.75} />}
      primaryAction={{
        label: 'Refresh Request',
        onClick: () => window.location.reload(),
      }}
      secondaryAction={{
        label: 'Return to Leave Requests',
        onClick: () => navigate('/dashboard'),
      }}
    />
  )
}
