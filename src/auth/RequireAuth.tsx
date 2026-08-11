import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Redirects unauthenticated visitors to the employee ID entry page. */
export function RequireAuth() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="text-body text-text-gray">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return <Outlet />
}
