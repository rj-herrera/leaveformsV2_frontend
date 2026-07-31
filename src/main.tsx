import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { SwrProvider } from './providers/SwrProvider'
import './index.css'
import App from './App.tsx'

/**
 * AuthProvider bootstraps from the portal userID cookie via GET /api/me.
 * Dev sign-in: POST /api/dev/login (see AuthContext / EmployeeIdEntryPage).
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SwrProvider>
          <App />
        </SwrProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
