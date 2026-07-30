import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { TopHeader } from '../components/TopHeader'
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from '../utils/sidebarPreference'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    readSidebarCollapsedPreference,
  )

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      writeSidebarCollapsedPreference(next)
      return next
    })
  }

  return (
    <div className="flex h-svh bg-background">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapsed}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
