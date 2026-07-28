import { matchPath, NavLink, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '../auth/AuthContext'
import { NAV_SECTIONS, type NavItem } from '../nav/navConfig'

function canAccessSection(
  requires: 'employee' | 'approver' | 'admin',
  roles: { employee: true; approver: boolean; admin: boolean },
) {
  if (requires === 'employee') return roles.employee
  if (requires === 'approver') return roles.approver
  return roles.admin
}

function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (matchPath({ path: item.to, end: true }, pathname)) return true

  return (item.matchPaths ?? []).some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) != null,
  )
}

export function Sidebar() {
  const { user, mockPersona, setMockPersona } = useAuth()
  const { pathname } = useLocation()

  const visibleSections = NAV_SECTIONS.filter((section) =>
    canAccessSection(section.requires, user.roles),
  )

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col border-r border-white/15 bg-primary">
      <div className="shrink-0 border-b border-white/15 px-5 py-3.5">
        <p className="text-h2 tracking-[0.125rem] text-white uppercase">
          Leave Forms
        </p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.id} className="mb-5">
            <p className="text-header mb-2 px-2 tracking-[0.125rem] text-white/70 uppercase">
              {section.title}
            </p>
            <ul className="flex flex-col gap-1.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isNavItemActive(pathname, item)
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end
                      className={() =>
                        [
                          'flex items-center gap-2.5 rounded-md px-3 py-2 text-body transition-colors',
                          active
                            ? 'bg-white font-semibold text-primary'
                            : 'text-white/90 hover:bg-white/25',
                        ].join(' ')
                      }
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon
                        className="size-4 shrink-0"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* TODO(REMOVE): Dev-only role preview — delete this block when real session roles exist */}
      <div className="shrink-0 border-t border-white/15 px-3 py-4">
        <p className="text-header mb-2 px-2 tracking-[0.125rem] text-white/70 uppercase">
          Dev only
        </p>
        <label className="flex flex-col gap-1.5 px-2 text-small text-white/70">
          <span>Preview role</span>
          <select
            value={mockPersona}
            onChange={(e) => setMockPersona(e.target.value as UserRole)}
            className="w-full rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-body text-white"
            aria-label="Preview role"
          >
            <option value="employee" className="text-text-black">
              Employee
            </option>
            <option value="approver" className="text-text-black">
              Approver
            </option>
            <option value="admin" className="text-text-black">
              Admin
            </option>
          </select>
        </label>
      </div>
    </aside>
  )
}
