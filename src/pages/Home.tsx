import { Navigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Dashboard } from './Dashboard'

// Role-based landing. The patient Dashboard is confidential — owners and other
// business roles never land on individual patient data; they go to their own home.
export function Home() {
  const { account } = useStore()
  if (!account) return null
  switch (account.role) {
    case 'pasien':
    case 'dokter':
      return <Dashboard />
    case 'owner':
      return <Navigate to="/owner" replace />
    case 'kontributor':
      return <Navigate to="/editor" replace />
    case 'verifikator':
      return <Navigate to="/verification" replace />
    case 'admin':
      return <Navigate to="/admin" replace />
    default:
      return <Navigate to="/social" replace />
  }
}
