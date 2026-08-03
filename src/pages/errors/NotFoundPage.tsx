import { FileQuestion } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <ErrorPage
      code="404"
      title="Page not found"
      description="The page you are looking for may have been moved, deleted, or the address may be incorrect."
      icon={<FileQuestion strokeWidth={1.75} />}
      primaryAction={{
        label: 'Return to Dashboard',
        onClick: () => navigate('/dashboard'),
      }}
      secondaryAction={{
        label: 'Go Back',
        onClick: () => navigate(-1),
      }}
    />
  )
}
