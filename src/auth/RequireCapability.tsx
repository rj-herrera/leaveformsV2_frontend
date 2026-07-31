import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type UserRole } from './AuthContext'

/** Blocks authenticated users who lack the required role (e.g. team/admin deep links). */
export function RequireCapability({
  capability,
  redirectTo = '/dashboard',
}: {
  capability: UserRole
  redirectTo?: string
}) {
  const { user } = useAuth()

  if (!user.roles[capability]) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
