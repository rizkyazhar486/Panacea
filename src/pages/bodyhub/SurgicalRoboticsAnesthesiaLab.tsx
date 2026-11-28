import { lazy, Suspense, useMemo, useState } from 'react'
import {
  ROBOTICS_ANESTHESIA_BOUNDARY,
  computeRoboticsKinematics,
  simulateAnesthesiaPhysiology,
  simulateTelesurgeryLink,
  type AnesthesiaModality,
} from '../../domains/body-exposure/engine/roboticsAnesthesiaEngine'

const SurgicalRobotics3DViewport = lazy(() => import('./SurgicalRobotics3DViewport'))
const AnesthesiaMonitorCanvas = lazy(() => import('./AnesthesiaMonitorCanvas'))

export default function SurgicalRoboticsAnesthesiaLab() {
  const [tab, setTab] = useState<'robotics' | 'distant' | 'anesthesia'>('robotics')

  // Robotics 6-DOF state
  const [pitchDeg, setPitchDeg] = useState(12)
  const [yawDeg, setYawDeg] = useState(-8)
  const [insertionMm, setInsertionMm] = useState(110)
  const [wristPitchDeg, setWristPitchDeg] = useState(20)
  const [jawOpenPct, setJawOpenPct] = useState(35)
  const [autoSuturePlaying, setAutoSuturePlaying] = useState(true)
  const [motionScale, setMotionScale] = useState<1 | 3 | 5>(3)
  const [tissueResistanceN, setTissueResistanceN] = useState(1.8)

  // Distant Telesurgery network state
  const [rttMs, setRttMs] = useState(65)
  const [jitterMs, setJitterMs] = useState(12)
  const [packetLossPct, setPacketLossPct] = useState(0.5)
  const [manualEstop, setManualEstop] = useState(false)

  // Anesthesia state
  const [modality, setModality] = useState<AnesthesiaModality>('general')
  const [depthLevel, setDepthLevel] = useState(1.0)
  const [stimulus01, setStimulus01] = useState(0.45)
  const [regionalLevel, setRegionalLevel] = useState<'brachial_plexus' | 'neuraxial_T10' | 'neuraxial_T4'>('neuraxial_T10')

  const kinematics = useMemo(
    () =>
      computeRoboticsKinematics({
        pitchDeg,
        yawDeg,
        insertionMm,
        wristPitchDeg,
        jawOpenPct,
        motionScale,
        tissueResistanceN,
      }),
    [pitchDeg, yawDeg, insertionMm, wristPitchDeg, jawOpenPct, motionScale, tissueResistanceN],
  )

  const link = useMemo(
    () =>
      simulateTelesurgeryLink({
        roundTripLatencyMs: rttMs,
        jitterMs,
        packetLossPct,
        manualEmergencyStop: manualEstop,
      }),
    [rttMs, jitterMs, packetLossPct, manualEstop],
  )

  const anesthesia = useMemo(
    () =>
      simulateAnesthesiaPhysiology({
        modality,
        depthLevel: modality === 'general' ? Math.min(2, depthLevel) : Math.min(100, depthLevel),
        surgicalStimulus01: stimulus01,
        regionalLevel,
      }),
    [modality, depthLevel, stimulus01, regionalLevel],
  )

  return (
    <section
      data-robotics-anesthesia-lab="v1"
      data-live-actuator-connected="false"
      aria-label="Surgical Robotics, Distant Telesurgery and Anesthesia Physiology Sandbox"
      className="dark space-y-3 rounded-2xl border border-emerald-400/25 bg-[#040a0e] p-3.5 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-200">
            Intervention Sandbox · Surgical Robotics · Distant Surgery · General & Local Anesthesia
          </div>
          <div className="text-[11px] text-slate-300">{ROBOTICS_ANESTHESIA_BOUNDARY.disclaimer}</div>
        </div>
        <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[9.5px] font-black text-amber-200">
          ISOLATED EDUCATIONAL SANDBOX
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 font-mono text-[10px]" role="tablist">
        {([
          ['robotics', '6-DOF Robotics & Auto-Suture'],
          ['distant', 'Distant Surgery & E-Stop'],
          ['anesthesia', 'Anesthesia (General & Local)'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-[44px] rounded-xl border px-3 font-black ${
              tab === id ? 'border-emerald-300 bg-emerald-500/20 text-white' : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'robotics' && (
        <div className="space-y-3 font-mono text-[10px]">
          <Suspense
            fallback={
              <div className="grid place-items-center rounded-2xl border border-white/10 bg-slate-950/80 text-xs font-bold text-slate-400" style={{ height: 280 }} role="status">
                Loading 3D Surgical Robotics viewport…
              </div>
            }
          >
            <SurgicalRobotics3DViewport
              mode="robotics"
              pitchDeg={pitchDeg}
              yawDeg={yawDeg}
              insertionMm={insertionMm}
              wristPitchDeg={wristPitchDeg}
              jawOpenPct={jawOpenPct}
              tissueResistanceN={tissueResistanceN}
              kinematics={kinematics}
              linkStatus={link}
              rttMs={rttMs}
              jitterMs={jitterMs}
              autoSuturePlaying={autoSuturePlaying}
            />
          </Suspense>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/80 p-3">
              <label className="flex justify-between text-cyan-200"><span>Trocar Pitch {pitchDeg}°</span><input type="range" min={-50} max={50} value={pitchDeg} onChange={(e) => setPitchDeg(Number(e.target.value))} /></label>
              <label className="flex justify-between text-cyan-200"><span>Trocar Yaw {yawDeg}°</span><input type="range" min={-60} max={60} value={yawDeg} onChange={(e) => setYawDeg(Number(e.target.value))} /></label>
              <label className="flex justify-between text-emerald-200"><span>Insertion {insertionMm} mm</span><input type="range" min={30} max={210} value={insertionMm} onChange={(e) => setInsertionMm(Number(e.target.value))} /></label>
              <label className="flex justify-between text-violet-200"><span>Endo-Wrist {wristPitchDeg}°</span><input type="range" min={-65} max={65} value={wristPitchDeg} onChange={(e) => setWristPitchDeg(Number(e.target.value))} /></label>
              <label className="flex justify-between text-cyan-100"><span>Forceps Jaw Open {jawOpenPct}%</span><input type="range" min={0} max={100} value={jawOpenPct} onChange={(e) => setJawOpenPct(Number(e.target.value))} /></label>
              <label className="flex justify-between text-amber-200"><span>Tissue Force {tissueResistanceN} N</span><input type="range" min={0.2} max={7.5} step={0.1} value={tissueResistanceN} onChange={(e) => setTissueResistanceN(Number(e.target.value))} /></label>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Scale:</span>
                  {([1, 3, 5] as const).map((sc) => (
                    <button key={sc} type="button" onClick={() => setMotionScale(sc)} className={`min-h-8 rounded-lg border px-2 font-black ${motionScale === sc ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-white/15 text-slate-400'}`}>{sc}:1</button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-pressed={autoSuturePlaying}
                  onClick={() => setAutoSuturePlaying((v) => !v)}
                  className={`min-h-[44px] rounded-xl border px-3 font-black ${
                    autoSuturePlaying ? 'border-emerald-300 bg-emerald-500/20 text-emerald-100' : 'border-white/15 text-slate-300'
                  }`}
                >
                  {autoSuturePlaying ? 'Auto-Suture Arc: LIVE' : 'Auto-Suture Arc: PAUSED'}
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/80 p-3">
              <div className="text-cyan-200 font-black">RCM End-Effector Pose (mm)</div>
              <div className="text-sm font-black text-white">
                X {kinematics.tipPositionMm.x} · Y {kinematics.tipPositionMm.y} · Z {kinematics.tipPositionMm.z}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={`rounded-full border px-2 py-0.5 ${kinematics.workspaceInBounds ? 'border-emerald-400/40 text-emerald-200' : 'border-rose-400/40 text-rose-200'}`}>
                  Workspace: {kinematics.workspaceInBounds ? 'IN BOUNDS' : 'LIMIT'}
                </span>
                <span className={`rounded-full border px-2 py-0.5 ${kinematics.forceWarning ? 'border-rose-400 bg-rose-500/20 text-rose-100' : 'border-cyan-400/35 text-cyan-200'}`}>
                  Force: {tissueResistanceN}N / {kinematics.forceLimitN}N {kinematics.forceWarning ? 'COLLISION LIMIT' : 'SAFE'}
                </span>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[9.5px] text-slate-400">Sandboxed Automated Suture Arc (8-pt educational path):</div>
                <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-emerald-200">
                  {kinematics.automatedSutureWaypoints.map((w) => (
                    <span key={w.step} className="rounded bg-emerald-500/10 px-1.5 py-0.5">P{w.step}({w.xMm},{w.yMm})</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'distant' && (
        <div className="space-y-3 font-mono text-[10px]">
          <Suspense
            fallback={
              <div className="grid place-items-center rounded-2xl border border-white/10 bg-slate-950/80 text-xs font-bold text-slate-400" style={{ height: 280 }} role="status">
                Loading 3D Tele-Robotic Twin viewport…
              </div>
            }
          >
            <SurgicalRobotics3DViewport
              mode="distant"
              pitchDeg={pitchDeg}
              yawDeg={yawDeg}
              insertionMm={insertionMm}
              wristPitchDeg={wristPitchDeg}
              jawOpenPct={jawOpenPct}
              tissueResistanceN={tissueResistanceN}
              kinematics={kinematics}
              linkStatus={link}
              rttMs={rttMs}
              jitterMs={jitterMs}
              autoSuturePlaying={autoSuturePlaying}
            />
          </Suspense>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/80 p-3">
              <label className="flex justify-between text-cyan-200"><span>Round-Trip Latency {rttMs} ms</span><input type="range" min={10} max={550} step={5} value={rttMs} onChange={(e) => setRttMs(Number(e.target.value))} /></label>
              <label className="flex justify-between text-amber-200"><span>Jitter {jitterMs} ms</span><input type="range" min={0} max={80} value={jitterMs} onChange={(e) => setJitterMs(Number(e.target.value))} /></label>
              <label className="flex justify-between text-rose-200"><span>Packet Loss {packetLossPct}%</span><input type="range" min={0} max={15} step={0.5} value={packetLossPct} onChange={(e) => setPacketLossPct(Number(e.target.value))} /></label>
              <button type="button" onClick={() => setManualEstop((v) => !v)} className={`mt-1 min-h-[44px] w-full rounded-xl border font-black ${manualEstop ? 'border-rose-400 bg-rose-600/35 text-white' : 'border-amber-300/40 bg-amber-500/15 text-amber-100'}`}>
                {manualEstop ? 'RELEASE VIRTUAL E-STOP' : 'ENGAGE VIRTUAL EMERGENCY STOP'}
              </button>
            </div>
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/80 p-3">
              <div className={`inline-block rounded-full border px-2.5 py-0.5 font-black ${link.state === 'SAFE_HOLD_ESTOP' ? 'border-rose-400 bg-rose-500/20 text-rose-100' : link.state === 'DEGRADED_CAUTION' ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-emerald-400 bg-emerald-500/20 text-emerald-100'}`}>
                LINK STATUS: {link.state}
              </div>
              <div className="text-sm font-black text-white">Tracking Lag: {link.estimatedTrackingLagMm} mm</div>
              <p className="font-sans text-xs text-slate-300">{link.reason}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'anesthesia' && (
        <div className="space-y-2.5 font-mono text-[10px]">
          <Suspense
            fallback={
              <div className="grid place-items-center rounded-2xl border border-white/10 bg-slate-950/80 text-xs font-bold text-slate-400" style={{ height: 220 }} role="status">
                Loading OR Monitor…
              </div>
            }
          >
            <AnesthesiaMonitorCanvas frame={anesthesia} regionalLevel={regionalLevel} />
          </Suspense>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setModality('general'); setDepthLevel(1.0) }}
              aria-pressed={modality === 'general'}
              className={`min-h-[44px] rounded-lg border px-3 font-black ${modality === 'general' ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-white/10 text-slate-400'}`}
            >
              General Anesthesia (MAC)
            </button>
            <button
              type="button"
              onClick={() => { setModality('local_regional'); setDepthLevel(75) }}
              aria-pressed={modality === 'local_regional'}
              className={`min-h-[44px] rounded-lg border px-3 font-black ${modality === 'local_regional' ? 'border-emerald-300 bg-emerald-500/20 text-white' : 'border-white/10 text-slate-400'}`}
            >
              Local / Regional / Neuraxial
            </button>
            {modality === 'local_regional' && (
              <select
                value={regionalLevel}
                onChange={(e) => setRegionalLevel(e.target.value as 'brachial_plexus' | 'neuraxial_T10' | 'neuraxial_T4')}
                aria-label="Regional block level"
                className="min-h-[44px] rounded-lg border border-white/15 bg-slate-900 px-2 text-white"
              >
                <option value="brachial_plexus">Brachial Plexus (Peripheral)</option>
                <option value="neuraxial_T10">Neuraxial T10 (Lower Abdomen)</option>
                <option value="neuraxial_T4">Neuraxial T4 (High Thoracic)</option>
              </select>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-2.5 text-cyan-200">
              <span>{modality === 'general' ? `Conceptual MAC Depth: ${depthLevel.toFixed(1)}` : `Na⁺ Channel Blockade: ${Math.round(depthLevel)}%`}</span>
              <input
                type="range"
                min={0}
                max={modality === 'general' ? 2.0 : 100}
                step={modality === 'general' ? 0.1 : 5}
                value={depthLevel}
                onChange={(e) => setDepthLevel(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-2.5 text-amber-200">
              <span>Surgical Stimulus: {Math.round(stimulus01 * 100)}%</span>
              <input type="range" min={0} max={1} step={0.05} value={stimulus01} onChange={(e) => setStimulus01(Number(e.target.value))} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2"><div className="text-slate-400">MAP / HR</div><div className="font-black text-rose-200">{anesthesia.mapMmHg} mmHg · {anesthesia.hrBpm}</div></div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2"><div className="text-slate-400">SpO₂ / ETCO₂</div><div className="font-black text-cyan-200">{anesthesia.spo2Pct}% · {anesthesia.etco2MmHg}</div></div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2"><div className="text-slate-400">BIS / TOF</div><div className="font-black text-violet-200">{anesthesia.conceptualBisIndex} · {anesthesia.tofRatioPct}%</div></div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2"><div className="text-slate-400">C-PAIN / MOTOR</div><div className="font-black text-emerald-200">{anesthesia.fiberBlockade.cFiberPainPct}% / {anesthesia.fiberBlockade.aAlphaMotorPct}%</div></div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2"><div className="text-slate-400">AIRWAY</div><div className="truncate font-black text-amber-200">{anesthesia.airwayReflex}</div></div>
          </div>

          {anesthesia.warningFlag && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-950/35 px-2.5 py-1.5 text-rose-100">
              {anesthesia.warningFlag}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
