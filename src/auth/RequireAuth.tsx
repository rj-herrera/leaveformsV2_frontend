import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BootLoadingView } from '../components/ui/BootLoadingView'
import { useAuth } from './AuthContext'

/** Redirects unauthenticated visitors to the employee ID entry page. */
export function RequireAuth() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <BootLoadingView />
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return <Outlet />
}
