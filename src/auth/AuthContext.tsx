/**
 * Auth bootstrap via portal cookie (userID) + GET /api/me.
 *
 * Dev login: POST /api/dev/login with emp_id → frontend sets the cookie.
 * Roles come from /api/me `role` (approval_level, is_president, is_admin).
 * TODO: Map gender from /api/me when the backend exposes it.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '../api/axios-client'
import {
  fetchCurrentUser,
  loginWithEmployeeId,
  type MeGroupRef,
  type MeResponse,
} from '../api/auth'
import { clearCookie, getCookie, setCookie } from '../utils/cookies'

export type UserRole = 'employee' | 'approver' | 'admin'

export type UserGender = 'male' | 'female'

export type AuthUser = {
  id: string
  name: string
  email: string
  employeeNumber: string
  gender: UserGender
  /** PIC groups from `/me` `role.pic_groups`. Empty if not a PIC. */
  picGroups: MeGroupRef[]
  /** Employee access is always true for authenticated users */
  roles: {
    employee: true
    approver: boolean
    admin: boolean
  }
}

export type SignInResult =
  | { ok: true }
  | { ok: false; message: string }

type AuthContextValue = {
  user: AuthUser
  isAuthenticated: boolean
  /** True while checking an existing cookie / loading /api/me on startup. */
  isBootstrapping: boolean
  signInWithEmployeeNumber: (employeeNumber: string) => Promise<SignInResult>
  signOut: () => void
}

const DEFAULT_COOKIE_NAME = 'userID'

const FALLBACK_USER: AuthUser = {
  id: '',
  name: '',
  email: '',
  employeeNumber: '',
  gender: 'female',
  picGroups: [],
  roles: { employee: true, approver: false, admin: false },
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
    email: me.email ?? '',
    employeeNumber: String(me.id),
    // TODO: use real gender from API when available
    gender: 'female',
    picGroups: me.role.pic_groups ?? [],
    roles: rolesFromMe(me),
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
      if (!getCookie(DEFAULT_COOKIE_NAME)) {
        if (!cancelled) {
          setUser(null)
          setIsBootstrapping(false)
        }
        return
      }

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

  const signInWithEmployeeNumber = useCallback(
    async (employeeNumber: string): Promise<SignInResult> => {
      const trimmed = employeeNumber.trim()
      const empId = Number(trimmed)
      if (!trimmed || !Number.isInteger(empId) || empId < 1) {
        return { ok: false, message: 'Please enter a valid employee ID.' }
      }

      try {
        const login = await loginWithEmployeeId(empId)
        const cookieName = login.cookie || DEFAULT_COOKIE_NAME
        setCookie(cookieName, login.userID)

        const me = await fetchCurrentUser()
        setUser(mapMeToAuthUser(me))
        return { ok: true }
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            ok: false,
            message:
              error.message ||
              'Employee ID not found. Please check and try again.',
          }
        }
        return {
          ok: false,
          message:
            'Unable to reach the server. Is the API running on port 8000?',
        }
      }
    },
    [],
  )

  const signOut = useCallback(() => {
    clearCookie(DEFAULT_COOKIE_NAME)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user: user ?? FALLBACK_USER,
      isAuthenticated: user != null,
      isBootstrapping,
      signInWithEmployeeNumber,
      signOut,
    }),
    [user, isBootstrapping, signInWithEmployeeNumber, signOut],
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
