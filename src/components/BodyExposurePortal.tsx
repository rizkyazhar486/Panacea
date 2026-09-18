import { lazy, Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { BodySystemId } from '../lib/bodySystemSourceWave'
import { BodyExposureActivityNavigator } from './BodyExposureActivityNavigator'

const BodyAllSystems3D = lazy(() => import('./BodyAllSystems3D'))

type BodyExposurePortalContext = 'personal' | 'clinical'

export function BodyExposurePortal({
  context,
  className = '',
}: {
  context: BodyExposurePortalContext
  className?: string
}) {
  const [systemId, setSystemId] = useState<BodySystemId>(context === 'personal' ? 'musculoskeletal' : 'cardiovascular')
  const title = context === 'personal' ? 'Your anatomical body' : 'Clinical body map'
  const subtitle = context === 'personal'
    ? 'The same source-backed Body Exposure anatomy used across Panacea — no mannequin substitute.'
    : 'Anatomy, physiology, disease, imaging and intervention start from the same Body Exposure body.'

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`overflow-hidden rounded-[26px] border border-white/[.08] bg-black/35 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl ${className}`}
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-black uppercase tracking-[.16em] text-cyan-200/70">{title}</div>
          <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-white/38">{subtitle}</p>
        </div>
        <Link
          to="/fitness-hub?view=body-exposure"
          className="shrink-0 rounded-full border border-cyan-300/15 bg-cyan-300/[.06] px-3 py-1.5 text-[9px] font-black text-cyan-100/75 transition hover:bg-cyan-300/[.11] hover:text-white"
        >
          Expand
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="grid h-[330px] place-items-center rounded-[22px] border border-white/[.07] bg-[#010207] text-[10px] font-black text-white/35 sm:h-[380px]">
            Loading canonical anatomy…
          </div>
        }
      >
        <BodyAllSystems3D
          presentation="compact"
          startOpen
          selectedSystemId={systemId}
          onSystemChange={setSystemId}
        />
      </Suspense>

      <BodyExposureActivityNavigator
        context={context}
        className="mt-2"
      />
    </motion.section>
  )
}

export default BodyExposurePortal
