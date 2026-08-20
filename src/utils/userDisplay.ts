import type { AuthUser } from '../auth/AuthContext'

/** First letter of first name + first letter of last name, max two characters. */
export function userInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase()
}

/** Highest signed-in capability: Admin, then Approver, else Employee. */
export function userRoleLabel(roles: AuthUser['roles']): string {
  if (roles.admin) return 'Admin'
  if (roles.approver) return 'Approver'
  return 'Employee'
}
