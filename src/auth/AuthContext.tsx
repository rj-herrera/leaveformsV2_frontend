/**
 * Auth bootstrap via portal cookie (userID) + GET /api/me.
 * Roles come from /api/me `role` (approval_level, is_president, is_admin).
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentUser,
  type MeGroupRef,
  type MeResponse,
} from '../api/auth'
import { clearCookie } from '../utils/cookies'
import { mapApiGender, type UserGender } from '../utils/gender'

export type UserRole = 'employee' | 'approver' | 'admin'

export type { UserGender }

export type AuthUser = {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  employeeNumber: string
  gender: UserGender | null
  /** `employee_list.date_hired` from `/me`, or null if unset. */
  dateHired: string | null
  /** PIC groups from `/me` `role.pic_groups`. Empty if not a PIC. */
  picGroups: MeGroupRef[]
  /** From `/me` `role.is_president`. */
  isPresident: boolean
  /** Employee access is always true for authenticated users */
  roles: {
    employee: true
    approver: boolean
    admin: boolean
  }
  group: {
    id: number
    name: string | null
    abbreviation: string | null
  }
  designation: {
    id: number
    name: string | null
    acronym: string | null
  }
}

type AuthContextValue = {
  user: AuthUser
  isAuthenticated: boolean
  /** True while checking an existing cookie / loading /api/me on startup. */
  isBootstrapping: boolean
}

const DEFAULT_COOKIE_NAME = 'userID'

const FALLBACK_USER: AuthUser = {
  id: '',
  name: '',
  firstName: '',
  lastName: '',
  email: '',
  employeeNumber: '',
  gender: null,
  dateHired: null,
  picGroups: [],
  isPresident: false,
  roles: { employee: true, approver: false, admin: false },
  group: { id: 0, name: '', abbreviation: '' },
  designation: { id: 0, name: '', acronym: '' },
}

function rolesFromMe(me: MeResponse): AuthUser['roles'] {
  const role = me.role
  return {
    employee: true,
    approver: role.approval_level != null || role.is_president,
    admin: role.is_admin,
  }
}

function mapMeToAuthUser(me: MeResponse): AuthUser {
  return {
    id: String(me.id),
    name: me.full_name,
    firstName: me.firstname ?? '',
    lastName: me.surname ?? '',
    email: me.email ?? '',
    employeeNumber: String(me.id),
    gender: mapApiGender(me.gender),
    dateHired: me.date_hired,
    picGroups: me.role.pic_groups ?? [],
    isPresident: me.role.is_president === true,
    roles: rolesFromMe(me),
    group: me.group ?? { id: 0, name: null, abbreviation: null },
    designation: me.designation ?? { id: 0, name: '', acronym: '' },
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setIsBootstrapping(true)

      try {
        const me = await fetchCurrentUser()
        if (!cancelled) {
          setUser(mapMeToAuthUser(me))
        }
      } catch {
        clearCookie(DEFAULT_COOKIE_NAME)
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user: user ?? FALLBACK_USER,
      isAuthenticated: user != null,
      isBootstrapping,
    }),
    [user, isBootstrapping],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
