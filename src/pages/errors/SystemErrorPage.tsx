import { TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function SystemErrorPage() {
  const navigate = useNavigate()

  return (
    <ErrorPage
      code="500"
      title="Something went wrong"
      description="An unexpected system error occurred. Please try again. If the problem continues, contact the system administrator."
      icon={<TriangleAlert strokeWidth={1.75} />}
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
