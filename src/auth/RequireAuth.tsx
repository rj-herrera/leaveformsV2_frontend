import { Outlet } from 'react-router-dom'
import { BootLoadingView } from '../components/ui/BootLoadingView'
import { useAuth } from './AuthContext'

/** Holds the shell until the portal cookie is confirmed. A missing cookie redirects to KDTPortalLogin. */
export function RequireAuth() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping || !isAuthenticated) {
    return <BootLoadingView />
  }

  return <Outlet />
}
