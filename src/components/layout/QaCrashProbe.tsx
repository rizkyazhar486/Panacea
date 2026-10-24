import { useLocation } from 'react-router-dom'
import { QA_CRASH_KEY, qaShouldCrash } from './routeErrorState'

// Kait QA (ENG-F1-03): HANYA aktif pada build dengan VITE_QA_HOOKS=1. Bila sessionStorage 'panacea:qa-crash-route'
// sama dengan rute aktif, komponen ini melempar galat saat render sehingga pemeriksaan ketahanan bisa membuktikan
// crash satu halaman tertahan oleh RouteErrorBoundary. Build biasa: QA_AKTIF adalah konstanta false dan komponen
// tidak merender apa pun (dan dibuang oleh minifier).
const QA_AKTIF = import.meta.env.VITE_QA_HOOKS === '1'

function QaCrashProbeActive() {
  const { pathname } = useLocation()
  let target: string | null = null
  try { target = window.sessionStorage.getItem(QA_CRASH_KEY) } catch { target = null }
  if (qaShouldCrash(target, pathname)) throw new Error(`QA injected render crash on ${pathname}`)
  return null
}

export function QaCrashProbe() {
  return QA_AKTIF ? <QaCrashProbeActive /> : null
}
