import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import Beranda from './Beranda'
import { HomeSocialWorkspace } from './HomeSocialWorkspace'

// Keep the approved daily Home visual baseline at `/`.
// The expanded social/life workspace remains available at `/social`, so this
// restoration changes the default presentation without deleting functionality.
export function Home() {
  const { account } = useStore()
  const location = useLocation()
  if (!account) return null
  switch (account.role) {
    case 'kontributor':
      return <Navigate to="/editor" replace />
    case 'verifikator':
      return <Navigate to="/verification" replace />
    case 'admin':
      return <Navigate to="/admin" replace />
    default:
      return location.pathname === '/social' ? <HomeSocialWorkspace /> : <Beranda />
  }
}
