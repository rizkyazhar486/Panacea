import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import Beranda from './Beranda'
import { HomeSocialWorkspace } from './HomeSocialWorkspace'

// Preserve the approved daily Home baseline at `/` while keeping the expanded
// social/life workspace available at `/social`. No feature is removed.
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
