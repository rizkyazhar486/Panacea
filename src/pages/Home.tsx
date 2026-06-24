import { Navigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Feed } from './Feed'

// Role-based landing. The Dashboard is now the "Panacea Hidup Sehat" social
// feed — shared by patients, doctors and owner. Clinical patient data is no
// longer here; doctors access it per-patient under "Data Klinis"/AI-EMR.
export function Home() {
  const { account } = useStore()
  if (!account) return null
  switch (account.role) {
    case 'pasien':
    case 'dokter':
    case 'owner':
      return <Feed />
    case 'kontributor':
      return <Navigate to="/editor" replace />
    case 'verifikator':
      return <Navigate to="/verification" replace />
    case 'admin':
      return <Navigate to="/admin" replace />
    default:
      return <Feed />
  }
}
