import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { homePath } from '../utils/homePath'

/** President does not use My Leave — send them to Team Management. */
export function RedirectPresidentFromEmployee() {
  const { user } = useAuth()

  if (user.isPresident) {
    return <Navigate to={homePath(true)} replace />
  }

  return <Outlet />
}
