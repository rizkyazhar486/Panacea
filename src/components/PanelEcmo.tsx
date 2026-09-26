import { useMemo, useRef, useState } from 'react'
import {
  simulasiVV, simulasiVA, jelaskanVV, jelaskanVA, CABANG_AORTA, BELUM_VA,
  type MasukanVV, type MasukanVA, type LangkahSebab,
} from '../lib/ecmo/mesin'
import { MODEL, BUKTI } from '../lib/ecmo/bukti'
import { simulasiSirkulasi, jelaskanHemodinamik, SKENARIO_SYOK_KARDIOGENIK, SIRKULASI_NORMAL, type ParameterSirkulasi, type HasilSirkulasi } from '../lib/ecmo/sirkulasi'

// Kembaran digital ECMO (edukasi). Panel ini hanya MEMBACA keadaan mesin:
// tidak ada angka yang ditulis langsung, warna darah = pemetaan saturasi terhitung.

type Mode = 'VV' | 'VA'

const VV0: MasukanVV = { co: 7.5, qEcmo: 4, jarakKanulaCm: 15, hb: 10, vo2: 320, shunt: 0.9, fio2: 0.3, va: 1, hco3: 26, fdo2: 1, sweep: 3, fungsiMembran: 1 }
const VA0: MasukanVA = { qLv: 0.5, qEcmo: 4, hb: 12, vo2: 250, shunt: 0.8, fio2: 0.4, va: 3, hco3: 24, fdo2: 1, sweep: 3, fungsiMembran: 1 }

/** Pemetaan saturasi terhitung → warna darah (0.5 gelap → 1.0 merah terang). */
function warnaDarah(s: number): string {
  const t = Math.max(0, Math.min(1, (s - 0.5) / 0.5))
  const r = Math.round(95 + t * 130), g = Math.round(18 + t * 22), b = Math.round(48 - t * 8)
  return `rgb(${r},${g},${b})`
}
const pct = (s: number) => (Number.isFinite(s) ? `${Math.round(s * 100)}%` : '—')
const n0 = (x: number, d = 0) => (Number.isFinite(x) ? x.toFixed(d) : '—')

interface Kendali<T> { k: keyof T; label: string; min: number; max: number; step: number; unit: string }
const KENDALI_VV: Kendali<MasukanVV>[] = [
  { k: 'qEcmo', label: 'Pump flow', min: 0, max: 7, step: 0.1, unit: 'L/min' },
  { k: 'sweep', label: 'Sweep gas', min: 0, max: 10, step: 0.5, unit: 'L/min' },
  { k: 'fdo2', label: 'FdO₂', min: 0.21, max: 1, step: 0.01, unit: '' },
  { k: 'co', label: 'Patient cardiac output', min: 2, max: 12, step: 0.1, unit: 'L/min' },
  { k: 'jarakKanulaCm', label: 'Drainage–return distance', min: 1, max: 30, step: 0.5, unit: 'cm' },
  { k: 'hb', label: 'Hemoglobin', min: 6, max: 16, step: 0.1, unit: 'g/dL' },
  { k: 'vo2', label: 'VO₂', min: 120, max: 450, step: 5, unit: 'mL/min' },
  { k: 'shunt', label: 'Native lung shunt', min: 0, max: 1, step: 0.01, unit: '' },
  { k: 'fungsiMembran', label: 'Membrane function', min: 0.05, max: 1, step: 0.01, unit: '' },
]
// VA: aliran LV asli dan aliran ECMO BUKAN penggeser; keduanya keluaran sirkulasi.
interface KendaliHemo { id: 'ees' | 'rpm' | 'volume' | 'svr'; label: string; min: number; max: number; step: number; unit: string }
const KENDALI_HEMO: KendaliHemo[] = [
  { id: 'ees', label: 'LV contractility (% of normal)', min: 10, max: 100, step: 5, unit: '%' },
  { id: 'rpm', label: 'Pump speed', min: 0, max: 5000, step: 100, unit: 'rpm' },
  { id: 'volume', label: 'Blood volume', min: 4500, max: 6000, step: 50, unit: 'mL' },
  { id: 'svr', label: 'SVR', min: 0.6, max: 2, step: 0.05, unit: 'mmHg·s/mL' },
]
const HEMO0: ParameterSirkulasi = { ...SKENARIO_SYOK_KARDIOGENIK, ecmo: { konfigurasi: 'VA-perifer', rpm: 3500 } }
const nilaiHemo = (p: ParameterSirkulasi, id: KendaliHemo['id']) => id === 'ees' ? Math.round((p.lv.ees / SIRKULASI_NORMAL.lv.ees) * 100) : id === 'rpm' ? p.ecmo.rpm : id === 'volume' ? p.volumeDarah : p.svr
const terapkanHemo = (p: ParameterSirkulasi, id: KendaliHemo['id'], v: number): ParameterSirkulasi =>
  id === 'ees' ? { ...p, lv: { ...p.lv, ees: (SIRKULASI_NORMAL.lv.ees * v) / 100 } } : id === 'rpm' ? { ...p, ecmo: { ...p.ecmo, rpm: v } } : id === 'volume' ? { ...p, volumeDarah: v } : { ...p, svr: v }

const KENDALI_VA: Kendali<MasukanVA>[] = [
  { k: 'shunt', label: 'Native lung shunt', min: 0, max: 1, step: 0.01, unit: '' },
  { k: 'fio2', label: 'Ventilator FiO₂', min: 0.21, max: 1, step: 0.01, unit: '' },
  { k: 'sweep', label: 'Sweep gas', min: 0, max: 10, step: 0.5, unit: 'L/min' },
  { k: 'hb', label: 'Hemoglobin', min: 6, max: 16, step: 0.1, unit: 'g/dL' },
]

function Penggeser({ d, nilai, ubah }: { d: { label: string; min: number; max: number; step: number; unit: string }; nilai: number; ubah: (v: number) => void }) {
  return (
    <label className="block text-[12px]">
      <span className="flex justify-between font-bold text-neutral-300"><span>{d.label}</span><span className="tabular-nums">{nilai.toFixed(d.step < 0.1 ? 2 : 1)} {d.unit}</span></span>
      <input type="range" min={d.min} max={d.max} step={d.step} value={nilai} onChange={(e) => ubah(Number(e.target.value))}
        aria-label={d.label} className="mt-1 h-8 w-full accent-rose-500" />
    </label>
  )
}

function Angka({ label, nilai, id }: { label: string; nilai: string; id?: string }) {
  return <div className="rounded-lg bg-white/5 px-2 py-1.5" data-ecmo-angka={id}><div className="text-[10px] uppercase text-neutral-400">{label}</div><div className="text-base font-black tabular-nums" style={{ color: '#f8fafc' }}>{nilai}</div></div>
}

function Sirkuit({ sPre, sPost, sArteri, sVena }: { sPre: number; sPost: number; sArteri: number; sVena: number }) {
  return (
    <svg viewBox="0 0 320 120" className="w-full" role="img" aria-label="ECMO circuit coloured by calculated saturation">
      <path d="M40 90 C40 110 90 110 110 100" stroke={warnaDarah(sPre)} strokeWidth="7" fill="none" />
      <circle cx="130" cy="95" r="16" fill="#1f2937" stroke={warnaDarah(sPre)} strokeWidth="4" /><text x="130" y="99" fontSize="9" fill="#e5e7eb" textAnchor="middle">pump</text>
      <path d="M146 95 L190 95" stroke={warnaDarah(sPre)} strokeWidth="7" />
      <rect x="190" y="80" width="40" height="30" rx="6" fill="#1f2937" stroke="#9ca3af" /><text x="210" y="99" fontSize="9" fill="#e5e7eb" textAnchor="middle">lung</text>
      <path d="M230 95 C290 95 290 30 240 30" stroke={warnaDarah(sPost)} strokeWidth="7" fill="none" />
      <ellipse cx="60" cy="50" rx="44" ry="34" fill="#111827" stroke="#374151" />
      <path d="M100 38 C80 30 60 30 40 45" stroke={warnaDarah(sArteri)} strokeWidth="6" fill="none" />
      <path d="M40 60 C60 75 80 75 100 62" stroke={warnaDarah(sVena)} strokeWidth="6" fill="none" />
      <path d="M240 30 L104 38" stroke={warnaDarah(sPost)} strokeWidth="5" strokeDasharray="4 3" />
      <text x="60" y="54" fontSize="9" fill="#9ca3af" textAnchor="middle">patient</text>
      <text x="262" y="20" fontSize="9" fill="#e5e7eb">{pct(sPost)}</text>
      <text x="96" y="118" fontSize="9" fill="#e5e7eb">pre {pct(sPre)}</text>
    </svg>
  )
}

function Aorta({ keadaan }: { keadaan: ReturnType<typeof simulasiVA> }) {
  const tinggi = 26
  return (
    <svg viewBox={`0 0 320 ${CABANG_AORTA.length * tinggi + 10}`} className="w-full" role="img" aria-label="Aortic branches coloured by calculated saturation, with the mixing point">
      {keadaan.cabang.map((c, i) => {
        const def = CABANG_AORTA[i], y = 8 + i * tinggi
        return (
          <g key={c.id}>
            <rect x="8" y={y} width="34" height={tinggi - 4} rx="4" fill={warnaDarah(c.saturasi)} />
            <text x="50" y={y + 15} fontSize="11" fill="#e5e7eb">{def.nama}</text>
            <text x="312" y={y + 15} fontSize="11" fill="#fff" textAnchor="end" fontWeight="bold">{pct(c.saturasi)}</text>
            {keadaan.titikCampur === c.id && <line x1="4" x2="46" y1={y + tinggi / 2 - 2} y2={y + tinggi / 2 - 2} stroke="#facc15" strokeWidth="2" strokeDasharray="3 2" />}
          </g>
        )
      })}
    </svg>
  )
}

function Lingkar({ h }: { h: HasilSirkulasi }) {
  if (!h.sah || h.lingkarLV.length < 3) return null
  const W = 150, H = 110, vMax = 220, pMax = 140
  const x = (v: number) => 8 + (v / vMax) * (W - 12), y = (p: number) => H - 8 - (Math.min(p, pMax) / pMax) * (H - 14)
  const d = h.lingkarLV.map((t, i) => `${i ? 'L' : 'M'}${x(t.v).toFixed(1)} ${y(t.p).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Left ventricular pressure-volume loop from the simulation">
      <path d={d} fill="none" stroke="#fb7185" strokeWidth="1.8" />
      <text x="6" y="10" fontSize="8" fill="#9ca3af">LV P–V (mmHg / mL)</text>
    </svg>
  )
}
function Gelombang({ h }: { h: HasilSirkulasi }) {
  if (!h.sah || h.gelombangArteri.length < 3) return null
  const W = 150, H = 110, n = h.gelombangArteri.length
  const x = (i: number) => 4 + (i / (n - 1)) * (W - 8), y = (p: number) => H - 8 - (Math.min(p, 140) / 140) * (H - 14)
  const d = h.gelombangArteri.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Aortic pressure over one beat from the simulation">
      <path d={d} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
      <text x="6" y="10" fontSize="8" fill="#9ca3af">Aortic pressure, 1 beat</text>
    </svg>
  )
}

function Mengapa({ langkah }: { langkah: LangkahSebab[] }) {
  if (!langkah.length) return <p className="text-[12px] text-neutral-400">Move a control to see the causal chain computed from the state change.</p>
  return (
    <ol className="space-y-0.5 text-[12px]" data-ecmo-mengapa>
      {langkah.map((l, i) => (
        <li key={i} className="flex justify-between gap-2 text-neutral-200"><span>{i > 0 ? '→ ' : ''}{l.besaran}</span><span className="ml-2 shrink-0 whitespace-nowrap tabular-nums text-neutral-400">{' '}{l.dari} → {l.ke} {l.satuan}</span></li>
      ))}
    </ol>
  )
}

export function PanelEcmo() {
  const [mode, setMode] = useState<Mode>('VV')
  const [vv, setVv] = useState(VV0)
  const [va, setVa] = useState(VA0)
  const [hemo, setHemo] = useState<ParameterSirkulasi>(HEMO0)
  const sebelumHemo = useRef<ParameterSirkulasi>(HEMO0)
  const sebelumVv = useRef<MasukanVV>(VV0)
  const sebelumVa = useRef<MasukanVA>(VA0)
  const [trace, setTrace] = useState<LangkahSebab[]>([])
  const kVv = useMemo(() => simulasiVV(vv), [vv])
  const kHemo = useMemo(() => simulasiSirkulasi(hemo), [hemo])
  // Oksigenasi VA dihitung dari aliran yang DIHASILKAN sirkulasi, bukan penggeser.
  const vaTurunan = (m: MasukanVA, h: HasilSirkulasi): MasukanVA => ({ ...m, qLv: h.sah ? h.coAsli : 0, qEcmo: h.sah ? Math.max(h.qEcmo, 0.01) : 0.01 })
  const kVa = useMemo(() => simulasiVA(vaTurunan(va, kHemo)), [va, kHemo])

  const ubahVv = (k: keyof MasukanVV, v: number) => { const baru = { ...vv, [k]: v }; setTrace(jelaskanVV(sebelumVv.current, simulasiVV(sebelumVv.current), baru, simulasiVV(baru))); setVv(baru) }
  const ubahVa = (k: keyof MasukanVA, v: number) => {
    const baru = { ...va, [k]: v }, a = vaTurunan(sebelumVa.current, kHemo), b = vaTurunan(baru, kHemo)
    setTrace(jelaskanVA(a, simulasiVA(a), b, simulasiVA(b))); setVa(baru)
  }
  const ubahHemo = (id: KendaliHemo['id'], v: number) => {
    const baru = terapkanHemo(hemo, id, v), hA = simulasiSirkulasi(sebelumHemo.current), hB = simulasiSirkulasi(baru)
    const a = vaTurunan(va, hA), b = vaTurunan(va, hB)
    setTrace([...jelaskanHemodinamik(sebelumHemo.current, hA, baru, hB), ...jelaskanVA(a, simulasiVA(a), b, simulasiVA(b)).filter((l) => l.besaran !== 'Native LV output' && l.besaran !== 'ECMO flow')])
    setHemo(baru)
  }
  const tandai = () => { sebelumVv.current = vv; sebelumVa.current = va; sebelumHemo.current = hemo }

  const status = mode === 'VV' ? kVv.status : kVa.status
  return (
    <section data-ecmo className="space-y-3 rounded-2xl bg-neutral-950 p-3 text-white" aria-label="ECMO digital twin">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black">ECMO digital twin</h3>
        <span className="sr-only">Mode</span>
        <div className="flex gap-1" role="tablist">
          {(['VV', 'VA'] as Mode[]).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} aria-label={m === 'VA' ? 'Peripheral VA' : 'VV'} onClick={() => { setMode(m); setTrace([]) }}
              className={`min-h-10 min-w-12 shrink-0 rounded-full px-3 text-[12px] font-black ${mode === m ? 'bg-rose-600' : 'bg-white/10'}`}>{m}</button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-neutral-400">SIMULATED steady state for teaching — evidence-informed and aligned with published ELSO guidance, not endorsed by ELSO, not for patient management.</p>
      {status !== 'tunak' && <p role="alert" className="rounded-lg bg-amber-500/15 p-2 text-[12px] font-bold text-amber-300" data-ecmo-status>{status === 'pasokan-o2-tak-cukup' ? 'No steady state: O₂ consumption exceeds what this circulation can deliver.' : status === 'aliran-drainase-terbatas' ? 'Drainage-limited: effective ECMO flow capped at the venous return.' : 'Inputs out of range.'}</p>}

      {mode === 'VV' ? (
        <>
          <Sirkuit sPre={kVv.sPre} sPost={kVv.sPost} sArteri={kVv.sao2} sVena={kVv.svo2} />
          <div className="grid grid-cols-3 gap-1.5">
            <Angka id="sao2" label="SaO₂" nilai={pct(kVv.sao2)} />
            <Angka label="PaCO₂" nilai={`${n0(kVv.co2.paco2)} mmHg`} />
            <Angka label="pH" nilai={n0(kVv.co2.ph, 2)} />
            <Angka id="resirkulasi" label="Recirculation" nilai={pct(kVv.resirkulasi)} />
            <Angka label="Eff. flow / CO" nilai={pct(kVv.rasioEfektifTerhadapCO)} />
            <Angka label="SvO₂" nilai={pct(kVv.svo2)} />
            <Angka label="DO₂" nilai={`${n0(kVv.do2)} mL/min`} />
            <Angka label="DO₂ : VO₂" nilai={`${n0(kVv.do2PerVo2, 1)} : 1`} />
            <Angka label="ECMO O₂ transfer" nilai={`${n0(kVv.vo2Ecmo)} mL/min`} />
          </div>
          <div className="space-y-1.5" onPointerDown={tandai} onKeyDown={tandai}>
            {KENDALI_VV.map((d) => <Penggeser key={String(d.k)} d={d} nilai={vv[d.k] as number} ubah={(v) => ubahVv(d.k, v)} />)}
          </div>
        </>
      ) : (
        <>
          <Aorta keadaan={kVa} />
          <div className="grid grid-cols-2 gap-2"><Lingkar h={kHemo} /><Gelombang h={kHemo} /></div>
          {!kHemo.sah && <p role="alert" className="text-[12px] font-bold text-amber-300">Circulation model rejected these inputs: {kHemo.alasan}</p>}
          <div className="grid grid-cols-3 gap-1.5">
            <Angka id="radial-kanan" label="Right radial SO₂" nilai={pct(kVa.cabang.find((c) => c.id === 'brakiosefal')?.saturasi ?? NaN)} />
            <Angka label="Coronary SO₂" nilai={pct(kVa.cabang.find((c) => c.id === 'koroner')?.saturasi ?? NaN)} />
            <Angka label="Femoral SO₂" nilai={pct(kVa.cabang.find((c) => c.id === 'iliaka')?.saturasi ?? NaN)} />
            <Angka id="map" label="MAP" nilai={`${n0(kHemo.map)} mmHg`} />
            <Angka id="pp" label="Pulse pressure" nilai={`${n0(kHemo.pulsePressure)} mmHg`} />
            <Angka id="pcwp" label="PCWP" nilai={`${n0(kHemo.pcwp)} mmHg`} />
            <Angka id="qecmo" label="ECMO flow" nilai={`${n0(kHemo.qEcmo, 1)} L/min`} />
            <Angka id="colv" label="Native LV output" nilai={`${n0(kHemo.coAsli, 1)} L/min`} />
            <Angka label="LVEDV / ESV" nilai={`${n0(kHemo.lvedv)} / ${n0(kHemo.lvesv)}`} />
            <Angka label="DO₂" nilai={`${n0(kVa.do2)} mL/min`} />
            <Angka label="SvO₂" nilai={pct(kVa.svo2)} />
          </div>
          <div className="space-y-1.5" onPointerDown={tandai} onKeyDown={tandai}>
            {KENDALI_HEMO.map((d) => <Penggeser key={d.id} d={d} nilai={nilaiHemo(hemo, d.id)} ubah={(v) => ubahHemo(d.id, v)} />)}
            {KENDALI_VA.map((d) => <Penggeser key={String(d.k)} d={d} nilai={va[d.k] as number} ubah={(v) => ubahVa(d.k, v)} />)}
          </div>
        </>
      )}

      <div className="rounded-xl bg-white/5 p-2.5">
        <h4 className="mb-1 text-[11px] font-black uppercase text-neutral-400">Why did that change?</h4>
        <Mengapa langkah={trace} />
      </div>

      <details className="text-[12px]">
        <summary className="min-h-10 cursor-pointer font-bold text-neutral-300">Not yet simulated</summary>
        <ul className="mt-1 list-disc pl-5 text-neutral-400">{[...BELUM_VA, 'ECG, CVP waveform and heart-rate effects on ECMO flow', 'Organ time constants (renal, hepatic, brain injury)', 'Cannulation, ultrasound and ICU scene', 'Anticoagulation, hemolysis and circuit crises'].map((t) => <li key={t}>{t}</li>)}</ul>
      </details>
      <details className="text-[12px]">
        <summary className="min-h-10 cursor-pointer font-bold text-neutral-300">Scientific basis</summary>
        <ul className="mt-1 space-y-1.5">
          {Object.values(MODEL).map((m) => (
            <li key={m.id} className="text-neutral-300"><span className="font-bold">{m.nama}</span> <code className="text-[11px] text-neutral-400">{m.persamaan}</code>
              <div className="text-[11px] text-neutral-500">status: {m.status}{m.bukti.map((id) => ` · ${BUKTI[id].sitasi}`).join('')}</div></li>
          ))}
        </ul>
      </details>
    </section>
  )
}

export default PanelEcmo
