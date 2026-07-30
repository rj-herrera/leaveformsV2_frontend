import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorPage } from '../../components/feedback/ErrorPage'

export function OfflinePage() {
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine,
  )

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <ErrorPage
      code="Offline"
      title="You are offline"
      description={
        isOnline
          ? 'Your connection has been restored. You can retry to reload this page.'
          : 'Your internet or network connection was lost. Check your connection, then try again.'
      }
      icon={<WifiOff strokeWidth={1.75} />}
      primaryAction={{
        label: 'Retry Connection',
        onClick: () => {
          if (navigator.onLine) {
            window.location.reload()
          } else {
            setIsOnline(false)
          }
        },
      }}
      secondaryAction={{
        label: 'Return to Dashboard',
        onClick: () => navigate('/dashboard'),
      }}
    />
  )
}
