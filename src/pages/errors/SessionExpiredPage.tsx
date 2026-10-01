import { LogIn } from 'lucide-react'
import { redirectToPortalLogin } from '../../api/auth'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function SessionExpiredPage() {
  return (
    <ErrorPage
      code="401"
      title="Your session has expired"
      description="For your security, your session ended because of inactivity. Please sign in again to continue."
      icon={<LogIn strokeWidth={1.75} />}
      primaryAction={{
        label: 'Log In Again',
        onClick: () => {
          void redirectToPortalLogin()
        },
      }}
    />
  )
}
