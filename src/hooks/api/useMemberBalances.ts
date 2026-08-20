import useSWR from 'swr'
import { listBalances } from '../../api/balances'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/balances` for GET /balances?emp_id=. */
export function useMemberBalances(empId: number | null, code?: string) {
  return useSWR(
    empId != null ? swrKeys.memberBalances(empId, code) : null,
    ([, id, leaveCode]: readonly ['balances', number, string | null]) =>
      listBalances({
        emp_id: id,
        code: leaveCode ?? undefined,
      }),
  )
}
