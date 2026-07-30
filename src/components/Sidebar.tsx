import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, LogOut, UserRoundCog } from 'lucide-react'
import { matchPath, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../auth/AuthContext'
import { Button } from './ui/Button'
import { NAV_SECTIONS, type NavChildItem, type NavItem } from '../nav/navConfig'

const COLLAPSED_ICON_BUTTON =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors'

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

function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="2 2 20 20"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 3h-7c-.77 0-1.47.3-2 .78-.53-.48-1.23-.78-2-.78H3c-.55 0-1 .45-1 1v15c0 .55.45 1 1 1h5.76c.53 0 1.04.21 1.41.59l1.12 1.12s.02.01.03.02c.09.08.18.15.29.2.12.05.25.08.38.08s.26-.03.38-.08c.11-.05.21-.12.29-.2 0 0 .02-.01.03-.02l1.12-1.12c.37-.37.89-.59 1.41-.59h5.76c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1Zm-1 15h-4.76c-.8 0-1.58.25-2.24.69V6c0-.55.45-1 1-1h6z" />
    </svg>
  )
}

function ChildLinks({
  items,
  onNavigate,
}: {
  items: NavChildItem[]
  onNavigate?: () => void
}) {
  const { pathname } = useLocation()

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((child) => {
        const childActive = isChildActive(pathname, child)
        return (
          <li key={child.to}>
            <NavLink
              to={child.to}
              end
              onClick={onNavigate}
              className={() =>
                [
                  'flex items-center rounded-md px-3 py-2 text-body transition-colors',
                  childActive
                    ? 'bg-white font-semibold text-primary'
                    : 'text-white/85 hover:bg-white/20',
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
  )
}

function FloatingMenuCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="menu"
      className={[
        'absolute left-full z-50 ml-2 min-w-52 rounded-xl border border-white/20 bg-primary p-2 shadow-xl ring-1 ring-black/10',
        className,
      ].join(' ')}
    >
      <p className="px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-white/65 uppercase">
        {title}
      </p>
      <div className="mt-1 flex flex-col gap-1.5 px-2 pb-1">{children}</div>
    </div>
  )
}

function NavItemLink({
  item,
  collapsed,
}: {
  item: NavItem
  collapsed: boolean
}) {
  const { pathname } = useLocation()
  const active = isNavItemActive(pathname, item)
  const Icon = item.icon
  const hasChildren = (item.children?.length ?? 0) > 0
  const [open, setOpen] = useState(active)
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const itemRef = useRef<HTMLLIElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  useEffect(() => {
    if (!collapsed) setFlyoutOpen(false)
  }, [collapsed])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!flyoutOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!itemRef.current?.contains(event.target as Node)) {
        setFlyoutOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setFlyoutOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [flyoutOpen])

  function clearCloseTimer() {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function openFlyout() {
    clearCloseTimer()
    setFlyoutOpen(true)
  }

  function scheduleCloseFlyout() {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setFlyoutOpen(false)
      closeTimerRef.current = null
    }, 140)
  }

  if (!hasChildren) {
    return (
      <li className={collapsed ? 'flex justify-center' : undefined}>
        <NavLink
          to={item.to}
          end
          title={collapsed ? item.label : undefined}
          aria-label={collapsed ? item.label : undefined}
          className={() =>
            [
              collapsed
                ? COLLAPSED_ICON_BUTTON
                : 'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-body transition-colors',
              active
                ? 'bg-white font-semibold text-primary'
                : 'text-white/90 hover:bg-white/25',
            ].join(' ')
          }
          aria-current={active ? 'page' : undefined}
        >
          <Icon className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          {!collapsed ? <span>{item.label}</span> : null}
        </NavLink>
      </li>
    )
  }

  if (collapsed) {
    return (
      <li
        ref={itemRef}
        className="flex justify-center"
        onMouseEnter={openFlyout}
        onMouseLeave={scheduleCloseFlyout}
      >
        <div className="relative flex w-full justify-center">
          <button
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-expanded={flyoutOpen}
            aria-haspopup="menu"
            onClick={() => setFlyoutOpen((prev) => !prev)}
            className={[
              COLLAPSED_ICON_BUTTON,
              active || flyoutOpen
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:bg-white/25',
            ].join(' ')}
          >
            <Icon className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          </button>
          {flyoutOpen ? (
            <FloatingMenuCard title={item.label} className="top-0 ml-7">
              <ChildLinks
                items={item.children!}
                onNavigate={() => setFlyoutOpen(false)}
              />
            </FloatingMenuCard>
          ) : null}
        </div>
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
        <div className="mt-1 ml-4 border-l border-white/20 pl-2">
          <ChildLinks items={item.children!} />
        </div>
      ) : null}
    </li>
  )
}

function RoleSelect({
  value,
  onChange,
}: {
  value: UserRole
  onChange: (role: UserRole) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
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
  )
}

function DevRolePreview({
  collapsed,
  mockPersona,
  setMockPersona,
}: {
  collapsed: boolean
  mockPersona: UserRole
  setMockPersona: (role: UserRole) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!collapsed) setOpen(false)
  }, [collapsed])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function clearCloseTimer() {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  if (collapsed) {
    return (
      <div
        ref={rootRef}
        className="relative flex shrink-0 justify-center border-t border-white/15 p-2"
        onMouseEnter={() => {
          clearCloseTimer()
          setOpen(true)
        }}
        onMouseLeave={() => {
          clearCloseTimer()
          closeTimerRef.current = window.setTimeout(() => {
            setOpen(false)
            closeTimerRef.current = null
          }, 140)
        }}
      >
        <button
          type="button"
          title="Preview role"
          aria-label="Preview role"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={[
            COLLAPSED_ICON_BUTTON,
            open
              ? 'bg-white/20 text-white'
              : 'text-white/90 hover:bg-white/25',
          ].join(' ')}
        >
          <UserRoundCog className="size-4" strokeWidth={2.5} aria-hidden="true" />
        </button>
        {open ? (
          <FloatingMenuCard title="Dev only" className="bottom-0">
            <label className="flex flex-col gap-1.5 text-small text-white/70">
              <span>Preview role</span>
              <RoleSelect value={mockPersona} onChange={setMockPersona} />
            </label>
          </FloatingMenuCard>
        ) : null}
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-white/15 px-3 py-4">
      <p className="text-header mb-2 px-2 tracking-[0.125rem] text-white/70 uppercase">
        Dev only
      </p>
      <label className="flex flex-col gap-1.5 px-2 text-small text-white/70">
        <span>Preview role</span>
        <RoleSelect value={mockPersona} onChange={setMockPersona} />
      </label>
    </div>
  )
}

function SectionLabel({
  title,
  collapsed,
  isFirst,
}: {
  title: string
  collapsed: boolean
  isFirst: boolean
}) {
  if (collapsed) {
    if (isFirst) {
      return <span className="sr-only">{title}</span>
    }

    return (
      <div className="mb-2 w-full px-2" title={title}>
        <span className="sr-only">{title}</span>
        <div
          className="h-px w-full bg-white/25"
          role="separator"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <p className="text-header mb-2 px-2 tracking-[0.125rem] text-white/70 uppercase">
      {title}
    </p>
  )
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { user, mockPersona, setMockPersona, signOut } = useAuth()
  const navigate = useNavigate()

  const visibleSections = NAV_SECTIONS.filter((section) =>
    canAccessSection(section.requires, user.roles),
  )

  function handleLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={[
        'flex h-svh shrink-0 flex-col border-r border-white/15 bg-primary transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-20 overflow-visible' : 'w-64',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-14 shrink-0 items-center border-b border-white/15',
          collapsed ? 'justify-center px-2' : 'px-5',
        ].join(' ')}
      >
        <div
          className={[
            'text-h2 flex min-w-0 items-center tracking-[0.125rem] text-white uppercase',
            collapsed ? 'justify-center' : 'gap-2.5',
          ].join(' ')}
          title={collapsed ? 'Leave Forms' : undefined}
        >
          <BrandMark className="size-6 shrink-0" />
          {!collapsed ? (
            <span className="truncate">Leave Forms</span>
          ) : (
            <span className="sr-only">Leave Forms</span>
          )}
        </div>
      </div>

      <nav
        className={[
          'min-h-0 flex-1 py-4',
          collapsed ? 'overflow-visible px-2' : 'overflow-y-auto px-3',
        ].join(' ')}
      >
        {visibleSections.map((section, index) => (
          <div key={section.id} className={collapsed ? 'mb-4' : 'mb-5'}>
            <SectionLabel
              title={section.title}
              collapsed={collapsed}
              isFirst={index === 0}
            />
            <ul
              className={[
                'flex flex-col',
                collapsed ? 'items-center gap-1.5' : 'gap-1.5',
              ].join(' ')}
            >
              {section.items.map((item) => (
                <NavItemLink key={item.to} item={item} collapsed={collapsed} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* TODO(REMOVE): Dev-only role preview — delete this block when real session roles exist */}
      <DevRolePreview
        collapsed={collapsed}
        mockPersona={mockPersona}
        setMockPersona={setMockPersona}
      />

      {collapsed ? (
        <div className="flex shrink-0 justify-center border-t border-white/15 p-2">
          <button
            type="button"
            title="Log out"
            aria-label="Log out"
            onClick={handleLogout}
            className={`${COLLAPSED_ICON_BUTTON} text-white/90 hover:bg-white/25`}
          >
            <LogOut className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="shrink-0 border-t border-white/15 px-3 py-3">
          <div className="px-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full border-white/25 bg-white/10 text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              Log out
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
}
