import { Navigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { HomeUnified } from './HomeUnified'

// Role-aware operational destinations remain explicit. Patient, doctor and
// owner roles share one compact home so navigation does not fork into multiple
// competing dashboards.
export function Home() {
  const { account } = useStore()
  if (!account) return null

  switch (account.role) {
    case 'kontributor':
      return <Navigate to="/editor" replace />
    case 'verifikator':
      return <Navigate to="/verification" replace />
    case 'admin':
      return <Navigate to="/admin" replace />
    default:
      return <HomeUnified />
  }
}
