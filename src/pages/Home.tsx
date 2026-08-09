import { Navigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import Beranda from './Beranda'

// Pendaratan menurut peran.
//
// Beranda dulu adalah umpan sosial (Feed). Bagi pemakai baru layar pertama
// sebuah aplikasi kesehatan berbunyi "No posts yet" -- 31 kata, tidak satu pun
// tentang kesehatannya. Umpan itu tetap ada di /community; yang berubah hanya
// pintu masuknya, kini berisi pekerjaan yang bisa langsung dikerjakan.
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
      return <Beranda />
  }
}
