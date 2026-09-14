import { Navigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { HomeSocialWorkspace } from './HomeSocialWorkspace'

// Role-aware landing stays intact for contributor/verifier/admin accounts.
// Patient, doctor and owner accounts now land in one Home workspace that
// contains logs/stats, social, clubs, finance, markets, scores and reading.
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
      return <HomeSocialWorkspace />
  }
}
