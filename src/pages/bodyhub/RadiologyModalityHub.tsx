import { lazy, Suspense } from 'react'
import RadiologyModalityContent from './RadiologyModalityContent'

const DigestiveFlow3D = lazy(() => import('../../components/DigestiveFlow3D'))

export default function RadiologyModalityHub() {
  return (
    <div className="space-y-3">
      <RadiologyModalityContent />
      <Suspense fallback={<div role="status" className="flex min-h-24 items-center justify-center rounded-2xl border border-amber-200 text-xs font-bold text-neutral-500 dark:border-amber-300/20">Loading Digestive 3D module…</div>}>
        <DigestiveFlow3D />
      </Suspense>
    </div>
  )
}
