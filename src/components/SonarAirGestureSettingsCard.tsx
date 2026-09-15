import { useEffect, useState } from 'react'
import { Card, SectionTitle } from './ui'
import {
  dopplerShiftHz,
  sonarAirGestures,
  type SonarSnapshot,
} from '../lib/sonarAirGestures'

const PHASE_LABEL: Record<SonarSnapshot['phase'], string> = {
  idle: 'Off',
  requesting: 'Requesting microphone…',
  calibrating: 'Calibrating — keep your hand still',
  active: 'Active',
  unsupported: 'Unavailable on this device',
  error: 'Needs attention',
}

export function SonarAirGestureSettingsCard({ simple: S }: { simple: boolean }) {
  const [snapshot, setSnapshot] = useState<SonarSnapshot>(() => sonarAirGestures.getSnapshot())

  useEffect(() => {
    const unsubscribe = sonarAirGestures.subscribe(setSnapshot)
    return () => { unsubscribe() }
  }, [])

  const running = snapshot.phase === 'requesting' || snapshot.phase === 'calibrating' || snapshot.phase === 'active'
  const exampleShift = dopplerShiftHz(0.5, snapshot.carrierHz ?? 20_000)
  const statusTone = snapshot.phase === 'active'
    ? 'border-cyan-400/35 bg-cyan-400/10'
    : snapshot.phase === 'error' || snapshot.phase === 'unsupported'
      ? 'border-amber-400/35 bg-amber-400/10'
      : 'border-neutral-200 bg-neutral-50'

  return (
    <Card>
      <SectionTitle
        icon={<span className={S ? 'text-2xl' : 'text-xl'} aria-hidden="true">◉</span>}
        title="Touchless Air Gestures"
        subtitle="Experimental local Doppler control · scroll without touching the screen"
      />

      <div className={`rounded-2xl border ${statusTone} ${S ? 'p-5' : 'p-4'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className={`font-extrabold ${S ? 'text-lg' : 'text-sm'}`}>{PHASE_LABEL[snapshot.phase]}</div>
            <div className={`mt-0.5 text-neutral-500 ${S ? 'text-sm' : 'text-[11px]'}`}>
              {snapshot.phase === 'active'
                ? snapshot.motion === 'idle'
                  ? 'Ready — move a hand toward or away from the laptop.'
                  : `${snapshot.motion === 'approaching' ? 'Approaching' : 'Receding'} · confidence ${Math.round(snapshot.confidence * 100)}%`
                : 'Best on a laptop with a speaker and microphone near the display.'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { void (running ? sonarAirGestures.stop() : sonarAirGestures.start()) }}
            disabled={snapshot.phase === 'requesting'}
            className={`min-h-11 rounded-xl px-4 font-bold transition ${S ? 'text-base' : 'text-sm'} ${
              running
                ? 'border border-amber-400/35 bg-amber-400/10 text-amber-700 hover:bg-amber-400/15'
                : 'bg-brand text-white shadow-sm hover:brightness-105'
            } disabled:cursor-wait disabled:opacity-60`}
          >
            {running ? 'Stop' : 'Start & calibrate'}
          </button>
        </div>

        {snapshot.error && (
          <div className={`mt-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-amber-800 ${S ? 'text-sm' : 'text-xs'}`}>
            {snapshot.error}
          </div>
        )}

        <div className={`mt-4 grid grid-cols-3 gap-2 ${S ? 'text-sm' : 'text-[11px]'}`}>
          <Metric label="Carrier" value={snapshot.carrierHz ? `${(snapshot.carrierHz / 1000).toFixed(1)} kHz` : '—'} />
          <Metric label="Doppler shift" value={snapshot.phase === 'active' ? `${snapshot.shiftHz >= 0 ? '+' : ''}${snapshot.shiftHz.toFixed(1)} Hz` : '—'} />
          <Metric label="Signal / baseline" value={snapshot.phase === 'active' ? `${snapshot.signalRatio.toFixed(2)}×` : '—'} />
        </div>
      </div>

      <div className={`mt-4 space-y-4 ${S ? 'text-sm' : 'text-xs'}`}>
        <label className="block">
          <span className="flex items-center justify-between gap-3 font-bold">
            <span>Sensitivity</span>
            <span className="font-mono text-neutral-500">{Math.round(snapshot.sensitivity * 100)}%</span>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(snapshot.sensitivity * 100)}
            onChange={(event) => sonarAirGestures.setSensitivity(Number(event.target.value) / 100)}
            className="mt-2 w-full accent-brand"
            aria-label="Touchless gesture sensitivity"
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <OptionButton
            title="Reverse scroll direction"
            sub="Swap approaching/receding mapping."
            active={snapshot.inverted}
            onClick={() => sonarAirGestures.setInverted(!snapshot.inverted)}
            simple={S}
          />
          <OptionButton
            title="Double-air-tap reverses direction"
            sub="Two short approach pulses within ~0.6 s."
            active={snapshot.doubleTapInvert}
            onClick={() => sonarAirGestures.setDoubleTapInvert(!snapshot.doubleTapInvert)}
            simple={S}
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-neutral-600">
          <div className="font-bold text-neutral-800">How it works</div>
          <div className="mt-1">
            Panacea emits a near-ultrasonic carrier and compares energy in the upper and lower Doppler sidebands. The reflection model is{' '}
            <span className="font-mono">Δf ≈ 2vf₀/c</span>. At 0.5 m/s and this carrier, the idealized shift is about {exampleShift.toFixed(0)} Hz.
          </div>
          <div className="mt-2">
            Processing stays in this browser session; this module does not upload microphone audio. Once started, the small Air Gesture dock remains available while you navigate Panacea, including Body Explorer.
          </div>
        </div>

        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-amber-900">
          <strong>Experimental input, not a clinical sensor.</strong> Hardware filtering, room reflections and browser audio processing can make detection unreliable. The 18–20 kHz tone may still be audible to some people or animals; stop it if it causes discomfort. Do not use this as a sterile-field certification or for safety-critical clinical actions.
        </div>
      </div>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/5 p-2.5">
      <div className="uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 truncate font-mono font-bold text-neutral-800">{value}</div>
    </div>
  )
}

function OptionButton({ title, sub, active, onClick, simple: S }: {
  title: string
  sub: string
  active: boolean
  onClick: () => void
  simple: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
        active ? 'border-brand/40 bg-brand-50' : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100'
      }`}
    >
      <span className="min-w-0">
        <span className={`block font-bold ${S ? 'text-base' : 'text-xs'}`}>{title}</span>
        <span className={`mt-0.5 block text-neutral-500 ${S ? 'text-sm' : 'text-[11px]'}`}>{sub}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full ${active ? 'bg-brand' : 'bg-neutral-300'}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}
