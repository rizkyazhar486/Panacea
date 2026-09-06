import { Body3D, CT_WINDOWS, MOTION_OFF, type AnatomyLayer } from '../Body3D'
import { SurgicalRehearsalLab } from './SurgicalRehearsalLab'

const REHEARSAL_LAYERS = new Set<AnatomyLayer['key']>(['skeletal', 'muscular', 'cardiovascular', 'visceral'])

export function CinematicSurgicalRehearsal() {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#02060b] text-white shadow-[0_32px_110px_rgba(0,0,0,.34)]">
        <div className="border-b border-white/8 p-4 sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#f0d68a]">Surgical rehearsal · anatomy orientation</div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Rehearse on named anatomy, not cartoon geometry.</h2>
          <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-white/48">This orientation viewport uses the same named anatomical GLB meshes and cinematic tissue renderer as the main Body Exposure atlas. Procedure recall and risk-map exercises continue below.</p>
        </div>
        <div className="h-[560px]">
          <Body3D
            layers={REHEARSAL_LAYERS}
            highlighted={[]}
            focusKeywords={null}
            renderMode="anatomy"
            ctWindow={CT_WINDOWS[0]}
            slicePlane="none"
            slicePos={0.5}
            motion={MOTION_OFF}
            unfold={0.06}
            dissect={1}
            onPick={() => undefined}
          />
        </div>
      </section>
      <SurgicalRehearsalLab />
    </div>
  )
}

export default CinematicSurgicalRehearsal
