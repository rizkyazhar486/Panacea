import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  simulasiVV, simulasiVA, jelaskanVV, jelaskanVA, CABANG_AORTA, BELUM_VA,
  type MasukanVV, type MasukanVA, type LangkahSebab,
} from '../lib/ecmo/mesin'
import { MODEL, BUKTI } from '../lib/ecmo/bukti'
import { Prosa } from './Prosa'
import { skalaPresentasi, LEBAR_PANEL_PRESENTASI } from '../lib/ecmo/presentasi'
import { mekanikaVentilator, VENTILATOR_ISTIRAHAT, type PengaturanVentilator } from '../lib/ecmo/ventilator'
import { nilaiWeaningVV } from '../lib/ecmo/weaningVV'
import { ujiPenurunanAliranVA, OPSI_WEANING_VA } from '../lib/ecmo/weaningVA'
import { bangunEcho, indeksBingkai } from '../lib/ecmo/echo'
import { SKENARIO_VV, DASAR_VV, jalankanVV, petunjukVV, type HasilVV } from '../lib/ecmo/skenario'
import { SKENARIO, DASAR, jalankan, petunjuk, type KeadaanSkenario, type HasilGabungan, type Petunjuk } from '../lib/ecmo/skenario'
import { keadaanOrganVA, keadaanTungkai, kreatininSetelah } from '../lib/ecmo/organ'
import { simulasiSirkulasi, trombosisOksigenator, jelaskanHemodinamik, SKENARIO_SYOK_KARDIOGENIK, SIRKULASI_NORMAL, type ParameterSirkulasi, type HasilSirkulasi } from '../lib/ecmo/sirkulasi'

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
  { k: 'sweep', label: 'Sweep gas', min: 0, max: 10, step: 0.5, unit: 'L/min' },
  { k: 'fdo2', label: 'FdO₂', min: 0.21, max: 1, step: 0.01, unit: '' },
  { k: 'jarakKanulaCm', label: 'Drainage–return distance', min: 1, max: 30, step: 0.5, unit: 'cm' },
  { k: 'hb', label: 'Hemoglobin', min: 6, max: 16, step: 0.1, unit: 'g/dL' },
  { k: 'vo2', label: 'VO₂', min: 120, max: 450, step: 5, unit: 'mL/min' },
  { k: 'shunt', label: 'Native lung shunt', min: 0, max: 1, step: 0.01, unit: '' },
  { k: 'fungsiMembran', label: 'Membrane function', min: 0.05, max: 1, step: 0.01, unit: '' },
  { k: 'fio2', label: 'Ventilator FiO₂', min: 0.21, max: 1, step: 0.01, unit: '' },
]
// VA: aliran LV asli dan aliran ECMO BUKAN penggeser; keduanya keluaran sirkulasi.
interface KendaliHemo { id: 'ees' | 'rpm' | 'volume' | 'svr'; label: string; min: number; max: number; step: number; unit: string }
const KENDALI_HEMO: KendaliHemo[] = [
  { id: 'ees', label: 'LV contractility (% of normal)', min: 15, max: 100, step: 5, unit: '%' },
  { id: 'rpm', label: 'Pump speed', min: 0, max: 5000, step: 100, unit: 'rpm' },
  { id: 'volume', label: 'Blood volume', min: 4500, max: 6000, step: 50, unit: 'mL' },
  { id: 'svr', label: 'SVR', min: 0.6, max: 2, step: 0.05, unit: 'mmHg·s/mL' },
]
const HEMO0: ParameterSirkulasi = { ...SKENARIO_SYOK_KARDIOGENIK, ecmo: { konfigurasi: 'VA-perifer', rpm: 3500 } }
// VV: pasien hiperdinamik (takikardia, vasodilatasi) yang lazim pada ARDS; nilai ilustratif.
const HEMO_VV0: ParameterSirkulasi = { ...SIRKULASI_NORMAL, hr: 110, svr: 0.7, ecmo: { konfigurasi: 'VV', rpm: 3500 } }
type KendaliHemoVv = { id: KendaliHemo['id'] | 'hr'; label: string; min: number; max: number; step: number; unit: string }
const KENDALI_HEMO_VV: KendaliHemoVv[] = [
  { id: 'rpm', label: 'Pump speed', min: 0, max: 5000, step: 100, unit: 'rpm' },
  { id: 'hr', label: 'Heart rate', min: 50, max: 150, step: 5, unit: '/min' },
  { id: 'svr', label: 'SVR', min: 0.5, max: 2, step: 0.05, unit: 'mmHg·s/mL' },
  { id: 'volume', label: 'Blood volume', min: 4200, max: 6000, step: 50, unit: 'mL' },
]
const nilaiHemo = (p: ParameterSirkulasi, id: KendaliHemo['id']) => id === 'ees' ? Math.round((p.lv.ees / SIRKULASI_NORMAL.lv.ees) * 100) : id === 'rpm' ? p.ecmo.rpm : id === 'volume' ? p.volumeDarah : p.svr
const terapkanHemo = (p: ParameterSirkulasi, id: KendaliHemo['id'], v: number): ParameterSirkulasi =>
  id === 'ees' ? { ...p, lv: { ...p.lv, ees: (SIRKULASI_NORMAL.lv.ees * v) / 100 } } : id === 'rpm' ? { ...p, ecmo: { ...p.ecmo, rpm: v } } : id === 'volume' ? { ...p, volumeDarah: v } : { ...p, svr: v }

// Ventilasi alveolar paru asli (VV) adalah KELUARAN mekanika ventilator, bukan penggeser.
const KENDALI_VENT: Kendali<PengaturanVentilator>[] = [
  { k: 'pInspAtasPeep', label: 'Inspiratory pressure above PEEP (ΔP)', min: 0, max: 30, step: 1, unit: 'cmH₂O' },
  { k: 'peep', label: 'PEEP', min: 0, max: 20, step: 1, unit: 'cmH₂O' },
  { k: 'rr', label: 'Respiratory rate', min: 0, max: 35, step: 1, unit: '/min' },
  { k: 'crs', label: 'Respiratory-system compliance', min: 5, max: 60, step: 1, unit: 'mL/cmH₂O' },
  { k: 'ruangRugiMl', label: 'Dead space (illustrative)', min: 50, max: 300, step: 10, unit: 'mL' },
]

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

function EchoSkematis({ h }: { h: HasilSirkulasi }) {
  const echo = useMemo(() => bangunEcho(h), [h])
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!echo) return
    const kurang = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (kurang) return
    let id = 0, mulai = performance.now()
    // Stempel waktu rAF pertama bisa lebih awal dari performance.now(): bungkus indeks ke 0..n-1.
    const n = echo.bingkai.length
    const langkah = (t: number) => { setI(indeksBingkai(t, mulai, echo.dtSampel, n)); id = requestAnimationFrame(langkah) }
    id = requestAnimationFrame(langkah)
    return () => cancelAnimationFrame(id)
  }, [echo])
  if (!echo) return null
  const b = echo.bingkai[Math.min(Math.max(0, Number.isFinite(i) ? i : 0), echo.bingkai.length - 1)]
  const vMaks = Math.max(...echo.bingkai.map((x) => x.kecepatan), 1)
  const d = echo.bingkai.map((x, k) => `${k ? 'L' : 'M'}${(4 + (k / (echo.bingkai.length - 1)) * 142).toFixed(1)} ${(8 + (x.kecepatan / vMaks) * 44).toFixed(1)}`).join(' ')
  return (
    <div className="rounded-xl bg-black p-2" data-ecmo-echo>
      <svg viewBox="0 0 300 120" className="w-full" role="img" aria-label="Schematic echo view derived from the simulated LV volume and aortic flow">
        <path d="M150 6 L20 114 A140 140 0 0 0 280 114 Z" fill="#111" stroke="#333" />
        <ellipse cx="150" cy="70" rx={38 * b.skalaRongga} ry={46 * b.skalaRongga} fill="#000" stroke="#9ca3af" strokeWidth="5" />
        <g transform="translate(150 22)"><line x1="-10" y1="0" x2={b.katupBuka ? -14 : 0} y2="-10" stroke="#e5e7eb" strokeWidth="3" /><line x1="10" y1="0" x2={b.katupBuka ? 14 : 0} y2="-10" stroke="#e5e7eb" strokeWidth="3" /></g>
        <text x="6" y="14" fontSize="9" fill="#9ca3af">LV (schematic)</text>
      </svg>
      <svg viewBox="0 0 150 60" className="w-full" role="img" aria-label="LVOT Doppler trace derived from simulated aortic flow">
        <path d={d} fill="none" stroke="#e5e7eb" strokeWidth="1.2" />
        <line x1={4 + (i / (echo.bingkai.length - 1)) * 142} x2={4 + (i / (echo.bingkai.length - 1)) * 142} y1="4" y2="56" stroke="#fb7185" strokeWidth="0.8" />
      </svg>
      <p className="mt-1 text-[11px] text-neutral-300" data-ecmo-vti>Aortic VTI {echo.vtiIntegral.toFixed(1)} cm · valve {b.katupBuka ? 'open' : 'closed'}</p>
      <Prosa kelas="text-[10px] text-neutral-500">{'Schematic generated from the simulated LV volume and aortic flow — not an ultrasound image. VTI (the integral) is consistent with stroke volume; the velocity profile shape is not validated because blood inertance is not modeled, so peak velocity is not shown.'}</Prosa>
    </div>
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
  // Mode konferensi: panel yang sama, layar penuh, diperbesar; Escape keluar.
  const [presentasi, setPresentasi] = useState(false)
  const [lebarLayar, setLebarLayar] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth))
  useEffect(() => {
    if (!presentasi) return
    const ukur = () => setLebarLayar(window.innerWidth)
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPresentasi(false) }
    ukur(); window.addEventListener('resize', ukur); window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('resize', ukur); window.removeEventListener('keydown', esc) }
  }, [presentasi])
  const skala = skalaPresentasi(lebarLayar)
  const [vv, setVv] = useState(VV0)
  const [va, setVa] = useState(VA0)
  const [hemo, setHemo] = useState<ParameterSirkulasi>(HEMO0)
  const sebelumHemo = useRef<ParameterSirkulasi>(HEMO0)
  const sebelumVv = useRef<MasukanVV>(VV0)
  const sebelumVa = useRef<MasukanVA>(VA0)
  const [trace, setTrace] = useState<LangkahSebab[]>([])
  // VV: curah jantung dan aliran pompa adalah KELUARAN sirkulasi yang sama (drainase femoral/IVC, return RA).
  const [hemoVv, setHemoVv] = useState<ParameterSirkulasi>(HEMO_VV0)
  const sebelumHemoVv = useRef<ParameterSirkulasi>(HEMO_VV0)
  const kHemoVv = useMemo(() => simulasiSirkulasi(hemoVv), [hemoVv])
  const vvTurunan = (m: MasukanVV, h: HasilSirkulasi): MasukanVV => ({ ...m, co: h.sah ? h.coAsli : NaN, qEcmo: h.sah ? h.qEcmo : NaN })
  const vvEfektif = useMemo(() => vvTurunan(vv, kHemoVv), [vv, kHemoVv])
  const kVv = useMemo(() => simulasiVV(vvEfektif), [vvEfektif])
  const [vent, setVent] = useState<PengaturanVentilator>(VENTILATOR_ISTIRAHAT)
  const kVent = useMemo(() => mekanikaVentilator(vent), [vent])
  const ubahVent = (k: keyof PengaturanVentilator, v: number) => {
    const baru = { ...vent, [k]: v }, m = mekanikaVentilator(baru)
    if (m.sah) ubahVv('va', m.vaLMenit)
    setVent(baru)
  }
  const [jamBekuan, setJamBekuan] = useState(0)
  const [frKanula, setFrKanula] = useState(19)
  const [phMin, setPhMin] = useState(7.3)
  const [phMaks, setPhMaks] = useState(7.5)
  const [ujiVa, setUjiVa] = useState<ReturnType<typeof ujiPenurunanAliranVA> | null>(null)
  const [skenarioVvId, setSkenarioVvId] = useState<string | null>(null)
  const [awalVv, setAwalVv] = useState<HasilVV | null>(null)
  const dasarVv = useMemo(() => jalankanVV(DASAR_VV), [])
  const mulaiSkenarioVv = (id: string) => {
    const s = SKENARIO_VV.find((x) => x.id === id); if (!s) return
    const k = s.terapkan(DASAR_VV)
    setHemoVv(k.hemo); setVv({ ...VV0, ...k.gas }); setVent(VENTILATOR_ISTIRAHAT); setAwalVv(jalankanVV(k)); setSkenarioVvId(id); setTrace([])
    sebelumHemoVv.current = k.hemo; sebelumVv.current = { ...VV0, ...k.gas }
  }
  const [skenarioId, setSkenarioId] = useState<string | null>(null)
  const [awalSk, setAwalSk] = useState<HasilGabungan | null>(null)
  const dasarSk = useMemo(() => jalankan(DASAR), [])
  const mulaiSkenario = (id: string) => {
    const s = SKENARIO.find((x) => x.id === id); if (!s) return
    const k = s.terapkan(DASAR)
    setHemo(k.hemo); setVa({ ...VA0, ...k.gas }); setJamBekuan(k.jamBekuan); setAwalSk(jalankan(k)); setSkenarioId(id); setTrace([])
    sebelumHemo.current = k.hemo; sebelumVa.current = { ...VA0, ...k.gas }
  }
  const [adaDpc, setAdaDpc] = useState(false)
  const bekuan = trombosisOksigenator(jamBekuan)
  const hemoAktif = useMemo<ParameterSirkulasi>(() => ({ ...hemo, ecmo: { ...hemo.ecmo, faktorBekuan: bekuan.faktorBekuan } }), [hemo, bekuan.faktorBekuan])
  const kHemo = useMemo(() => simulasiSirkulasi(hemoAktif), [hemoAktif])
  // Garis dasar ΔP sirkuit ini sendiri (tanpa bekuan): nilai absolut ΔP bergantung desain sirkuit.
  const kDasar = useMemo(() => simulasiSirkulasi({ ...hemo, ecmo: { ...hemo.ecmo, faktorBekuan: 1 } }), [hemo])
  // Oksigenasi VA dihitung dari aliran yang DIHASILKAN sirkulasi, bukan penggeser.
  const vaTurunan = (m: MasukanVA, h: HasilSirkulasi): MasukanVA => ({ ...m, fungsiMembran: bekuan.fungsiMembran, qLv: h.sah ? h.coAsli : 0, qEcmo: h.sah ? Math.max(h.qEcmo, 0.01) : 0.01 })
  const kVa = useMemo(() => simulasiVA(vaTurunan(va, kHemo)), [va, kHemo])

  const ubahVv = (k: keyof MasukanVV, v: number) => {
    const baru = { ...vv, [k]: v }, a = vvTurunan(sebelumVv.current, kHemoVv), b = vvTurunan(baru, kHemoVv)
    setTrace(jelaskanVV(a, simulasiVV(a), b, simulasiVV(b))); setVv(baru)
  }
  const ubahHemoVv = (id: KendaliHemoVv['id'], v: number) => {
    const baru = id === 'hr' ? { ...hemoVv, hr: v } : terapkanHemo(hemoVv, id, v)
    const hA = simulasiSirkulasi(sebelumHemoVv.current), hB = simulasiSirkulasi(baru), a = vvTurunan(vv, hA), b = vvTurunan(vv, hB)
    setTrace([...jelaskanHemodinamik(sebelumHemoVv.current, hA, baru, hB).filter((l) => !/LV end-systolic|PCWP|Pulse pressure/.test(l.besaran)),
      ...jelaskanVV(a, simulasiVV(a), b, simulasiVV(b)).filter((l) => l.besaran !== 'Pump flow' && l.besaran !== 'Cardiac output')])
    setHemoVv(baru)
  }
  const ubahVa = (k: keyof MasukanVA, v: number) => {
    const baru = { ...va, [k]: v }, a = vaTurunan(sebelumVa.current, kHemo), b = vaTurunan(baru, kHemo)
    setTrace(jelaskanVA(a, simulasiVA(a), b, simulasiVA(b))); setVa(baru)
  }
  const ubahHemo = (id: KendaliHemo['id'], v: number) => {
    const fb = bekuan.faktorBekuan, dgnBekuan = (p: ParameterSirkulasi) => ({ ...p, ecmo: { ...p.ecmo, faktorBekuan: fb } })
    const baru = terapkanHemo(hemo, id, v), hA = simulasiSirkulasi(dgnBekuan(sebelumHemo.current)), hB = simulasiSirkulasi(dgnBekuan(baru))
    const a = vaTurunan(va, hA), b = vaTurunan(va, hB)
    setTrace([...jelaskanHemodinamik(sebelumHemo.current, hA, baru, hB), ...jelaskanVA(a, simulasiVA(a), b, simulasiVA(b)).filter((l) => l.besaran !== 'Native LV output' && l.besaran !== 'ECMO flow')])
    setHemo(baru)
  }
  const tandai = () => { sebelumVv.current = vv; sebelumVa.current = va; sebelumHemo.current = hemo; sebelumHemoVv.current = hemoVv }

  const status = mode === 'VV' ? kVv.status : kVa.status
  const isi = (
    <section data-ecmo data-ecmo-presentasi={presentasi ? 'aktif' : undefined} aria-label="ECMO digital twin"
      className={presentasi ? 'fixed inset-0 z-[100] overflow-y-auto bg-neutral-950 p-4 text-white' : 'space-y-3 rounded-2xl bg-neutral-950 p-3 text-white'}>
      <div className={presentasi ? 'mx-auto space-y-3' : 'contents'} style={presentasi ? { maxWidth: LEBAR_PANEL_PRESENTASI, zoom: skala } : undefined}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black">ECMO digital twin</h3>
        <button type="button" onClick={() => setPresentasi((x) => !x)} aria-pressed={presentasi}
          className="min-h-10 shrink-0 rounded-full bg-white/10 px-3 text-[12px] font-black">{presentasi ? 'Exit presenter' : 'Present'}</button>
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
            <Angka id="vv-q" label="Pump flow (derived)" nilai={`${n0(kHemoVv.qEcmo, 1)} L/min`} />
            <Angka id="vv-co" label="Cardiac output (derived)" nilai={`${n0(kHemoVv.coAsli, 1)} L/min`} />
            <Angka id="vv-map" label="MAP" nilai={`${n0(kHemoVv.map)} mmHg`} />
            <Angka id="paco2" label="PaCO₂" nilai={`${n0(kVv.co2.paco2)} mmHg`} />
            <Angka label="pH" nilai={n0(kVv.co2.ph, 2)} />
            <Angka id="resirkulasi" label="Recirculation" nilai={pct(kVv.resirkulasi)} />
            <Angka label="Eff. flow / CO" nilai={pct(kVv.rasioEfektifTerhadapCO)} />
            <Angka label="SvO₂" nilai={pct(kVv.svo2)} />
            <Angka label="DO₂" nilai={`${n0(kVv.do2)} mL/min`} />
            <Angka label="DO₂ : VO₂" nilai={`${n0(kVv.do2PerVo2, 1)} : 1`} />
            <Angka label="ECMO O₂ transfer" nilai={`${n0(kVv.vo2Ecmo)} mL/min`} />
          </div>
          <div className="space-y-1.5" onPointerDown={tandai} onKeyDown={tandai}>
            {KENDALI_HEMO_VV.map((d) => <Penggeser key={d.id} d={d} nilai={d.id === 'hr' ? hemoVv.hr : nilaiHemo(hemoVv, d.id)} ubah={(v) => ubahHemoVv(d.id, v)} />)}
            {KENDALI_VV.map((d) => <Penggeser key={String(d.k)} d={d} nilai={vv[d.k] as number} ubah={(v) => ubahVv(d.k, v)} />)}
          </div>
          <div data-ecmo-ventilator className="space-y-1.5 rounded-xl bg-white/5 p-2">
            <h4 className="text-[12px] font-black">Ventilator (lung rest)</h4>
            <div className="grid grid-cols-3 gap-1.5">
              <Angka id="vt" label="Tidal volume" nilai={`${n0(kVent.vtMl)} mL`} />
              <Angka id="pplat" label="Plateau" nilai={`${n0(kVent.pplat)} cmH₂O`} />
              <Angka id="dp" label="Driving pressure" nilai={`${n0(kVent.drivingPressure)} cmH₂O`} />
              <Angka label="Minute ventilation" nilai={`${n0(kVent.veLMenit, 1)} L/min`} />
              <Angka id="va-paru" label="Alveolar ventilation" nilai={`${n0(kVent.vaLMenit, 1)} L/min`} />
              <Angka id="istirahat" label="ELSO rest settings" nilai={!kVent.sah ? '—' : kVent.istirahatElso.memenuhi ? 'met' : 'not met'} />
            </div>
            <div className="space-y-1.5" onPointerDown={tandai} onKeyDown={tandai}>
              {KENDALI_VENT.map((d) => <Penggeser key={String(d.k)} d={d} nilai={vent[d.k]} ubah={(v) => ubahVent(d.k, v)} />)}
            </div>
            <Prosa kelas="text-[10px] text-neutral-500">{'VT = compliance × ΔP (pressure control, full equilibration); alveolar ventilation feeds the same PaCO₂ model, so resting the lung raises PaCO₂ unless sweep rises. Rest check uses ELSO VV 2021: plateau ≤ 25 or inspiratory pressure ≤ 15 cmH₂O, with PEEP ≥ 10. Driving pressure has no threshold here: Amato 2015 reports a continuous association with mortality. PEEP effects on shunt and venous return are not modeled.'}</Prosa>
          </div>
        </>
      ) : (
        <>
          <Aorta keadaan={kVa} />
          <div className="grid grid-cols-2 gap-2"><Lingkar h={kHemo} /><Gelombang h={kHemo} /></div>
          <EchoSkematis h={kHemo} />
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
            <Angka id="pdrain" label="Drainage P" nilai={kHemo.sirkuit ? `${n0(kHemo.sirkuit.pDrainase)} mmHg` : 'no flow'} />
            <Angka id="ppre" label="Pre-oxy / post-oxy" nilai={kHemo.sirkuit ? `${n0(kHemo.sirkuit.pPraOksigenator)} / ${n0(kHemo.sirkuit.pPascaOksigenator)}` : '—'} />
            <Angka id="deltap" label="ΔP vs own baseline" nilai={kHemo.sirkuit && kDasar.sirkuit && kDasar.sirkuit.deltaP > 0.5 ? `${n0(kHemo.sirkuit.deltaP)} (${kHemo.sirkuit.deltaP >= kDasar.sirkuit.deltaP ? '+' : ''}${n0((kHemo.sirkuit.deltaP / kDasar.sirkuit.deltaP - 1) * 100)}%)` : '—'} />
            <Angka label="DO₂" nilai={`${n0(kVa.do2)} mL/min`} />
            <Angka label="SvO₂" nilai={pct(kVa.svo2)} />
          </div>
          <div className="space-y-1.5" onPointerDown={tandai} onKeyDown={tandai}>
            {KENDALI_HEMO.map((d) => <Penggeser key={d.id} d={d} nilai={nilaiHemo(hemo, d.id)} ubah={(v) => ubahHemo(d.id, v)} />)}
            <Penggeser d={{ label: 'Oxygenator clot: hours since onset (crisis scenario)', min: 0, max: 72, step: 1, unit: 'h' }} nilai={jamBekuan}
              ubah={(v) => {
                const a = trombosisOksigenator(jamBekuan), b = trombosisOksigenator(v)
                const pa = { ...hemo, ecmo: { ...hemo.ecmo, faktorBekuan: a.faktorBekuan } }, pb = { ...hemo, ecmo: { ...hemo.ecmo, faktorBekuan: b.faktorBekuan } }
                const hA = simulasiSirkulasi(pa), hB = simulasiSirkulasi(pb)
                const vA = { ...va, fungsiMembran: a.fungsiMembran, qLv: hA.coAsli, qEcmo: Math.max(hA.qEcmo, 0.01) }, vB = { ...va, fungsiMembran: b.fungsiMembran, qLv: hB.coAsli, qEcmo: Math.max(hB.qEcmo, 0.01) }
                const dp = hA.sirkuit && hB.sirkuit ? [{ besaran: 'Oxygenator ΔP', dari: Number(hA.sirkuit.deltaP.toFixed(0)), ke: Number(hB.sirkuit.deltaP.toFixed(0)), satuan: 'mmHg' }] : []
                setTrace([{ besaran: 'Clot burden (resistance factor)', dari: Number(a.faktorBekuan.toFixed(2)), ke: Number(b.faktorBekuan.toFixed(2)), satuan: '×' }, ...dp, ...jelaskanHemodinamik(pa, hA, pb, hB), ...jelaskanVA(vA, simulasiVA(vA), vB, simulasiVA(vB)).filter((l) => l.besaran !== 'Native LV output' && l.besaran !== 'ECMO flow')])
                setJamBekuan(v)
              }} />
            {KENDALI_VA.map((d) => <Penggeser key={String(d.k)} d={d} nilai={va[d.k] as number} ubah={(v) => ubahVa(d.k, v)} />)}
          </div>
        </>
      )}

      {mode === 'VV' && (() => {
        const s = SKENARIO_VV.find((x) => x.id === skenarioVvId)
        const kini = s ? jalankanVV({ hemo: hemoVv, gas: vv }) : null
        const selesai = s && kini ? s.selesai(dasarVv, kini) : false
        const baris = (p: { id: string; nama: string; dari: number; ke: number; satuan: string }) => <li key={p.id} className="flex justify-between gap-2"><span>{p.nama}</span><span className="shrink-0 tabular-nums text-neutral-400">{p.id === 'o2' ? '' : p.satuan === '' && p.id !== 'do2vo2' ? `${pct(p.dari)} → ${pct(p.ke)}` : `${n0(p.dari, 1)} → ${n0(p.ke, 1)} ${p.satuan}`}</span></li>
        return (
          <div className="space-y-1.5 rounded-xl bg-white/5 p-2.5" data-ecmo-skenario-vv>
            <h4 className="text-[11px] font-black uppercase text-neutral-400">VV crisis scenarios</h4>
            <div className="flex flex-wrap gap-1.5">
              {SKENARIO_VV.map((x) => <button key={x.id} type="button" aria-pressed={skenarioVvId === x.id} onClick={() => mulaiSkenarioVv(x.id)}
                className={`min-h-10 rounded-full px-3 text-[11px] font-bold ${skenarioVvId === x.id ? 'bg-rose-600' : 'bg-white/10'}`}>{x.judul}</button>)}
            </div>
            {s && awalVv && (<>
              <p className="text-[12px] text-neutral-300">Started: {s.pemicu}. Work it out from the physiology, then correct it with the controls.</p>
              <p className="text-[10px] font-bold uppercase text-neutral-500">What changed when it started (computed)</p>
              <ul className="space-y-0.5 text-[12px] text-neutral-200" data-ecmo-petunjuk-vv>{petunjukVV(dasarVv, awalVv).map(baris)}</ul>
              <p role="status" data-ecmo-selesai-vv={selesai ? 'ya' : 'tidak'} className={`text-[12px] font-bold ${selesai ? 'text-emerald-400' : 'text-amber-300'}`}>{selesai ? 'Restored to the pre-crisis state.' : 'Not yet restored.'}</p>
              {selesai && kini && (<><p className="text-[10px] font-bold uppercase text-neutral-500">Debrief: what your actions changed</p><ul className="space-y-0.5 text-[12px] text-neutral-200">{petunjukVV(awalVv, kini).map(baris)}</ul></>)}
              <Prosa kelas="text-[10px] text-neutral-500">{`Not simulated here: ${s.batas}`}</Prosa>
            </>)}
          </div>
        )
      })()}

      {mode === 'VV' && (() => {
        const w = nilaiWeaningVV(vvEfektif, phMin, phMaks)
        return (
          <div className="space-y-1.5 rounded-xl bg-white/5 p-2.5" data-ecmo-weaning>
            <h4 className="text-[11px] font-black uppercase text-neutral-400">Weaning trial (ELSO VV sequence)</h4>
            <ol className="space-y-1 text-[12px]">
              {w.tahap.map((t, i) => (
                <li key={t.tahap} data-tahap={t.tahap} data-tercapai={t.tercapai ? 'ya' : 'tidak'} className="flex items-start justify-between gap-2">
                  <span className="text-neutral-200">{i + 1}. {t.judul}<span className="block text-[10px] text-neutral-500">{t.syarat} · now {t.nilai}</span></span>
                  <span className={`shrink-0 font-black ${t.tercapai ? 'text-emerald-400' : 'text-neutral-500'}`}>{t.tercapai ? 'met' : 'not met'}</span>
                </li>
              ))}
            </ol>
            <Penggeser d={{ label: 'Acceptable pH, lower (educator-set; ELSO gives no number)', min: 7.2, max: 7.4, step: 0.01, unit: '' }} nilai={phMin} ubah={setPhMin} />
            <Penggeser d={{ label: 'Acceptable pH, upper (educator-set)', min: 7.4, max: 7.6, step: 0.01, unit: '' }} nilai={phMaks} ubah={setPhMaks} />
            <p className="text-[10px] text-neutral-500">Teaching simulation, not a decannulation decision.</p>
          </div>
        )
      })()}

      {mode === 'VA' && (
        <div className="space-y-1.5 rounded-xl bg-white/5 p-2.5" data-ecmo-weaning-va>
          <h4 className="text-[11px] font-black uppercase text-neutral-400">VA flow-reduction trial</h4>
          <button type="button" onClick={() => setUjiVa(ujiPenurunanAliranVA(hemoAktif, OPSI_WEANING_VA))} className="min-h-10 rounded-full bg-white/10 px-4 text-[12px] font-bold">Run trial on the current patient</button>
          {ujiVa && (
            <ul className="space-y-1 text-[12px]">
              {ujiVa.kriteria.map((k) => (
                <li key={k.id} data-kriteria={k.id} data-status={k.status} className="flex items-start justify-between gap-2">
                  <span className="text-neutral-200">{k.judul}<span className="block text-[10px] text-neutral-500">{k.nilai}</span></span>
                  <span className={`shrink-0 font-black ${k.status === 'tercapai' ? 'text-emerald-400' : k.status === 'tidak' ? 'text-amber-300' : 'text-neutral-500'}`}>{k.status === 'tercapai' ? 'met' : k.status === 'tidak' ? 'not met' : 'not simulated'}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-neutral-500">Criteria from one 51-patient series; TDSa is not simulated, so this tool cannot declare readiness to wean.</p>
        </div>
      )}

      {mode === 'VA' && (() => {
        const s = SKENARIO.find((x) => x.id === skenarioId)
        const kKini: KeadaanSkenario = { hemo, gas: va, jamBekuan }
        const gKini = s ? jalankan(kKini) : null
        const selesai = s && gKini ? s.selesai(dasarSk, gKini, kKini) : false
        const baris = (p: Petunjuk) => <li key={p.id} className="flex justify-between gap-2"><span>{p.nama}</span><span className="shrink-0 tabular-nums text-neutral-400">{p.satuan === '' && p.id !== 'o2' ? `${pct(p.dari)} → ${pct(p.ke)}` : p.id === 'o2' ? '' : `${n0(p.dari, 1)} → ${n0(p.ke, 1)} ${p.satuan}`}</span></li>
        return (
          <div className="space-y-1.5 rounded-xl bg-white/5 p-2.5" data-ecmo-skenario>
            <h4 className="text-[11px] font-black uppercase text-neutral-400">Crisis scenarios</h4>
            <div className="flex flex-wrap gap-1.5">
              {SKENARIO.map((x) => <button key={x.id} type="button" aria-pressed={skenarioId === x.id} onClick={() => mulaiSkenario(x.id)}
                className={`min-h-10 rounded-full px-3 text-[11px] font-bold ${skenarioId === x.id ? 'bg-rose-600' : 'bg-white/10'}`}>{x.judul}</button>)}
            </div>
            {s && awalSk && (
              <>
                <p className="text-[12px] text-neutral-300">Started: {s.pemicu}. Work it out from the physiology, then correct it with the controls below.</p>
                <p className="text-[10px] font-bold uppercase text-neutral-500">What changed when it started (computed)</p>
                <ul className="space-y-0.5 text-[12px] text-neutral-200" data-ecmo-petunjuk>{petunjuk(dasarSk, awalSk).map(baris)}</ul>
                <p role="status" data-ecmo-selesai={selesai ? 'ya' : 'tidak'} className={`text-[12px] font-bold ${selesai ? 'text-emerald-400' : 'text-amber-300'}`}>{selesai ? 'Physiology restored.' : 'Not yet restored.'}</p>
                {selesai && gKini && (<>
                  <p className="text-[10px] font-bold uppercase text-neutral-500">Debrief: what your actions changed</p>
                  <ul className="space-y-0.5 text-[12px] text-neutral-200">{petunjuk(awalSk, gKini).map(baris)}</ul>
                </>)}
                <Prosa kelas="text-[10px] text-neutral-500">{`Not simulated here: ${s.batas}`}</Prosa>
              </>
            )}
          </div>
        )
      })()}

      {mode === 'VA' && kHemo.sah && (() => {
        // Ginjal hanya butuh hemodinamika; ubin yang butuh oksigen menjadi '—' bila model O2 menolak.
        const o2Sah = kVa.status === 'tunak'
        const org = o2Sah ? keadaanOrganVA(kHemo, kVa) : { ...keadaanOrganVA(kHemo, { ...kVa, cabang: [] }), otakDo2: NaN, splanknikDo2: NaN }
        const gfr = 100 * org.ginjal.fraksiFiltrasi
        const iliaka = kVa.cabang.find((c) => c.id === 'iliaka')?.saturasi ?? NaN
        const tungkai = keadaanTungkai(frKanula, 8, adaDpc, kHemo.qEcmo, o2Sah ? kVa.sPost : NaN, iliaka)
        return (
          <div className="space-y-1.5 rounded-xl bg-white/5 p-2.5" data-ecmo-organ>
            <h4 className="text-[11px] font-black uppercase text-neutral-400">Organs (same state)</h4>
            <div className="grid grid-cols-3 gap-1.5">
              <Angka id="rpp" label="Renal perfusion P" nilai={`${n0(org.ginjal.tekananPerfusi)} mmHg`} />
              <Angka id="filtrasi" label="Filtration" nilai={pct(org.ginjal.fraksiFiltrasi)} />
              <Angka id="kreatinin" label="Cr at 24/48/72 h" nilai={[24, 48, 72].map((j) => kreatininSetelah(j, gfr, { crAwal: 1, gfrDasar: 100, beratKg: 70 }).toFixed(1)).join(' / ')} />
              <Angka id="otak" label="Head–neck DO₂" nilai={`${n0(org.otakDo2)} mL/min`} />
              <Angka label="Splanchnic DO₂" nilai={`${n0(org.splanknikDo2)} mL/min`} />
              <Angka id="tungkai" label="Cannulated leg" nilai={`${pct(tungkai.indeksPerfusi)} ${tungkai.status === 'cukup' ? '' : '⚠'}`} />
            </div>
            <Prosa kelas="text-[10px] text-neutral-500">Creatinine: projection if this state persisted (baseline 1.0 mg/dL, 70 kg), not a lab value. CPP needs ICP, which is not modeled.</Prosa>
            <Penggeser d={{ label: 'Arterial cannula size', min: 15, max: 23, step: 2, unit: 'Fr' }} nilai={frKanula} ubah={setFrKanula} />
            <label className="flex min-h-10 items-center gap-2 text-[12px] text-neutral-300"><input type="checkbox" checked={adaDpc} onChange={(e) => setAdaDpc(e.target.checked)} />Distal perfusion cannula</label>
          </div>
        )
      })()}

      <div className="rounded-xl bg-white/5 p-2.5">
        <h4 className="mb-1 text-[11px] font-black uppercase text-neutral-400">Why did that change?</h4>
        <Mengapa langkah={trace} />
      </div>

      <details className="text-[12px]">
        <summary className="min-h-10 cursor-pointer font-bold text-neutral-300">Not yet simulated</summary>
        <ul className="mt-1 list-disc pl-5 text-neutral-400">{[...BELUM_VA, 'ECG, CVP waveform and heart-rate effects on ECMO flow', 'Hepatic synthetic/lactate kinetics, brain injury states, ICP/CPP, urine output and electrolytes', 'Cannulation, ultrasound and ICU scene', 'Anticoagulation, hemolysis and the other circuit crises (only oxygenator thrombosis is simulated)'].map((t) => <li key={t}>{t}</li>)}</ul>
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
      </div>
    </section>
  )
  // Portal: 'fixed' di dalam induk bertransformasi tidak menutup layar, jadi presenter dirender di body.
  return presentasi && typeof document !== 'undefined' ? createPortal(isi, document.body) : isi
}

export default PanelEcmo
