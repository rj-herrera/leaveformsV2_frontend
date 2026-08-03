import { LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function SessionExpiredPage() {
  const navigate = useNavigate()

  return (
    <ErrorPage
      code="401"
      title="Your session has expired"
      description="For your security, your session ended because of inactivity. Please sign in again to continue."
      icon={<LogIn strokeWidth={1.75} />}
      primaryAction={{
        label: 'Log In Again',
        onClick: () => navigate('/login'),
      }}
    />
  )
}
