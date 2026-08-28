export type UserGender = 'male' | 'female'

/** API `employee_list.gender`: `0` male, `1` female, otherwise unknown. */
export function mapApiGender(value: unknown): UserGender | null {
  if (value === 0 || value === '0') return 'male'
  if (value === 1 || value === '1') return 'female'
  return null
}
