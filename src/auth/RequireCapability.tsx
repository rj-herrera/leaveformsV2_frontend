import { Navigate, Outlet } from 'react-router-dom'
import { homePath } from '../utils/homePath'
import { useAuth, type UserRole } from './AuthContext'

/** Blocks authenticated users who lack the required role (e.g. team/admin deep links). */
export function RequireCapability({
  capability,
  redirectTo,
}: {
  capability: UserRole
  redirectTo?: string
}) {
  const { user } = useAuth()
  const fallback = redirectTo ?? homePath(user.isPresident)

  if (!user.roles[capability]) {
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
