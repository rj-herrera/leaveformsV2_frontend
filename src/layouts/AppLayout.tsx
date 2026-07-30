import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { TopHeader } from '../components/TopHeader'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from '../utils/sidebarPreference'

const DESKTOP_SIDEBAR_QUERY = '(min-width: 1024px)'

export function AppLayout() {
  const isDesktop = useMediaQuery(DESKTOP_SIDEBAR_QUERY)
  const location = useLocation()
  const [desktopCollapsed, setDesktopCollapsed] = useState(
    readSidebarCollapsedPreference,
  )
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const sidebarCollapsed = isDesktop ? desktopCollapsed : false

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false)
  }, [isDesktop])

  useEffect(() => {
    if (!isDesktop) setMobileSidebarOpen(false)
  }, [location.pathname, isDesktop])

  function toggleSidebarCollapsed() {
    if (isDesktop) {
      setDesktopCollapsed((prev) => {
        const next = !prev
        writeSidebarCollapsedPreference(next)
        return next
      })
      return
    }

    setMobileSidebarOpen((prev) => !prev)
  }

  return (
    <div className="flex h-svh bg-background">
      {!isDesktop && mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ease-out lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div
        className={[
          'shrink-0 transition-[transform,box-shadow] duration-200 ease-out',
          isDesktop
            ? 'relative'
            : [
                'fixed inset-y-0 left-0 z-50',
                mobileSidebarOpen
                  ? 'translate-x-0 shadow-xl'
                  : '-translate-x-full pointer-events-none',
              ].join(' '),
        ].join(' ')}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader
          sidebarCollapsed={isDesktop ? desktopCollapsed : !mobileSidebarOpen}
          onToggleSidebar={toggleSidebarCollapsed}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
