import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '../auth/AuthContext'
import { NAV_SECTIONS, type NavChildItem, type NavItem } from '../nav/navConfig'

function canAccessSection(
  requires: 'employee' | 'approver' | 'admin',
  roles: { employee: true; approver: boolean; admin: boolean },
) {
  if (requires === 'employee') return roles.employee
  if (requires === 'approver') return roles.approver
  return roles.admin
}

function isPathActive(
  pathname: string,
  to: string,
  matchPaths?: string[],
): boolean {
  if (matchPath({ path: to, end: true }, pathname)) return true

  return (matchPaths ?? []).some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) != null,
  )
}

function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.children?.length) {
    return item.children.some((child) =>
      isPathActive(pathname, child.to, child.matchPaths),
    )
  }
  return isPathActive(pathname, item.to, item.matchPaths)
}

function isChildActive(pathname: string, child: NavChildItem): boolean {
  return isPathActive(pathname, child.to, child.matchPaths)
}

function navLinkClass(active: boolean) {
  return [
    'flex items-center gap-2.5 rounded-md px-3 py-2 text-body transition-colors',
    active
      ? 'bg-white font-semibold text-primary'
      : 'text-white/90 hover:bg-white/25',
  ].join(' ')
}

function NavItemLink({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  const active = isNavItemActive(pathname, item)
  const Icon = item.icon
  const hasChildren = (item.children?.length ?? 0) > 0
  const [open, setOpen] = useState(active)

  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  if (!hasChildren) {
    return (
      <li>
        <NavLink
          to={item.to}
          end
          className={() => navLinkClass(active)}
          aria-current={active ? 'page' : undefined}
        >
          <Icon className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-body transition-colors',
          active
            ? 'bg-white/15 font-semibold text-white'
            : 'text-white/90 hover:bg-white/25',
        ].join(' ')}
        aria-expanded={open}
      >
        <Icon className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown
          className={[
            'size-4 shrink-0 transition-transform',
            open ? 'rotate-0' : '-rotate-90',
          ].join(' ')}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <ul className="mt-1 flex flex-col gap-1 border-l border-white/20 ml-4 pl-2">
          {item.children!.map((child) => {
            const childActive = isChildActive(pathname, child)
            return (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  end
                  className={() =>
                    [
                      'flex items-center rounded-md px-3 py-2 text-body transition-colors',
                      childActive
                        ? 'bg-white font-semibold text-primary'
                        : 'text-white/80 hover:bg-white/25',
                    ].join(' ')
                  }
                  aria-current={childActive ? 'page' : undefined}
                >
                  <span>{child.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}

export function Sidebar() {
  const { user, mockPersona, setMockPersona } = useAuth()

  const visibleSections = NAV_SECTIONS.filter((section) =>
    canAccessSection(section.requires, user.roles),
  )

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col border-r border-white/15 bg-primary">
      <div className="shrink-0 border-b border-white/15 px-5 py-3.5">
        <p className="text-h2 flex items-center gap-2.5 tracking-[0.125rem] text-white uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="2 2 20 20"
            className="size-6 shrink-0"
            aria-hidden="true"
          >
            <path d="M21 3h-7c-.77 0-1.47.3-2 .78-.53-.48-1.23-.78-2-.78H3c-.55 0-1 .45-1 1v15c0 .55.45 1 1 1h5.76c.53 0 1.04.21 1.41.59l1.12 1.12s.02.01.03.02c.09.08.18.15.29.2.12.05.25.08.38.08s.26-.03.38-.08c.11-.05.21-.12.29-.2 0 0 .02-.01.03-.02l1.12-1.12c.37-.37.89-.59 1.41-.59h5.76c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1Zm-1 15h-4.76c-.8 0-1.58.25-2.24.69V6c0-.55.45-1 1-1h6z" />
          </svg>
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
              {section.items.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
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
