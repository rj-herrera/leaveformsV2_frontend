import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { BootLoadingView } from '../../components/ui/BootLoadingView'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/form/TextField'

type LocationState = {
  from?: string
}

export function EmployeeIdEntryPage() {
  const { isAuthenticated, isBootstrapping, signInWithEmployeeNumber } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as LocationState | null)?.from &&
    (location.state as LocationState).from !== '/login'
      ? (location.state as LocationState).from!
      : '/dashboard'

  const [employeeId, setEmployeeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isBootstrapping) {
    return <BootLoadingView />
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = employeeId.trim()
    if (!trimmed) {
      setError('Please enter your employee ID.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    const result = await signInWithEmployeeNumber(trimmed)
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <p className="text-header tracking-[0.125rem] text-primary uppercase">
            Leave Forms
          </p>
          <h1 className="mt-2 text-h1 text-text-black">Sign in</h1>
          <p className="mt-1 text-body text-text-gray">
            Enter your employee ID to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Employee ID"
            name="employeeId"
            value={employeeId}
            onChange={(value) => {
              setEmployeeId(value)
              if (error) setError(null)
            }}
            placeholder="e.g. 801"
            disabled={isSubmitting}
          />

          {error ? (
            <p className="text-small text-status-rejected" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isSubmitting}
            loadingText="Signing in…"
          >
            Continue
          </Button>
        </form>

        <p className="mt-4 text-small text-text-gray">
          Dev login — uses POST /api/dev/login, then sets the userID cookie.
        </p>
      </div>
    </div>
  )
}
