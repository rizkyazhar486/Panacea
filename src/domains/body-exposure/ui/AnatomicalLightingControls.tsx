import type { PresentationLighting } from '../engine/presentationLighting'
import { lightingSettings } from '../engine/presentationLighting'

export function AnatomicalLightingControls({ value, onChange }: {
  value: PresentationLighting; onChange: (update: Partial<PresentationLighting>) => void
}) {
  const change = (update: Partial<PresentationLighting>) => {
    const candidate = { ...value, ...update }
    const result = lightingSettings(candidate.mode, candidate.exposureEV)
    if (result.ok) onChange(update)
  }
  return <fieldset className="space-y-2">
    <legend className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">Lighting</legend>
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Anatomical lighting">
      {(['standard', 'studio'] as const).map(mode => <button key={mode} type="button" role="radio"
        aria-checked={value.mode === mode} onClick={() => change({ mode })}
        className={`min-h-[44px] rounded-full border px-3.5 text-[13px] font-bold capitalize ${value.mode === mode ? 'border-brand bg-brand-100 text-brand-dark dark:bg-emerald-400/15 dark:text-emerald-200' : 'border-neutral-500/30 opacity-70'}`}>
        {mode === 'standard' ? 'Standard' : 'Studio'}
      </button>)}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
        Exposure
        <input type="range" min={-2} max={2} step={0.25} value={value.exposureEV}
          aria-label="Lighting exposure" aria-valuetext={`${value.exposureEV.toFixed(2)} EV`}
          className="min-h-[44px] min-w-0 flex-1"
          onChange={e => change({ exposureEV: Number(e.target.value) })} />
      </label>
      <output aria-live="polite" className="text-[12px] tabular-nums">{value.exposureEV.toFixed(2)} EV</output>
      <button type="button" onClick={() => change({ mode: 'standard', exposureEV: 0 })} className="min-h-[44px] rounded-full border border-neutral-500/30 px-3 text-[12px] font-bold">Reset lighting</button>
    </div>
    <p className="text-[12px] text-neutral-500">Studio lighting follows the camera. Presentation only — anatomy and clinical review are unchanged. Real-time lighting is not path tracing.</p>
  </fieldset>
}
