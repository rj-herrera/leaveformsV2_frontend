/** Default landing path after login or `/`. */
export function homePath(isPresident: boolean): string {
  return isPresident ? '/team/leave-approvals' : '/dashboard'
}
