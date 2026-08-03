import { ServerOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function ServiceUnavailablePage() {
  const navigate = useNavigate()

  return (
    <ErrorPage
      code="503"
      title="The service is temporarily unavailable"
      description="The system or one of its supporting services is currently unavailable. Please try again later."
      icon={<ServerOff strokeWidth={1.75} />}
      primaryAction={{
        label: 'Try Again',
        onClick: () => window.location.reload(),
      }}
      secondaryAction={{
        label: 'Return to Dashboard',
        onClick: () => navigate('/dashboard'),
      }}
    />
  )
}
