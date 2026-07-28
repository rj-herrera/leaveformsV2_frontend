import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Baby,
  BriefcaseMedical,
  Leaf,
  Sprout,
  Sun,
} from 'lucide-react'
import type { UserGender } from '../auth/AuthContext'

export type SelectableLeaveType = 'emergency' | 'ptb' | 'parental'

export type LeaveTypeTheme = {
  label: string
  icon: LucideIcon
  iconBgClass: string
}

export const VACATION_LEAVE_THEME: LeaveTypeTheme = {
  label: 'Vacation Leave',
  icon: Sun,
  iconBgClass: 'bg-leave-vacation',
}

export const SICK_LEAVE_THEME: LeaveTypeTheme = {
  label: 'Sick Leave',
  icon: BriefcaseMedical,
  iconBgClass: 'bg-leave-sick',
}

export const SELECTABLE_LEAVE_DEFAULT: LeaveTypeTheme = {
  label: 'Select Leave Type',
  icon: Leaf,
  iconBgClass: 'bg-text-gray',
}

export function getSelectableLeaveThemes(
  parentalLabel: string,
  gender: UserGender,
): Record<SelectableLeaveType, LeaveTypeTheme> {
  return {
    emergency: {
      label: 'Emergency Leave',
      icon: AlertTriangle,
      iconBgClass: 'bg-leave-emergency',
    },
    ptb: {
      label: 'PTB Leave',
      icon: Sprout,
      iconBgClass: 'bg-leave-ptb',
    },
    parental: {
      label: parentalLabel,
      icon: Baby,
      iconBgClass:
        gender === 'female' ? 'bg-leave-maternity' : 'bg-leave-paternity',
    },
  }
}
