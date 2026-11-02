import React, { useState, useMemo } from 'react'
import type { TeachableFigureDef } from '../engine/teachableFigureEngine.ts'
import { TEACHABLE_FIGURE_DISCLAIMER } from '../engine/teachableFigureEngine.ts'

interface Props {
  figure: TeachableFigureDef<any, any>
  onClose?: () => void
}

export function TeachableFigureInteractiveView({ figure, onClose }: Props) {
  // Step 1: Predict hypothesis commitment
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null)
  const [hasCommittedPrediction, setHasCommittedPrediction] = useState(false)

  // Step 2: Parameter controls
  const [params, setParams] = useState<Record<string, number>>(() => ({ ...figure.defaultParams }))

  // Compute simulation output
  const simResult = useMemo(() => figure.simulate(params), [figure, params])

  const chosenPrediction = figure.predictionQuestion.choices.find((c) => c.id === selectedPredictionId)

  function handleSliderChange(controlId: string, val: number) {
    setParams((prev) => ({ ...prev, [controlId]: val }))
  }

  function handleReset() {
    setParams({ ...figure.defaultParams })
  }

  return (
    <div className="flex flex-col space-y-5 rounded-2xl border border-emerald-500/20 bg-slate-900/95 p-5 text-slate-100 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
              TEACHABLE FIGURE • PREDICT → TRY → EXPLAIN
            </span>
            <span className="text-[11px] text-slate-400">ID: {figure.id}</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-100 sm:text-xl">{figure.title}</h2>
          <p className="mt-1 text-xs text-slate-400">{figure.description}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Close ✕
          </button>
        )}
      </div>

      {/* STEP 1: PREDICT (Hypothesis Commitment) */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <span>Step 1: Commit Your Prediction</span>
          {hasCommittedPrediction && (
            <span className="rounded bg-amber-500/30 px-2 py-0.5 text-[10px] text-amber-200">Committed</span>
          )}
        </div>
        <p className="mt-1 text-sm font-medium text-slate-200">{figure.predictionQuestion.stem}</p>

        <div className="mt-3 space-y-2">
          {figure.predictionQuestion.choices.map((choice) => {
            const isSelected = selectedPredictionId === choice.id
            return (
              <button
                key={choice.id}
                disabled={hasCommittedPrediction}
                onClick={() => setSelectedPredictionId(choice.id)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-xs transition-colors ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 text-amber-100 font-semibold'
                    : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                } ${hasCommittedPrediction ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border border-current text-center text-[10px] leading-4">
                  {isSelected ? '●' : '○'}
                </span>
                <span>{choice.label}</span>
              </button>
            )
          })}
        </div>

        {!hasCommittedPrediction && (
          <div className="mt-3 flex justify-end">
            <button
              disabled={!selectedPredictionId}
              onClick={() => setHasCommittedPrediction(true)}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-opacity hover:bg-amber-400 disabled:opacity-40"
            >
              Confirm Prediction & Unlock Causal Sliders →
            </button>
          </div>
        )}
      </div>

      {/* STEP 2: TRY (Causal Parameter Sliders & Live Physics Simulation) */}
      <div
        className={`transition-opacity duration-300 ${
          hasCommittedPrediction ? 'opacity-100' : 'pointer-events-none opacity-40 blur-[1px]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Step 2: Try & Perturb Causal Variables
          </span>
          <button
            onClick={handleReset}
            className="text-[11px] text-slate-400 underline hover:text-slate-200"
          >
            Reset Defaults
          </button>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {figure.controls.map((ctrl) => {
            const val = params[ctrl.id] ?? ctrl.defaultValue
            return (
              <div key={ctrl.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex justify-between text-xs font-medium">
                  <label htmlFor={ctrl.id} className="text-slate-300">
                    {ctrl.label}
                  </label>
                  <span className="font-mono font-bold text-emerald-400">
                    {val} {ctrl.unit}
                  </span>
                </div>
                <input
                  id={ctrl.id}
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step}
                  value={val}
                  onChange={(e) => handleSliderChange(ctrl.id, parseFloat(e.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer accent-emerald-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">{ctrl.description}</p>
              </div>
            )
          })}
        </div>

        {/* Live Simulation Readout Cards */}
        {simResult.ok && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Live Biophysical Response:
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(simResult.outputs).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-900 border border-slate-800 p-2.5">
                  <div className="text-[10px] font-mono uppercase text-slate-500">{k}</div>
                  <div className="mt-0.5 text-sm font-mono font-bold text-emerald-300 truncate">
                    {typeof v === 'number' ? v : String(v)}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded bg-slate-900/60 p-2 text-xs leading-relaxed text-slate-300 font-mono">
              💡 {simResult.narrative}
            </p>
          </div>
        )}
      </div>

      {/* STEP 3: EXPLAIN (Debrief & Source Citations) */}
      {hasCommittedPrediction && chosenPrediction && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span>Step 3: Explain & Reconcile Misconception</span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                chosenPrediction.isAccurate
                  ? 'bg-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/30 text-rose-300'
              }`}
            >
              {chosenPrediction.isAccurate ? '✓ Prediction Supported' : '✕ Misconception Identified'}
            </span>
          </div>

          <div className="mt-2 space-y-2 text-xs text-slate-300">
            <p className="font-semibold text-slate-200">
              Your prediction: "{chosenPrediction.label}"
            </p>
            <p className="rounded bg-slate-900/70 p-3 leading-relaxed border border-slate-800">
              {chosenPrediction.rationale}
            </p>
            <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-400">
              <span className="font-bold text-slate-300">Underlying Mechanism: </span>
              {figure.coreMisconception}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Disclaimer */}
      <div className="rounded border border-slate-800 bg-slate-950/40 p-2 text-[10px] text-slate-500 text-center font-mono">
        ⚠ {TEACHABLE_FIGURE_DISCLAIMER}
      </div>
    </div>
  )
}
