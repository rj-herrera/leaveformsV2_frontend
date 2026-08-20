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

/** Left-border chip colors for Team Leave Calendar bars. */
export function getLeaveTypeChipClasses(leaveType: string): string {
  switch (leaveType.trim().toLowerCase()) {
    case 'vl':
    case 'vacation leave':
      return 'border-l-leave-vacation bg-leave-vacation/15'
    case 'sl':
    case 'sick leave':
      return 'border-l-leave-sick bg-leave-sick/15'
    case 'emergency leave':
      return 'border-l-leave-emergency bg-leave-emergency/20'
    case 'ptb leave':
      return 'border-l-leave-ptb bg-leave-ptb/15'
    case 'maternity leave':
      return 'border-l-leave-maternity bg-leave-maternity/15'
    case 'paternity leave':
      return 'border-l-leave-paternity bg-leave-paternity/15'
    default:
      return 'border-l-primary bg-primary/10'
  }
}

/** Soft avatar fill + text tint matching calendar leave-type chip colors. */
export function getLeaveTypeAvatarClasses(leaveType: string): string {
  switch (leaveType.trim().toLowerCase()) {
    case 'vl':
    case 'vacation leave':
      return 'bg-leave-vacation/15 text-leave-vacation'
    case 'sl':
    case 'sick leave':
      return 'bg-leave-sick/15 text-leave-sick'
    case 'emergency leave':
      return 'bg-leave-emergency/20 text-leave-emergency'
    case 'ptb leave':
      return 'bg-leave-ptb/15 text-leave-ptb'
    case 'maternity leave':
      return 'bg-leave-maternity/15 text-leave-maternity'
    case 'paternity leave':
      return 'bg-leave-paternity/15 text-leave-paternity'
    default:
      return 'bg-primary/10 text-primary'
  }
}
