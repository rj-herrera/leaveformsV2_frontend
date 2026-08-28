import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Baby,
  BriefcaseMedical,
  CalendarRange,
  Leaf,
  Sprout,
  Sun,
} from 'lucide-react'

export type SelectableLeaveType = 'emergency' | 'ptb'

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

export const PTB_LEAVE_THEME: LeaveTypeTheme = {
  label: 'PTB Leave',
  icon: Sprout,
  iconBgClass: 'bg-leave-ptb',
}

export const EMERGENCY_LEAVE_THEME: LeaveTypeTheme = {
  label: 'Emergency Leave',
  icon: AlertTriangle,
  iconBgClass: 'bg-leave-emergency',
}

export const LONG_LEAVE_THEME: LeaveTypeTheme = {
  label: 'Long Leave',
  icon: CalendarRange,
  iconBgClass: 'bg-leave-long',
}

export const MATERNITY_LEAVE_THEME: LeaveTypeTheme = {
  label: 'Maternity Leave',
  icon: Baby,
  iconBgClass: 'bg-leave-maternity',
}

export const PATERNITY_LEAVE_THEME: LeaveTypeTheme = {
  label: 'Paternity Leave',
  icon: Baby,
  iconBgClass: 'bg-leave-paternity',
}

export const SELECTABLE_LEAVE_DEFAULT: LeaveTypeTheme = {
  label: 'Select Leave Type',
  icon: Leaf,
  iconBgClass: 'bg-text-gray',
}

export const SELECTABLE_LEAVE_THEMES: Record<
  SelectableLeaveType,
  LeaveTypeTheme
> = {
  emergency: EMERGENCY_LEAVE_THEME,
  ptb: PTB_LEAVE_THEME,
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
    case 'el':
    case 'emergency leave':
      return 'border-l-leave-emergency bg-leave-emergency/20'
    case 'll':
    case 'long leave':
      return 'border-l-leave-long bg-leave-long/15'
    case 'ptb':
    case 'ptb leave':
    case 'pulmonary tuberculosis leave':
      return 'border-l-leave-ptb bg-leave-ptb/15'
    case 'ml':
    case 'maternity leave':
      return 'border-l-leave-maternity bg-leave-maternity/15'
    case 'pl':
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
    case 'el':
    case 'emergency leave':
      return 'bg-leave-emergency/20 text-leave-emergency'
    case 'll':
    case 'long leave':
      return 'bg-leave-long/15 text-leave-long'
    case 'ptb':
    case 'ptb leave':
    case 'pulmonary tuberculosis leave':
      return 'bg-leave-ptb/15 text-leave-ptb'
    case 'ml':
    case 'maternity leave':
      return 'bg-leave-maternity/15 text-leave-maternity'
    case 'pl':
    case 'paternity leave':
      return 'bg-leave-paternity/15 text-leave-paternity'
    default:
      return 'bg-primary/10 text-primary'
  }
}
