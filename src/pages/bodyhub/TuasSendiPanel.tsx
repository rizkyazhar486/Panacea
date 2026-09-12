import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  JOINT_LEVER_DISCLOSURE, JOINT_LEVER_PRESETS, JOINT_LEVER_RANGES,
  muscleTorqueNm, solveJointLever, torqueCurve, type JointLeverPreset,
} from '../../lib/tuasSendi'

// Panel tuas sendi untuk Body Exposure.
//
// Yang diajarkan bukan rumusnya melainkan KELIPATANNYA: insersi otot duduk
// beberapa sentimeter dari sumbu sendi sementara bebannya puluhan sentimeter,
// jadi gaya otot berlipat-lipat dari beban dan reaksi sendi lebih besar lagi.
// Itu tidak bisa dibacakan; ia harus terlihat sebagai panah yang panjangnya
// berbeda dan sebagai kurva yang rebah di ujung gerak.
//
// Gambar dan angka berasal dari fungsi yang sama (`solveJointLever`,
// `torqueCurve`). Kalau keduanya punya kode sendiri-sendiri, gambarnya bisa
// berbohong sementara seluruh ujinya tetap lulus.

const W = 320
const H = 260
const PIVOT_X = 62
const PIVOT_Y = 132
const SEGMENT_PX = 118      // panjang segmen pada layar, tetap; skala cm->px ikut
const ORIGIN_PX = 92        // jarak titik asal otot di segmen proksimal

const CW = 320
const CH = 148
const CL = 34
const CB = 24

/** Ujung segmen distal pada sudut sendi. 0° = sejajar segmen proksimal
 *  (ekstensi penuh), 90° = tegak lurus, 180° = sejajar lagi (fleksi penuh). */
function arah(sudutDeg: number) {
  const t = (sudutDeg * Math.PI) / 180
  return { x: Math.sin(t), y: Math.cos(t) }
}

function Panah({ x1, y1, x2, y2, warna, lebar = 2.5 }: {
  x1: number; y1: number; x2: number; y2: number; warna: string; lebar?: number
}) {
  const dx = x2 - x1
  const dy = y2 - y1
  const panjang = Math.hypot(dx, dy) || 1
  const ux = dx / panjang
  const uy = dy / panjang
  const kepala = Math.min(9, panjang * 0.4)
  const nx = -uy
  const ny = ux
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - ux * kepala * 0.8} y2={y2 - uy * kepala * 0.8} stroke={warna} strokeWidth={lebar} strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${x2 - ux * kepala + nx * kepala * 0.42},${y2 - uy * kepala + ny * kepala * 0.42} ${x2 - ux * kepala - nx * kepala * 0.42},${y2 - uy * kepala - ny * kepala * 0.42}`}
        fill={warna}
      />
    </g>
  )
}

export function TuasSendiPanel() {
  const [preset, setPreset] = useState<JointLeverPreset>(JOINT_LEVER_PRESETS[0]!)
  const [jointAngleDeg, setJointAngleDeg] = useState<number>(JOINT_LEVER_PRESETS[0]!.jointAngleDeg)
  const [muscleInsertionCm, setMuscleInsertionCm] = useState<number>(JOINT_LEVER_PRESETS[0]!.muscleInsertionCm)
  const [loadDistanceCm, setLoadDistanceCm] = useState<number>(JOINT_LEVER_PRESETS[0]!.loadDistanceCm)
  const [loadMassKg, setLoadMassKg] = useState<number>(JOINT_LEVER_PRESETS[0]!.loadMassKg)

  const masukan = { jointAngleDeg, muscleInsertionCm, loadDistanceCm, loadMassKg }
  const hasil = useMemo(() => solveJointLever(masukan), [jointAngleDeg, muscleInsertionCm, loadDistanceCm, loadMassKg])
  const kurva = useMemo(() => torqueCurve(masukan, 181), [muscleInsertionCm, loadDistanceCm, loadMassKg])

  function pakaiPreset(p: JointLeverPreset) {
    setPreset(p)
    setJointAngleDeg(p.jointAngleDeg)
    setMuscleInsertionCm(p.muscleInsertionCm)
    setLoadDistanceCm(p.loadDistanceCm)
    setLoadMassKg(p.loadMassKg)
  }

  // --- geometri gambar ---------------------------------------------------
  const skala = SEGMENT_PX / Math.max(1, loadDistanceCm)      // px per cm
  const d = arah(jointAngleDeg)
  const ujungX = PIVOT_X + d.x * loadDistanceCm * skala
  const ujungY = PIVOT_Y + d.y * loadDistanceCm * skala
  const insersiX = PIVOT_X + d.x * muscleInsertionCm * skala
  const insersiY = PIVOT_Y + d.y * muscleInsertionCm * skala
  const asalX = PIVOT_X
  const asalY = PIVOT_Y - ORIGIN_PX

  // Panah diskalakan ke besaran: satu faktor px-per-newton dipakai oleh
  // ketiga gaya, jadi perbedaan panjangnya adalah perbedaan gaya sungguhan.
  const terbesar = hasil.feasible ? Math.max(hasil.requiredMuscleForceN, hasil.jointReactionN, hasil.loadForceN) : hasil.loadForceN
  const k = terbesar > 0 ? 74 / terbesar : 0
  const panjangOtot = hasil.feasible ? Math.max(6, hasil.requiredMuscleForceN * k) : 0
  const panjangBeban = Math.max(6, hasil.loadForceN * k)
  const panjangReaksi = hasil.feasible ? Math.max(6, hasil.jointReactionN * k) : 0

  // Arah tarikan otot: dari insersi menuju titik asal.
  const otx = asalX - insersiX
  const oty = asalY - insersiY
  const otn = Math.hypot(otx, oty) || 1
  // Beban bekerja tegak lurus segmen (asumsi model, dinyatakan di bawah).
  const bx = -d.y
  const by = d.x
  // Reaksi sendi menahan jumlah vektor otot + beban.
  const rx = -(panjangOtot ? (otx / otn) * hasil.requiredMuscleForceN : 0) - bx * hasil.loadForceN
  const ry = -(panjangOtot ? (oty / otn) * hasil.requiredMuscleForceN : 0) - by * hasil.loadForceN
  const rn = Math.hypot(rx, ry) || 1

  const torsiMaks = Math.max(...kurva.map((p) => p.torquePer100NNm), 0.001)
  const cx = (sudut: number) => CL + (sudut / 180) * (CW - CL - 10)
  const cy = (t: number) => CH - CB - (t / torsiMaks) * (CH - CB - 12)
  const jalur = kurva.map((p, i) => `${i ? 'L' : 'M'}${cx(p.angleDeg).toFixed(1)} ${cy(p.torquePer100NNm).toFixed(1)}`).join(' ')

  return (
    <div className="space-y-4">
      <Prosa>
        <h3 className="text-base font-black">Joint lever mechanics</h3>
        <p className="text-[12px] leading-relaxed">
          Most human joints are third-class levers: the muscle inserts between the joint
          axis and the load. That arrangement buys speed and range at the far end of the
          segment, and it pays for them in force. Hold a modest weight in the hand and the
          muscle develops several times that weight, while the joint surface itself carries
          more still. Move the angle and watch the effective moment arm — r · sin θ —
          collapse toward either end of the range.
        </p>
      </Prosa>

      <div className="rounded-2xl border border-brand/25 bg-brand/[0.05] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">Reference geometry</p>
        <div className="mt-2 grid gap-1.5">
          {JOINT_LEVER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pakaiPreset(p)}
              aria-pressed={preset.id === p.id}
              className={`rounded-xl p-2.5 text-left transition ${preset.id === p.id ? 'bg-white dark:bg-white/[.10]' : 'bg-white/75 hover:bg-white dark:bg-white/[.055] dark:hover:bg-white/[.09]'}`}
            >
              <div className="text-[11.5px] font-black text-ink dark:text-white">{p.label}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{p.note}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Diagram anggota gerak. Segmen benar-benar berputar mengikuti penggeser. */}
      <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Third-class lever diagram at ${jointAngleDeg} degrees. Effective moment arm ${hasil.effectiveMomentArmCm.toFixed(2)} centimetres, load arm ${loadDistanceCm} centimetres.`}
        >
          {/* Segmen proksimal, tetap. */}
          <line x1={PIVOT_X} y1={PIVOT_Y} x2={asalX} y2={asalY - 14} stroke="currentColor" className="text-neutral-400" strokeWidth={7} strokeLinecap="round" opacity={0.45} />
          {/* Busur sudut sendi. */}
          <path
            d={`M ${PIVOT_X} ${PIVOT_Y + 26} A 26 26 0 ${jointAngleDeg > 180 ? 1 : 0} 0 ${PIVOT_X + arah(jointAngleDeg).x * 26} ${PIVOT_Y + arah(jointAngleDeg).y * 26}`}
            fill="none" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.8}
          />
          {/* Segmen distal — inilah yang berputar. */}
          <line x1={PIVOT_X} y1={PIVOT_Y} x2={ujungX} y2={ujungY} stroke="currentColor" className="text-neutral-500" strokeWidth={7} strokeLinecap="round" />
          {/* Garis kerja otot. */}
          <line x1={asalX} y1={asalY} x2={insersiX} y2={insersiY} stroke="#00BF63" strokeWidth={2} strokeDasharray="4 3" opacity={0.75} />
          {/* Lengan momen efektif r_eff, tegak lurus garis kerja otot. */}
          {hasil.feasible && (
            <line
              x1={PIVOT_X} y1={PIVOT_Y}
              x2={PIVOT_X + (-(oty / otn)) * hasil.effectiveMomentArmCm * skala}
              y2={PIVOT_Y + (otx / otn) * hasil.effectiveMomentArmCm * skala}
              stroke="#F59E0B" strokeWidth={3} strokeLinecap="round"
            />
          )}

          {/* Gaya otot. */}
          {hasil.feasible && (
            <Panah x1={insersiX} y1={insersiY} x2={insersiX + (otx / otn) * panjangOtot} y2={insersiY + (oty / otn) * panjangOtot} warna="#00BF63" lebar={3} />
          )}
          {/* Beban. */}
          <Panah x1={ujungX} y1={ujungY} x2={ujungX + bx * panjangBeban} y2={ujungY + by * panjangBeban} warna="#0EA5E9" lebar={3} />
          {/* Reaksi sendi. */}
          {hasil.feasible && (
            <Panah x1={PIVOT_X} y1={PIVOT_Y} x2={PIVOT_X + (rx / rn) * panjangReaksi} y2={PIVOT_Y + (ry / rn) * panjangReaksi} warna="#EF4444" lebar={3} />
          )}

          <circle cx={PIVOT_X} cy={PIVOT_Y} r={6} fill="#EF4444" opacity={0.2} />
          <circle cx={PIVOT_X} cy={PIVOT_Y} r={3.5} fill="#EF4444" />
          <circle cx={insersiX} cy={insersiY} r={3} fill="#00BF63" />
          <circle cx={ujungX} cy={ujungY} r={4} fill="#0EA5E9" />

          <text x={W - 6} y={14} textAnchor="end" className="fill-neutral-500 text-[8px] font-bold">Muscle · Load · Joint reaction</text>
          <text x={W - 6} y={H - 6} textAnchor="end" className="fill-neutral-500 text-[8px] font-bold">Arrow length ∝ force</text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Geser label="Joint angle θ" nilai={jointAngleDeg} min={JOINT_LEVER_RANGES.jointAngleDeg.min} maks={JOINT_LEVER_RANGES.jointAngleDeg.max} onUbah={setJointAngleDeg} satuan="°" />
        <Geser label="Load mass" nilai={loadMassKg} min={JOINT_LEVER_RANGES.loadMassKg.min} maks={JOINT_LEVER_RANGES.loadMassKg.max} onUbah={setLoadMassKg} satuan="kg" />
        <Geser label="Insertion distance r" nilai={muscleInsertionCm} min={JOINT_LEVER_RANGES.muscleInsertionCm.min} maks={JOINT_LEVER_RANGES.muscleInsertionCm.max} langkah={0.5} onUbah={setMuscleInsertionCm} satuan="cm" />
        <Geser label="Load distance d" nilai={loadDistanceCm} min={JOINT_LEVER_RANGES.loadDistanceCm.min} maks={JOINT_LEVER_RANGES.loadDistanceCm.max} onUbah={setLoadDistanceCm} satuan="cm" />
      </div>

      {/* Penolakan: lengan momen nol tidak boleh dicetak sebagai angka. */}
      {!hasil.feasible ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600">No solution at this geometry</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink dark:text-white">{hasil.refusal}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Angka label="Effective moment arm" nilai={hasil.effectiveMomentArmCm.toFixed(2)} satuan="cm" />
          <Angka label="Muscle force required" nilai={hasil.requiredMuscleForceN.toFixed(0)} satuan="N" />
          <Angka label="Force multiple of load" nilai={`${hasil.forceMultiple.toFixed(1)}×`} />
          <Angka label="Joint reaction force" nilai={hasil.jointReactionN.toFixed(0)} satuan="N" />
          <Angka label="Joint reaction multiple" nilai={`${hasil.jointReactionMultiple.toFixed(1)}×`} />
          <Angka label="Mechanical advantage" nilai={hasil.mechanicalAdvantage.toFixed(3)} />
        </div>
      )}

      {hasil.feasible && (
        <p className="text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Static equilibrium: muscle torque {hasil.muscleTorqueNm.toFixed(2)} N·m balances load moment{' '}
          {hasil.loadMomentNm.toFixed(2)} N·m, so the net moment about the joint is{' '}
          {Math.abs(hasil.netMomentNm) < 1e-9 ? '0' : hasil.netMomentNm.toExponential(1)} N·m. The load weighs{' '}
          {hasil.loadForceN.toFixed(0)} N, the muscle pulls {hasil.forceMultiple.toFixed(1)} times that, and the joint
          carries {hasil.jointReactionMultiple.toFixed(1)} times it — the part that is not obvious from the weight alone.
        </p>
      )}

      {/* Kurva torsi terhadap sudut, digambar oleh fungsi yang mencetak angkanya. */}
      <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">Torque per 100 N of muscle force</p>
        <svg viewBox={`0 0 ${CW} ${CH}`} className="mt-1 w-full" role="img"
          aria-label={`Torque against joint angle. Peak at 90 degrees, zero at 0 and 180 degrees. Current angle ${jointAngleDeg} degrees.`}>
          <line x1={CL} y1={CH - CB} x2={CW - 10} y2={CH - CB} stroke="currentColor" className="text-neutral-400" strokeWidth={1} />
          <line x1={CL} y1={12} x2={CL} y2={CH - CB} stroke="currentColor" className="text-neutral-400" strokeWidth={1} />
          <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2} />
          <line x1={cx(jointAngleDeg)} y1={12} x2={cx(jointAngleDeg)} y2={CH - CB} stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 3" />
          <circle cx={cx(jointAngleDeg)} cy={cy(muscleTorqueNm(100, muscleInsertionCm, jointAngleDeg))} r={3.5} fill="#F59E0B" />
          {[0, 45, 90, 135, 180].map((t) => (
            <text key={t} x={cx(t)} y={CH - CB + 12} textAnchor="middle" className="fill-neutral-500 text-[8px] font-bold">{t}</text>
          ))}
          <text x={CL - 4} y={cy(torsiMaks) + 3} textAnchor="end" className="fill-neutral-500 text-[8px] font-bold">{torsiMaks.toFixed(1)}</text>
          <text x={CL - 4} y={CH - CB} textAnchor="end" className="fill-neutral-500 text-[8px] font-bold">0</text>
          <text x={CW - 10} y={CH - 4} textAnchor="end" className="fill-neutral-500 text-[8px] font-bold">Joint angle (°)</text>
          <text x={CL - 28} y={18} className="fill-neutral-500 text-[8px] font-bold">N·m</text>
        </svg>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          The same contraction produces the most turning effect near 90° and almost none at
          either end of the range, because the effective moment arm — not the muscle — is what
          changes.
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">What this model is, and is not</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {JOINT_LEVER_DISCLOSURE.assumptions.map((a) => <li key={a}>{a}</li>)}
          <li>{JOINT_LEVER_DISCLOSURE.provenance}</li>
          <li>{JOINT_LEVER_DISCLOSURE.boundary}</li>
        </ul>
      </div>
    </div>
  )
}

function Geser({ label, nilai, min, maks, langkah = 1, onUbah, satuan }: {
  label: string; nilai: number; min: number; maks: number; langkah?: number
  onUbah: (n: number) => void; satuan: string
}) {
  return (
    <div>
      <label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-neutral-500">{nilai}{satuan}</span>
      </label>
      <input type="range" min={min} max={maks} step={langkah} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={label} className="mt-1 w-full accent-[#00BF63]" />
    </div>
  )
}

function Angka({ nilai, satuan, label }: { nilai: string; satuan?: string; label: string }) {
  return (
    <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
      <div className="font-[var(--font-angka)] text-[18px] font-black leading-none tracking-tight">
        {nilai}{satuan && <span className="ml-1 text-[10px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
    </div>
  )
}
