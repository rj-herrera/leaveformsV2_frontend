/**
 * Leave balance JsonResource (`LeaveBalanceResource`).
 * `available` / `reserved` are decimal strings (e.g. `"12.00"`).
 */
export type LeaveBalanceResource = {
  leave_type_id: number
  code: string
  name: string
  available: string
  reserved: string
}
