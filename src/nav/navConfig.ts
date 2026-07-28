import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Scale,
  ScrollText,
  UserPlus,
  Wallet,
} from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  /**
   * Extra path patterns (react-router matchPath) that keep this item active.
   * The `to` path is always matched as well.
   */
  matchPaths?: string[]
}

export type NavSection = {
  id: 'employee' | 'team' | 'admin'
  title: string
  /** Which capability unlocks this section */
  requires: 'employee' | 'approver' | 'admin'
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'employee',
    title: 'My Leave',
    requires: 'employee',
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        matchPaths: [
          '/my-leave/requests/:leaveRequestId',
          '/my-leave/requests/:leaveRequestId/*',
        ],
      },
      { label: 'File Leave', to: '/my-leave/file', icon: FilePlus2 },
      { label: 'Activity Log', to: '/my-leave/activity-log', icon: ScrollText },
    ],
  },
  {
    id: 'team',
    title: 'Team Management',
    requires: 'approver',
    items: [
      {
        label: 'Leave Approvals',
        to: '/team/leave-approvals',
        icon: ClipboardCheck,
        matchPaths: [
          '/team/leave-approvals/:leaveRequestId',
          '/team/leave-requests/:leaveRequestId',
        ],
      },
      {
        label: 'File Leave for Member',
        to: '/team/file-leave',
        icon: UserPlus,
      },
      {
        label: 'Team Leave Calendar',
        to: '/team/leave-calendar',
        icon: CalendarDays,
        matchPaths: ['/team/leave-calendar/*'],
      },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    requires: 'admin',
    items: [
      {
        label: 'Leave Requests',
        to: '/admin/leave-requests',
        icon: ClipboardList,
        matchPaths: ['/admin/leave-requests/*'],
      },
      {
        label: 'Leave Balances',
        to: '/admin/leave-balances',
        icon: Wallet,
        matchPaths: ['/admin/leave-balances/*'],
      },
      {
        label: 'Administrative Log',
        to: '/admin/logs',
        icon: Scale,
        matchPaths: ['/admin/logs/:logId'],
      },
      {
        label: 'Leave Reports',
        to: '/admin/reports',
        icon: BarChart3,
      },
    ],
  },
]
