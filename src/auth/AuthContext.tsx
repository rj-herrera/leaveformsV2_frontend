/**
 * TODO(REMOVE / REPLACE): Development mock auth.
 * - Remove PERSONAS, mockPersona, and setMockPersona when cookie/session auth is wired.
 * - Keep AuthProvider + useAuth, but load the real user/roles from the backend session.
 * - Also remove the "Preview role" UI in Sidebar.tsx that depends on setMockPersona.
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type UserRole = 'employee' | 'approver' | 'admin'

export type UserGender = 'male' | 'female'

export type AuthUser = {
  id: string
  name: string
  email: string
  employeeNumber: string
  gender: UserGender
  /** Employee access is always true for authenticated users */
  roles: {
    employee: true
    approver: boolean
    admin: boolean
  }
}

type AuthContextValue = {
  user: AuthUser
  /** TODO(REMOVE): Temporary mock persona switcher */
  setMockPersona: (persona: UserRole) => void
  /** TODO(REMOVE): Temporary mock persona switcher */
  mockPersona: UserRole
}

/** TODO(REMOVE): Fake users for local role preview only */
const PERSONAS: Record<UserRole, AuthUser> = {
  employee: {
    id: 'user-employee',
    name: 'Alex Employee',
    email: 'alex.employee@example.com',
    employeeNumber: '801',
    gender: 'female',
    roles: { employee: true, approver: false, admin: false },
  },
  approver: {
    id: 'user-approver',
    name: 'Jordan Approver',
    email: 'jordan.approver@example.com',
    employeeNumber: '802',
    gender: 'male',
    roles: { employee: true, approver: true, admin: false },
  },
  admin: {
    id: 'user-admin',
    name: 'Casey Admin',
    email: 'casey.admin@example.com',
    employeeNumber: '803',
    gender: 'female',
    roles: { employee: true, approver: false, admin: true },
  },
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO(REMOVE): Replace mockPersona state with session bootstrap from API/cookies
  const [mockPersona, setMockPersona] = useState<UserRole>('employee')

  const value = useMemo(
    () => ({
      user: PERSONAS[mockPersona],
      mockPersona,
      setMockPersona,
    }),
    [mockPersona],
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
