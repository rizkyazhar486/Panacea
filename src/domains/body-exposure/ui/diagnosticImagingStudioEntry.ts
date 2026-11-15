// The radiology MPR studio as other domains may use it: loaded on demand. The domain index stays importable from
// plain Node (the build's QA step runs before Vite and cannot load .tsx), and the studio's code stays out of every
// bundle that only needs the index. Render it inside a <Suspense> boundary.
import { lazy } from 'react'

export const DiagnosticImagingVolumetricStudio = lazy(() =>
  import('./KaloLumenVolumetricStudio.tsx').then((module) => ({ default: module.KaloLumenVolumetricStudio })),
)
