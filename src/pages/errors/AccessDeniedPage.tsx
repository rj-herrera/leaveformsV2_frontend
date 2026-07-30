import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function AccessDeniedPage() {
  const navigate = useNavigate()

  return (
    <ErrorPage
      code="403"
      title="You do not have access to this page"
      description="Your current role does not have permission to view this page or perform this action."
      icon={<ShieldOff strokeWidth={1.75} />}
      primaryAction={{
        label: 'Go Back',
        onClick: () => navigate(-1),
      }}
      secondaryAction={{
        label: 'Return to Dashboard',
        onClick: () => navigate('/dashboard'),
      }}
    />
  )
}
