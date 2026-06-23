Berikut adalah kode **lengkap dari awal hingga akhir** dalam satu file, siap di-*copy-paste*. Desain dibuat lebih bersih, inovatif, visual, dan interaktif dengan GPS Tracker, perencanaan jalur, BMR/TDEE berbasis gender-usia, database makanan & olahraga detail, import vital signs, dan rekomendasi cerdas.

```tsx
import { useEffect, useState, useRef, useCallback, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconPlus, IconSparkle, IconHeart, IconStethoscope, IconHospital } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { evaluateVitals, overallStatus, STATUS_COLOR, STATUS_LABEL } from '../lib/chronic'
import type { VitalSign } from '../lib/types'

const today = () => new Date().toISOString().slice(0, 10)
const GOAL_SLEEP = 8; const GOAL_WATER = 2000
const C = { ok: '#00BF63', warn: '#f59e0b', bad: '#ef4444', blue: '#2563eb', pur: '#8b5cf6', ind: '#818cf8', org: '#f97316' }

/* ═══════════════════════════════════════════════════════════════
   TYPES & LOCAL STORAGE HELPERS
   ═══════════════════════════════════════════════════════════════ */
interface Body { w: number; h: number; age: number; g: 'M' | 'F'; act: number; goal: 'lose' | 'maintain' | 'gain' }
interface Food { name: string; k: number; c: number; p: number; f: number; fb: number; cat: string; emoji: string }
interface Exer { name: string; emoji: string; met: number; int: string; gps: boolean; cat: string }
interface GP { lat: number; lng: number; t: number; hr?: number }
interface WP { x: number; y: number }
interface IV { date: string; heartRate?: number; steps?: number; systolic?: number; spo2?: number; hrv?: number; vo2Max?: number }
interface Rec { e: string; t: string; d: string; pr: number; c: string }

const BK = 'pm_body_v2'; const defBody: Body = { w: 65, h: 165, age: 30, g: 'M', act: 1, goal: 'maintain' }
const loadB = (): Body => { try { const d = JSON.parse(localStorage.getItem(BK) || ''); return d.w ? d : defBody } catch { return defBody } }
const saveB = (b: Body) => localStorage.setItem(BK, JSON.stringify(b))
let _br = 0; const emitB = () => { _br++; window.dispatchEvent(new Event('bc')) }
const useBR = () => { const [, s] = useState(0); useEffect(() => { const h = () => s(v => v + 1); window.addEventListener('bc', h); return () => window.removeEventListener('bc', h) }, []); return _br }

/* ═══════════════════════════════════════════════════════════════
   FOOD DATABASE (52 items, with emoji & fiber)
   ═══════════════════════════════════════════════════════════════ */
const FD: Food[] = [
  { name:'Nasi putih',k:130,c:28,p:2.7,f:0.3,fb:0.4,cat:'Karbo',emoji:'🍚' },{ name:'Nasi merah',k:111,c:23,p:2.6,f:0.9,fb:1.8,cat:'Karbo',emoji:'🍚' },
  { name:'Nasi goreng',k:163,c:21,p:4,f:6,fb:0.8,cat:'Karbo',emoji:'🍳' },{ name:'Lontong',k:122,c:27,p:2,f:0.2,fb:0.5,cat:'Karbo',emoji:'🟢' },
  { name:'Roti tawar',k:265,c:49,p:9,f:3.2,fb:2.7,cat:'Karbo',emoji:'🍞' },{ name:'Roti gandum',k:247,c:41,p:13,f:3.4,fb:6.8,cat:'Karbo',emoji:'🍞' },
  { name:'Mie goreng',k:182,c:24,p:5,f:7,fb:1.2,cat:'Karbo',emoji:'🍜' },{ name:'Mie ayam',k:85,c:12,p:4,f:2,fb:0.5,cat:'Karbo',emoji:'🍜' },
  { name:'Oatmeal',k:389,c:66,p:17,f:7,fb:11,cat:'Karbo',emoji:'🥣' },{ name:'Kentang rebus',k:87,c:20,p:1.9,f:0.1,fb:2.2,cat:'Karbo',emoji:'🥔' },
  { name:'Ubi jalar',k:86,c:20,p:1.6,f:0.1,fb:3,cat:'Karbo',emoji:'🍠' },{ name:'Bubur ayam',k:68,c:10,p:3,f:2,fb:0.3,cat:'Karbo',emoji:'🥣' },
  { name:'Ayam goreng',k:239,c:8,p:21,f:14,fb:0.3,cat:'Protein',emoji:'🍗' },{ name:'Ayam bakar',k:190,c:1,p:28,f:8,fb:0,cat:'Protein',emoji:'🍗' },
  { name:'Daging sapi',k:250,c:0,p:26,f:15,fb:0,cat:'Protein',emoji:'🥩' },{ name:'Ikan goreng',k:232,c:7,p:19,f:14,fb:0.3,cat:'Protein',emoji:'🐟' },
  { name:'Ikan kukus',k:100,c:0,p:20,f:2,fb:0,cat:'Protein',emoji:'🐟' },{ name:'Salmon',k:208,c:0,p:20,f:13,fb:0,cat:'Protein',emoji:'🐟' },
  { name:'Telur ayam',k:155,c:1.1,p:13,f:11,fb:0,cat:'Protein',emoji:'🥚' },{ name:'Udang',k:85,c:0.2,p:20,f:0.5,fb:0,cat:'Protein',emoji:'🦐' },
  { name:'Sate ayam',k:186,c:3,p:22,f:10,fb:0.2,cat:'Protein',emoji:'🍢' },{ name:'Rendang',k:193,c:2,p:24,f:10,fb:0.5,cat:'Protein',emoji:'🥘' },
  { name:'Tempe goreng',k:201,c:8,p:17,f:12,fb:3,cat:'Protein',emoji:'🟫' },{ name:'Tempe kukus',k:160,c:7,p:18,f:8,fb:4,cat:'Protein',emoji:'🟫' },
  { name:'Tahu goreng',k:234,c:4,p:15,f:17,fb:0.5,cat:'Protein',emoji:'🧈' },{ name:'Tahu kukus',k:76,c:1.9,p:8,f:4.8,fb:0.3,cat:'Protein',emoji:'🧈' },
  { name:'Susu full cream',k:61,c:4.8,p:3.2,f:3.3,fb:0,cat:'Susu',emoji:'🥛' },{ name:'Susu skim',k:34,c:5,p:3.4,f:0.1,fb:0,cat:'Susu',emoji:'🥛' },
  { name:'Yogurt',k:59,c:3.6,p:10,f:0.4,fb:0,cat:'Susu',emoji:'🫙' },{ name:'Keju',k:402,c:1.3,p:25,f:33,fb:0,cat:'Susu',emoji:'🧀' },
  { name:'Bayam',k:23,c:3.6,p:2.9,f:0.4,fb:2.2,cat:'Sayur',emoji:'🥬' },{ name:'Kangkung',k:19,c:3.1,p:2.6,f:0.2,fb:2.5,cat:'Sayur',emoji:'🥬' },
  { name:'Brokoli',k:34,c:7,p:2.8,f:0.4,fb:2.6,cat:'Sayur',emoji:'🥦' },{ name:'Wortel',k:41,c:10,p:0.9,f:0.2,fb:2.8,cat:'Sayur',emoji:'🥕' },
  { name:'Tomat',k:18,c:3.9,p:0.9,f:0.2,fb:1.2,cat:'Sayur',emoji:'🍅' },{ name:'Sawi',k:26,c:4.5,p:2.8,f:0.3,fb:2.8,cat:'Sayur',emoji:'🥬' },
  { name:'Gado-gado',k:122,c:10,p:6,f:7,fb:3,cat:'Sayur',emoji:'🥗' },
  { name:'Pisang',k:89,c:23,p:1.1,f:0.3,fb:2.6,cat:'Buah',emoji:'🍌' },{ name:'Apel',k:52,c:14,p:0.3,f:0.2,fb:2.4,cat:'Buah',emoji:'🍎' },
  { name:'Jeruk',k:47,c:12,p:0.9,f:0.1,fb:2.4,cat:'Buah',emoji:'🍊' },{ name:'Mangga',k:60,c:15,p:0.8,f:0.4,fb:1.6,cat:'Buah',emoji:'🥭' },
  { name:'Alpukat',k:160,c:9,p:2,f:15,fb:7,cat:'Buah',emoji:'🥑' },{ name:'Jambu biji',k:68,c:14,p:2.6,f:1,fb:5.4,cat:'Buah',emoji:'🍏' },
  { name:'Pepaya',k:43,c:11,p:0.5,f:0.3,fb:1.7,cat:'Buah',emoji:'🍈' },
  { name:'Es teh manis',k:40,c:10,p:0,f:0,fb:0,cat:'Minuman',emoji:'🧊' },{ name:'Kopi hitam',k:2,c:0,p:0.3,f:0,fb:0,cat:'Minuman',emoji:'☕' },
  { name:'Jus jeruk',k:45,c:10,p:0.7,f:0.2,fb:0.2,cat:'Minuman',emoji:'🧃' },{ name:'Air mineral',k:0,c:0,p:0,f:0,fb:0,cat:'Minuman',emoji:'💧' },
  { name:'Bakso',k:75,c:10,p:5,f:2,fb:0.3,cat:'Lainnya',emoji:'🥟' },{ name:'Soto ayam',k:48,c:4,p:4,f:2,fb:0.3,cat:'Lainnya',emoji:'🍲' },
  { name:'Nasi padang',k:200,c:25,p:8,f:8,fb:1,cat:'Lainnya',emoji:'🍛' },{ name:'Kacang almond',k:579,c:22,p:21,f:50,fb:12,cat:'Lainnya',emoji:'🥜' },
]
const FCATS = [...new Set(FD.map(f => f.cat))]

/* ═══════════════════════════════════════════════════════════════
   EXERCISE DATABASE (with GPS flag & MET)
   ═══════════════════════════════════════════════════════════════ */
const EX: Exer[] = [
  { name:'Jalan santai',emoji:'🚶',met:2.5,int:'Rendah',gps:true,cat:'Kardio' },
  { name:'Jalan cepat',emoji:'🚶‍♂️',met:3.5,int:'Sedang',gps:true,cat:'Kardio' },
  { name:'Jogging',emoji:'🏃',met:7.0,int:'Sedang',gps:true,cat:'Kardio' },
  { name:'Lari',emoji:'🏃‍♂️',met:9.8,int:'Tinggi',gps:true,cat:'Kardio' },
  { name:'Bersepeda santai',emoji:'🚴',met:6.0,int:'Sedang',gps:true,cat:'Kardio' },
  { name:'Bersepeda intens',emoji:'🚴‍♂️',met:10.0,int:'Tinggi',gps:true,cat:'Kardio' },
  { name:'Renang santai',emoji:'🏊',met:5.8,int:'Sedang',gps:false,cat:'Kardio' },
  { name:'Renang intens',emoji:'🏊‍♂️',met:9.8,int:'Tinggi',gps:false,cat:'Kardio' },
  { name:'Trekking/Hiking',emoji:'🥾',met:6.0,int:'Sedang',gps:true,cat:'Outdoor' },
  { name:'Trail running',emoji:'🏔️',met:10.5,int:'Tinggi',gps:true,cat:'Outdoor' },
  { name:'Aerobik',emoji:'💃',met:6.5,int:'Sedang',gps:false,cat:'Kardio' },
  { name:'Zumba',emoji:'🕺',met:6.5,int:'Sedang',gps:false,cat:'Kardio' },
  { name:'Skip/tali',emoji:'⏭️',met:12.3,int:'Tinggi',gps:false,cat:'Kardio' },
  { name:'Boxing',emoji:'🥊',met:7.8,int:'Tinggi',gps:false,cat:'Kardio' },
  { name:'Yoga',emoji:'🧘',met:2.5,int:'Rendah',gps:false,cat:'Fleksibilitas' },
  { name:'Pilates',emoji:'🤸',met:3.0,int:'Rendah',gps:false,cat:'Fleksibilitas' },
  { name:'Angkat beban',emoji:'🏋️',met:5.0,int:'Sedang',gps:false,cat:'Kekuatan' },
  { name:'Crossfit',emoji:'💪',met:8.0,int:'Tinggi',gps:false,cat:'Kekuatan' },
  { name:'Futsal',emoji:'⚽',met:10.0,int:'Tinggi',gps:true,cat:'Olahraga' },
  { name:'Basket',emoji:'🏀',met:6.5,int:'Sedang',gps:true,cat:'Olahraga' },
  { name:'Badminton',emoji:'🏸',met:5.5,int:'Sedang',gps:false,cat:'Olahraga' },
  { name:'Tenis',emoji:'🎾',met:7.3,int:'Tinggi',gps:true,cat:'Olahraga' },
]
const EXCATS = [...new Set(EX.map(e => e.cat))]

/* ═══════════════════════════════════════════════════════════════
   CALCULATIONS & HELPERS
   ═══════════════════════════════════════════════════════════════ */
const ACT_L = ['Sedentari','Ringan','Sedang','Aktif','Sangat aktif']
const ACT_M = [1.2, 1.375, 1.55, 1.725, 1.9]
const getBmi = (w: number, h: number) => w / ((h / 100) ** 2)
const getBmr = (w: number, h: number, a: number, g: string) => g === 'M' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
const getTdee = (b: number, l: number) => b * (ACT_M[l] ?? 1.2)
const getMetBurn = (met: number, kg: number, min: number) => Math.round(met * kg * (min / 60))
const bmiInfo = (v: number) => v < 18.5 ? { l: 'Kurus', c: C.blue } : v < 23 ? { l: 'Normal', c: C.ok } : v < 25 ? { l: 'Berlebih', c: C.warn } : v < 30 ? { l: 'Obesitas I', c: C.org } : { l: 'Obesitas II', c: C.bad }
const goalAdj = (g: string) => g === 'lose' ? -0.2 : g === 'gain' ? 0.15 : 0
const fmtD = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sc = Math.floor(s % 60); return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}` : `${m}:${String(sc).padStart(2, '0')}` }
const fmtDist = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
const fmtPace = (s: number, m: number) => { if (m < 10) return '--:--/km'; const pk = s / 60 / (m / 1000); const pm = Math.floor(pk); const ps = Math.round((pk - pm) * 60); return `${pm}:${String(ps).padStart(2, '0')}/km` }

function hav(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; const dr = Math.PI / 180; const dLa = (lat2 - lat1) * dr; const dLo = (lon2 - lon1) * dr
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(lat1 * dr) * Math.cos(lat2 * dr) * Math.sin(dLo / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function totalDist(pts: GP[]) { let d = 0; for (let i = 1; i < pts.length; i++) d += hav(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng); return d }
function mapSVG(pts: GP[], w: number, h: number, pad: number) {
  if (!pts.length) return [{ x: w / 2, y: h / 2 }]
  const las = pts.map(p => p.lat); const lns = pts.map(p => p.lng)
  const minLa = Math.min(...las), maxLa = Math.max(...las); const minLo = Math.min(...lns), maxLo = Math.max(...lns)
  const rLa = (maxLa - minLa) || 0.002; const rLo = (maxLo - minLo) || 0.002
  const s = Math.min((w - pad * 2) / rLo, (h - pad * 2) / rLa)
  return pts.map(p => ({ x: pad + (p.lng - minLo) * s + ((w - pad * 2) - rLo * s) / 2, y: pad + (maxLa - p.lat) * s + ((h - pad * 2) - rLa * s) / 2 }))
}
function makePath(m: { x: number; y: number }[]) { if (m.length < 2) return ''; return `M${m[0].x.toFixed(1)},${m[0].y.toFixed(1)}` + m.slice(1).map(p => ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('') }

/* ═══════════════════════════════════════════════════════════════
   VITAL IMPORT PARSER
   ═══════════════════════════════════════════════════════════════ */
const KM: Record<string, string> = { date:'date',tanggal:'date',heartrate:'heartRate',hr:'heartRate',nadi:'heartRate',steps:'steps',langkah:'steps',systolic:'systolic',sistolik:'systolic',spo2:'spo2',oxygen:'spo2',oksigen:'spo2',hrv:'hrv',rmssd:'hrv',vo2max:'vo2Max',vo2:'vo2Max' }
const nk = (k: string) => KM[k.toLowerCase().trim().replace(/[\s_-]/g, '')] ?? ''
function parseF(t: string, fn: string): IV[] {
  const isJ = fn.endsWith('.json'); try {
    const d = isJ ? JSON.parse(t) : null; const rows = isJ ? (Array.isArray(d) ? d : [d]) : t.trim().split('\n').slice(1).filter(l => l.trim())
    return rows.map((r: Record<string, unknown>) => {
      const o: Record<string, unknown> = {}
      if (isJ) Object.entries(r).forEach(([k, v]) => { const m = nk(k); if (m && v != null) o[m] = typeof v === 'number' ? v : parseFloat(v as string) || undefined })
      else { const vs = (r as unknown as string).split(',').map((v: string) => v.trim()); const hs = t.trim().split('\n')[0].split(',').map(nk); hs.forEach((h, i) => { if (h && h !== 'date' && vs[i] != null) { const n = parseFloat(vs[i]); if (!isNaN(n)) o[h] = n } }); if (vs[hs.indexOf('date')]) o.date = vs[hs.indexOf('date')] }
      return o as unknown as IV
    }).filter((v: IV) => v.date)
  } catch { return [] }
}
function avgIV(v: IV[]) { if (!v.length) return { avgHR: undefined, avgSpo2: undefined, avgSteps: undefined, avgHrv: undefined, vo2Max: undefined, avgSys: undefined, n: 0 }; const a = (k: keyof IV) => { const x = v.map(i => i[k]).filter((x): x is number => typeof x === 'number'); return x.length ? Math.round(x.reduce((a, b) => a + b, 0) / x.length * 10) / 10 : undefined }; return { avgHR: a('heartRate'), avgSpo2: a('spo2'), avgSteps: a('steps'), avgHrv: a('hrv'), vo2Max: a('vo2Max'), avgSys: a('systolic'), n: v.length } }

/* ═══════════════════════════════════════════════════════════════
   RECOMMENDATION ENGINE
   ═══════════════════════════════════════════════════════════════ */
function genRecs(b: Body, intake: number, prot: number, fiber: number, metH: number, sleep: number, water: number, sun: boolean, hr?: number, sys?: number, spo2?: number): Rec[] {
  const r: Rec[] = []; const b_ = getBmi(b.w, b.h); const t_ = getTdee(getBmr(b.w, b.h, b.age, b.g), b.act)
  const add = (e: string, t: string, d: string, pr: number, c: string) => r.push({ e, t, d, pr, c })
  if (b_ < 18.5) add('⚠️', 'Berat kurang', `BMI ${b_.toFixed(1)}. Tambah +${Math.round(t_ * 0.15)} kkal/hari dengan protein & karbo kompleks.`, 0, C.blue)
  else if (b_ >= 25 && b_ < 30) add('⚠️', 'Berat berlebih', `BMI ${b_.toFixed(1)}. Defisit ${Math.round(t_ * 0.2)} kkal/hari + olahraga teratur.`, 0, C.org)
  else if (b_ >= 30) add('🚨', 'Obesitas', `BMI ${b_.toFixed(1)}. Konsultasi dokter untuk program penurunan berat terstruktur.`, 0, C.bad)
  else add('✅', 'BMI ideal', `BMI ${b_.toFixed(1)} — pertahankan pola saat ini.`, 3, C.ok)
  const diff = intake - t_; const pct = t_ > 0 ? diff / t_ : 0
  if (pct > 0.2) add('🍽️', 'Surplus tinggi', `+${Math.round(diff)} kkal di atas TDEE. Risiko kenaikan berat.`, 1, C.warn)
  else if (pct < -0.3) add('📉', 'Defisit ekstrem', `-${Math.round(Math.abs(diff))} kkal. Metabolisme bisa melambat.`, 1, C.warn)
  const pk = b.w > 0 ? prot / b.w : 0
  if (pk < 1.0) add('🥩', 'Protein rendah', `${prot}g (${pk.toFixed(1)}g/kg). Target 1.2-1.6g/kg.`, 1, C.pur)
  else if (pk >= 1.2) add('✅', 'Protein memadai', `${prot}g (${pk.toFixed(1)}g/kg BB). Cukup.`, 3, C.ok)
  if (fiber < 20) add('🥬', 'Serat kurang', `${Math.round(fiber)}g — target 25g+. Tambah sayur & buah.`, 2, C.warn)
  if (metH < 3.75) add('🏃', 'Olahraga kurang', `${metH.toFixed(1)} MET-jam/minggu. Target 7.5 (150 menit jalan cepat).`, 0, C.org)
  else if (metH >= 7.5) add('✅', 'Olahraga memadai', `${metH.toFixed(1)} MET-jam/minggu. Memenuhi rekomendasi WHO.`, 3, C.ok)
  if (sleep < 6) add('🌙', 'Tidur kurang', `${sleep} jam — risiko hipertensi & diabetes. Target 7-8 jam.`, 0, C.ind)
  if (water < 1500) add('💧', 'Hidrasi kurang', `${water} mL — target 2000 mL+.`, 2, C.blue)
  if (!sun) add('☀️', 'Tanpa matahari', '10-20 menit pagi untuk vitamin D.', 3, '#eab308')
  if (hr != null && hr > 80) add('💓', 'HR istirahat tinggi', `${hr} bpm — optimal <75. Tingkatkan kardio zona-2.`, 1, C.bad)
  if (sys != null && sys > 130) add('🩺', 'Tekanan darah tinggi', `${sys} mmHg — kurangi garam, tingkatkan aktivitas.`, 0, C.bad)
  if (spo2 != null && spo2 < 96) add('🫁', 'SpO₂ rendah', `${spo2}% — normal ≥97%. Periksa ke faskes.`, 0, C.bad)
  return r.sort((a, b) => a.pr - b.pr)
}

/* ═══════════════════════════════════════════════════════════════
   LONGEVITY COMPUTATION
   ═══════════════════════════════════════════════════════════════ */
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }
function calcLong(i: { sleepHr: number; hydrationL: number; sunDone: boolean; sunHr: number; bmiVal?: number; tdeeVal?: number; intakeKcal?: number; proteinG?: number; weightKg?: number; fiberG?: number; metHoursWeek?: number; avgHR?: number; avgSpo2?: number; avgSteps?: number; avgHrv?: number; vo2Max?: number; avgSys?: number }) {
  const sleep = clamp(i.sleepHr >= 7 && i.sleepHr <= 9 ? 100 : 100 - Math.abs(i.sleepHr - 8) * 16)
  const hydr = clamp(i.hydrationL >= 2 && i.hydrationL <= 3.5 ? 100 : 100 - Math.abs(i.hydrationL - 2.5) * 28)
  const sun = clamp(!i.sunDone ? 40 : i.sunHr >= 0.17 && i.sunHr <= 0.6 ? 100 : 100 - Math.abs(i.sunHr - 0.33) * 80)
  const exer = i.metHoursWeek != null ? clamp((i.metHoursWeek / 7.5) * 100) : 50
  let bodyS = 50; if (i.bmiVal != null) { const v = i.bmiVal; bodyS = v >= 18.5 && v < 23 ? 100 : v >= 23 && v < 25 ? 80 : v >= 25 && v < 30 ? 55 : v >= 30 ? 30 : clamp(100 - (18.5 - v) * 15) }
  let nutS = 50; if (i.proteinG != null && i.weightKg != null && i.fiberG != null) { const pk = i.proteinG / i.weightKg; const ps = pk >= 1.2 && pk <= 2 ? 100 : pk >= 0.8 ? 70 : clamp(pk * 80); const fs = i.fiberG >= 25 ? 100 : i.fiberG >= 15 ? 70 : clamp(i.fiberG * 3.5); nutS = clamp(ps * 0.6 + fs * 0.4) }
  let calS = 50; if (i.tdeeVal != null && i.tdeeVal > 0 && i.intakeKcal != null) { const r = i.intakeKcal / i.tdeeVal; calS = r >= 0.8 && r <= 1.05 ? 100 : r >= 0.7 ? 75 : r > 1.05 && r <= 1.15 ? 80 : clamp(100 - Math.abs(r - 1) * 150) }
  let vitS = 50; const vp: number[] = []
  if (i.avgHR != null) vp.push(clamp(i.avgHR >= 55 && i.avgHR <= 75 ? 100 : 100 - Math.abs(i.avgHR - 65) * 2.5))
  if (i.avgSpo2 != null) vp.push(clamp(i.avgSpo2 >= 97 ? 100 : 100 - (97 - i.avgSpo2) * 25))
  if (i.avgSteps != null) vp.push(clamp(i.avgSteps >= 8000 ? 100 : (i.avgSteps / 8000) * 100))
  if (i.avgHrv != null) vp.push(clamp(i.avgHrv >= 40 ? 100 : (i.avgHrv / 40) * 100))
  if (i.vo2Max != null) vp.push(clamp(i.vo2Max >= 40 ? 100 : (i.vo2Max / 40) * 100))
  if (i.avgSys != null) vp.push(clamp(i.avgSys >= 110 && i.avgSys <= 130 ? 100 : 100 - Math.abs(i.avgSys - 120) * 2))
  if (vp.length) vitS = clamp(vp.reduce((a, b) => a + b, 0) / vp.length)
  const hasB = i.bmiVal != null; const hasV = vp.length > 0
  if (hasB) { const wv = hasV ? 0.05 : 0; const base = 1 - wv; return { score: clamp(bodyS * 0.20 * base + nutS * 0.15 * base + exer * 0.20 * base + sleep * 0.15 * base + calS * 0.10 * base + hydr * 0.10 * base + sun * 0.10 * base + vitS * wv), body: bodyS, nut: nutS, exer, sleep, cal: calS, hydr, sun, vit: vitS, hasB, hasV } }
  const wv = hasV ? 0.15 : 0; const base = 1 - wv
  return { score: clamp(exer * 0.25 * base + sleep * 0.25 * base + hydr * 0.15 * base + sun * 0.15 * base + nutS * 0.10 * base + calS * 0.10 * base + vitS * wv), body: bodyS, nut: nutS, exer, sleep, cal: calS, hydr, sun, vit: vitS, hasB, hasV }
}

/* ═══════════════════════════════════════════════════════════════
   WELLNESS HELPER
   ═══════════════════════════════════════════════════════════════ */
function getW(s: ReturnType<typeof useStore>['state'], d: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = (s.wellness?.[d] ?? {}) as any
  return { sleepHr: (w.sleepHr as number) ?? 0, waterMl: (w.waterMl as number) ?? 0, exerciseKcal: (w.exerciseKcal as number) ?? 0, exerciseMin: (w.exerciseMin as number) ?? 0, metHours: (w.metHours as number) ?? 0 }
}

/* ═══════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
   ═══════════════════════════════════════════════════════════════ */
function Empty({ e, t }: { e: string; t: string }) { return <div className="rounded-xl border-2 border-dashed border-neutral-200 py-8 text-center"><span className="text-3xl">{e}</span><p className="mt-2 text-sm text-neutral-400">{t}</p></div> }

function Ring({ value, max, color, size = 64, sw = 5, children }: { value: number; max: number; color: string; size?: number; sw?: number; children: React.ReactNode }) {
  const [on, setOn] = useState(false); useEffect(() => { requestAnimationFrame(() => setOn(true)) }, [])
  const r = (size - sw) / 2; const c = 2 * Math.PI * r; const off = c * (1 - (on ? Math.min(1, value / (max || 1)) : 0))
  return (<div className="relative inline-flex items-center justify-center"><svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity="0.12" strokeWidth={sw} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1)' }} /></svg><div className="absolute flex flex-col items-center">{children}</div></div>)
}

function Stepper({ value, min, max, step = 1, unit, onChange }: { value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (<div className="flex items-center gap-2"><button onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-sm font-bold text-neutral-500 transition hover:bg-neutral-200 active:scale-90">−</button><div className="flex-1 text-center text-sm font-bold tabular-nums">{value}{unit ? ` ${unit}` : ''}</div><button onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-sm font-bold text-brand-dark transition hover:bg-brand/20 active:scale-90">+</button></div>)
}

function Pillar({ label, v, hl }: { label: string; v: number; hl?: boolean }) {
  const [on, setOn] = useState(false); useEffect(() => { requestAnimationFrame(() => setOn(true)) }, [])
  return (<div><div className="mb-0.5 flex justify-between text-[11px] font-medium"><span className={hl ? 'text-white font-bold' : 'text-white/70'}>{label}</span><span className="font-bold">{v}</span></div><div className={`h-1.5 overflow-hidden rounded-full ${hl ? 'bg-white/30' : 'bg-white/20'}`}><div className={`h-full rounded-full transition-all duration-700 ${hl ? 'bg-yellow-300' : 'bg-white'}`} style={{ width: `${on ? v : 0}%` }} /></div></div>)
}

function ANum({ v, d = 0 }: { v: number; d?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => { const el = ref.current; if (!el) return; let cur = Number(el.textContent) || 0; if (Math.abs(cur - v) < 0.01) return; const s = cur, t0 = performance.now(); let raf = 0; const tick = (now: number) => { const p = Math.min(1, (now - t0) / 500); cur = s + (v - s) * (1 - (1 - p) ** 3); el.textContent = cur.toFixed(d); if (p < 1) raf = requestAnimationFrame(tick) }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf) }, [v, d])
  return <span ref={ref}>{v.toFixed(d)}</span>
}

/* ═══════════════════════════════════════════════════════════════
   1. BODY PROFILE CARD
   ═══════════════════════════════════════════════════════════════ */
function BodyCard({ intakeKcal, onShare }: { intakeKcal: number; onShare: () => void }) {
  const [b, setB] = useState(loadB); useBR(); const [edit, setEdit] = useState(false)
  const bi = getBmi(b.w, b.h); const bm = getBmr(b.w, b.h, b.age, b.g); const td = getTdee(bm, b.act); const rec = Math.round(td * (1 + goalAdj(b.goal))); const info = bmiInfo(bi)
  function save() { saveB(b); emitB(); setEdit(false) }
  if (!edit) return (
    <Card className="!p-5">
      <div className="flex items-center justify-between"><SectionTitle icon={<span className="text-lg">⚖️</span>} title="Profil Tubuh" /><div className="flex gap-2"><button onClick={onShare} className="rounded-lg bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand-dark transition hover:bg-brand/20 active:scale-95">📣 Share</button><button onClick={() => setEdit(true)} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-600 transition hover:bg-neutral-200 active:scale-95">✏️ Edit</button></div></div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-100 p-3 text-center"><div className="text-2xl font-extrabold" style={{ color: info.c }}><ANum v={bi} d={1} /></div><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">BMI · {info.l}</div><div className="mt-1.5 h-1 rounded-full bg-neutral-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, bi / 40 * 100)}%`, background: info.c }} /></div></div>
        <div className="rounded-xl border border-neutral-100 p-3 text-center"><div className="text-2xl font-extrabold text-indigo-500"><ANum v={Math.round(bm)} /></div><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">BMR kkal</div><div className="mt-1 text-[10px] text-neutral-400">{b.g === 'M' ? 'Laki-laki' : 'Perempuan'}, {b.age} th</div></div>
        <div className="rounded-xl border border-neutral-100 p-3 text-center"><div className="text-2xl font-extrabold text-brand-dark"><ANum v={Math.round(td)} /></div><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">TDEE kkal</div><div className="mt-1 text-[10px] text-neutral-400">{ACT_L[b.act]}</div></div>
        <div className="rounded-xl border border-neutral-100 p-3 text-center"><div className="text-lg font-extrabold" style={{ color: intakeKcal > rec * 1.1 ? C.org : intakeKcal < rec * 0.8 ? C.blue : C.ok }}><ANum v={intakeKcal} />/<ANum v={rec} /></div><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">Kkal hari ini</div><div className="mt-1 text-[10px]" style={{ color: intakeKcal > rec ? C.org : C.ok }}>{intakeKcal > rec ? `+${intakeKcal - rec} surplus` : `${rec - intakeKcal} tersisa`}</div></div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-neutral-400">{b.w}kg · {b.h}cm · Target: {b.goal === 'lose' ? 'Turun' : b.goal === 'gain' ? 'Naik' : 'Pertahankan'}</div>
    </Card>
  )
  return (
    <Card className="!p-5"><SectionTitle icon={<span className="text-lg">✏️</span>} title="Edit Profil Tubuh" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Berat (kg)"><input className={inputClass} type="number" value={b.w} onChange={e => setB({ ...b, w: +e.target.value })} /></Field>
        <Field label="Tinggi (cm)"><input className={inputClass} type="number" value={b.h} onChange={e => setB({ ...b, h: +e.target.value })} /></Field>
        <Field label="Usia"><input className={inputClass} type="number" value={b.age} onChange={e => setB({ ...b, age: +e.target.value })} /></Field>
        <Field label="Jenis Kelamin"><select className={inputClass} value={b.g} onChange={e => setB({ ...b, g: e.target.value as 'M' | 'F' })}><option value="M">Laki-laki</option><option value="F">Perempuan</option></select></Field>
        <Field label="Aktivitas Harian"><select className={inputClass} value={b.act} onChange={e => setB({ ...b, act: +e.target.value })}>{ACT_L.map((l, i) => <option key={l} value={i}>{l}</option>)}</select></Field>
        <Field label="Goal"><select className={inputClass} value={b.goal} onChange={e => setB({ ...b, goal: e.target.value as Body['goal'] })}><option value="lose">Turun berat</option><option value="maintain">Pertahankan</option><option value="gain">Naik berat</option></select></Field>
      </div>
      <div className="mt-3 flex gap-2 justify-end"><Button variant="outline" onClick={() => setEdit(false)} className="h-9 text-xs rounded-xl">Batal</Button><Button onClick={save} className="h-9 text-xs rounded-xl">Simpan</Button></div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   2. FOOD TRACKER
   ═══════════════════════════════════════════════════════════════ */
function FoodTracker({ body }: { body: Body }) {
  const { state, addFood } = useStore()
  const [q, setQ] = useState(''); const [cat, setCat] = useState('Semua'); const [name, setName] = useState(FD[0].name); const [g, setG] = useState(100)
  const todays = state.foods.filter(f => f.date === today())
  const total = todays.reduce((a, f) => ({ k: a.k + f.kcal, c: a.c + f.carbs, p: a.p + f.protein, f: a.f + f.fat }), { k: 0, c: 0, p: 0, f: 0 })
  const fiber = todays.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.fb * f.grams / 100 : 0) }, 0)
  const rec = Math.round(getTdee(getBmr(body.w, body.h, body.age, body.g), body.act) * (1 + goalAdj(body.goal)))
  const filtered = FD.filter(f => (cat === 'Semua' || f.cat === cat) && (!q || f.name.toLowerCase().includes(q.toLowerCase())))
  const fd = FD.find(x => x.name === name) ?? FD[0]; const m = g / 100
  const pv = { k: Math.round(fd.k * m), c: Math.round(fd.c * m), p: Math.round(fd.p * m), f: Math.round(fd.f * m), fb: Math.round(fd.fb * m) }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<span className="text-lg">🍽️</span>} title="Nutrisi" subtitle={`${total.k}/${rec} kkal hari ini`} />
      <div className="mt-3 flex items-center justify-around">
        {([['Karbo', total.c, Math.round(rec * 0.5 / 4), '#f59e0b'], ['Protein', total.p, Math.round(body.w * 1.4), C.ok], ['Lemak', total.f, Math.round(rec * 0.3 / 9), '#ef4444'], ['Serat', Math.round(fiber), 25, C.pur]] as const).map(([l, v, mx, c]) => (
          <div key={l} className="flex flex-col items-center gap-1"><Ring value={v} max={mx} color={c}><span className="text-xs font-extrabold tabular-nums" style={{ color: c }}>{v}</span><span className="text-[8px] text-neutral-400">g</span></Ring><span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{l}</span></div>
        ))}
      </div>
      <div className="mt-4 flex gap-2"><div className="flex-1"><input className={inputClass} placeholder="Cari makanan..." value={q} onChange={e => setQ(e.target.value)} /></div><select className={`${inputClass} w-28`} value={cat} onChange={e => setCat(e.target.value)}><option>Semua</option>{FCATS.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50/50 p-2">
        {filtered.map(f => <button key={f.name} onClick={() => setName(f.name)} className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition active:scale-95 ${name === f.name ? 'border-brand bg-brand/10 text-brand-dark' : 'border-transparent text-neutral-600 hover:bg-white'}`}>{f.emoji} {f.name} <span className="text-neutral-400">{f.k}</span></button>)}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="flex-1 rounded-xl bg-neutral-50 px-4 py-3"><div className="flex items-baseline gap-2"><span className="text-sm font-bold text-neutral-800">{fd.emoji} {name}</span><Badge tone="neutral">{fd.cat}</Badge></div><div className="mt-1 flex gap-3 text-xs tabular-nums font-semibold"><span style={{ color: C.ok }}>{pv.k} kkal</span><span className="text-amber-500">K{pv.c}</span><span className="text-green-600">P{pv.p}</span><span className="text-red-400">L{pv.f}</span><span className="text-purple-500">S{pv.fb}</span></div></div>
        <div className="w-20"><Field label="Gram"><input className={inputClass} type="number" value={g} onChange={e => setG(+e.target.value)} /></Field></div>
        <Button onClick={() => addFood({ id: uid(), date: today(), name, grams: g, kcal: pv.k, carbs: pv.c, protein: pv.p, fat: pv.f })} className="h-[42px] shrink-0 rounded-xl"><IconPlus size={15} /></Button>
      </div>
      <div className="mt-3 space-y-1">{todays.length === 0 && <Empty e="🍽️" t="Belum ada makanan" />}{todays.map(f => { const s = FD.find(x => x.name === f.name); return (<div key={f.id} className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-neutral-50"><div className="min-w-0 flex-1"><span className="text-sm font-medium">{s?.emoji} {f.name}</span><span className="ml-2 text-[10px] text-neutral-400">{f.grams}g</span></div><div className="shrink-0 tabular-nums text-xs"><span className="font-bold text-brand-dark">{f.kcal}</span><span className="text-neutral-400 ml-1">kkal</span></div></div>) })}</div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   3. GPS EXERCISE TRACKER
   ═══════════════════════════════════════════════════════════════ */
type GMode = 'idle' | 'planning' | 'tracking' | 'paused' | 'done'
function GPSTracker({ body, onComplete }: { body: Body; onComplete: (kcal: number, min: number, metH: number) => void }) {
  const [mode, setMode] = useState<GMode>('idle'); const [exType, setExType] = useState(EX[0]); const [exCat, setExCat] = useState('Kardio')
  const [pts, setPts] = useState<GP[]>([]); const [plan, setPlan] = useState<WP[]>([]); const [dur, setDur] = useState(0); const [hr, setHr] = useState(0); const [gpsErr, setGpsErr] = useState(''); const [shared, setShared] = useState(false)
  const wRef = useRef<number | null>(null); const tRef = useRef<number | null>(null); const sRef = useRef(0); const svgRef = useRef<SVGSVGElement>(null); const { addPost, account } = useStore()
  const dist = totalDist(pts); const speed = dur > 0 ? (dist / dur) * 3.6 : 0
  const mapped = mapSVG(pts, 360, 240, 20); const pathD = makePath(mapped)
  const kcal = getMetBurn(exType.met, body.w, dur / 60); const metH = exType.met * (dur / 3600)
  const filtered = EX.filter(e => e.cat === exCat)

  function onSvgClick(e: React.MouseEvent<SVGSVGElement>) { if (mode !== 'planning' || !svgRef.current) return; const r = svgRef.current.getBoundingClientRect(); setPlan(p => [...p, { x: ((e.clientX - r.left) / r.width) * 360, y: ((e.clientY - r.top) / r.height) * 240 }]) }
  function startTrack() { if (!exType.gps) { setGpsErr('GPS tidak tersedia untuk ini. Gunakan mode manual.'); return }; setGpsErr(''); setMode('tracking'); setPts([]); setDur(0); sRef.current = Date.now(); tRef.current = window.setInterval(() => setDur((Date.now() - sRef.current) / 1000), 1000); if (!navigator.geolocation) { setGpsErr('GPS tidak didukung.'); return } wRef.current = navigator.geolocation.watchPosition(pos => setPts(p => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined }]), err => setGpsErr(`GPS error: ${err.message}`), { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }) }
  function pause() { setMode('paused'); if (wRef.current) navigator.geolocation.clearWatch(wRef.current); if (tRef.current) clearInterval(tRef.current) }
  function resume() { setMode('tracking'); const off = dur * 1000; sRef.current = Date.now() - off; tRef.current = window.setInterval(() => setDur((Date.now() - sRef.current) / 1000), 1000); wRef.current = navigator.geolocation.watchPosition(pos => setPts(p => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined }]), () => {}, { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }) }
  function stop() { setMode('done'); if (wRef.current) navigator.geolocation.clearWatch(wRef.current); if (tRef.current) clearInterval(tRef.current); onComplete(kcal, dur / 60, metH) }
  function reset() { setMode('idle'); setPts([]); setPlan([]); setDur(0); setHr(0); setGpsErr('') }
  function share() { addPost({ id: uid(), authorEmail: account?.email ?? '', authorName: account?.name ?? 'Saya', role: account?.role ?? 'pasien', postType: 'kebiasaan', kind: 'image', activity: exType.name, caption: `${exType.emoji} ${exType.name} — ${fmtDist(dist)} · ${fmtD(dur)} · ${Math.round(speed)} km/h · ${kcal} kkal 🔥 #Olahraga`, mediaColor: exType.met >= 7 ? C.org : C.ok, calories: kcal, likes: 0, comments: 0, reposts: 0, at: new Date().toISOString() }); setShared(true); setTimeout(() => setShared(false), 3000) }
  function planPathD() { if (plan.length < 2) return ''; return `M${plan[0].x.toFixed(1)},${plan[0].y.toFixed(1)}` + plan.slice(1).map(p => ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('') }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3"><SectionTitle icon={<span className="text-lg">🗺️</span>} title="GPS Tracker" subtitle="Lacak rute, kecepatan, dan kalori" />{mode === 'done' && <button onClick={share} className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand/90 active:scale-95">{shared ? '✓ Shared!' : '📣 Share'}</button>}</div>
      <div className="px-5 pb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">{EXCATS.map(c => <button key={c} onClick={() => { setExCat(c); const f = EX.filter(e => e.cat === c); if (f.length) setExType(f[0]) }} className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${exCat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>{c}</button>)}</div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">{filtered.map(e => <button key={e.name} onClick={() => setExType(e)} disabled={mode === 'tracking' || mode === 'paused'} className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition active:scale-95 disabled:opacity-50 ${exType.name === e.name ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}>{e.emoji} {e.name} <span className="text-[9px] text-neutral-400">MET {e.met}</span></button>)}</div>
      </div>
      <div className="mx-5 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <svg ref={svgRef} viewBox="0 0 360 240" className="w-full cursor-crosshair" onClick={onSvgClick} style={{ minHeight: 200 }}>
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="0" x2="360" y1={i * 30} y2={i * 30} stroke="rgba(255,255,255,0.04)" />)}
          {Array.from({ length: 13 }, (_, i) => <line key={`v${i}`} x1={i * 30} x2={i * 30} y1="0" y2="240" stroke="rgba(255,255,255,0.04)" />)}
          {plan.length >= 2 && <><path d={planPathD()} fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="3" strokeDasharray="8 4" strokeLinecap="round" />{plan.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="5" fill="rgba(139,92,246,0.3)" stroke="#8b5cf6" strokeWidth="1.5" />{i > 0 && (() => { const dx = p.x - plan[i - 1].x; const dy = p.y - plan[i - 1].y; const d = Math.sqrt(dx * dx + dy * dy); return d > 40 ? <text x={(p.x + plan[i - 1].x) / 2} y={(p.y + plan[i - 1].y) / 2 - 6} textAnchor="middle" fontSize="8" fill="rgba(139,92,246,0.7)" fontWeight="600">{(d * 3.3).toFixed(0)}m</text> : null })()}</g>)}</>}
          {pathD && <><defs><linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00BF63" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs><path d={pathD} fill="none" stroke="url(#rG)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" /></>}
          {mapped.length > 0 && <>{mapped.map((p, i) => i === 0 ? <circle key={i} cx={p.x} cy={p.y} r="6" fill="#00BF63" stroke="white" strokeWidth="2" /> : i === mapped.length - 1 && mode !== 'tracking' ? <circle key={i} cx={p.x} cy={p.y} r="6" fill="#ef4444" stroke="white" strokeWidth="2" /> : null)}{(mode === 'tracking' || mode === 'paused') && mapped.length > 0 && <g><circle cx={mapped[mapped.length - 1].x} cy={mapped[mapped.length - 1].y} r="8" fill="rgba(0,191,99,0.3)"><animate attributeName="r" values="6;12;6" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" /></circle><circle cx={mapped[mapped.length - 1].x} cy={mapped[mapped.length - 1].y} r="4" fill="#00BF63" stroke="white" strokeWidth="1.5" /></g>}</>}
          {mode === 'idle' && pts.length === 0 && plan.length === 0 && <text x="180" y="115" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.3)" fontWeight="600">Pilih olahraga & tekan Mulai</text>}
          {mode === 'planning' && <text x="180" y="15" textAnchor="middle" fontSize="9" fill="rgba(139,92,246,0.8)" fontWeight="600">📍 Klik untuk menambah waypoint</text>}
        </svg>
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (<div className="grid grid-cols-4 gap-px bg-black/30">{[[fmtD(dur), 'WAKTU'], [fmtDist(dist), 'JARAK'], [`${Math.round(speed)} km/h`, 'KECEPATAN'], [fmtPace(dur, dist), 'PACE']].map(([v, l]) => <div key={l} className="bg-black/40 px-2 py-2 text-center"><div className="text-sm font-extrabold text-white tabular-nums">{v}</div><div className="text-[8px] font-bold uppercase tracking-widest text-white/40">{l}</div></div>)}</div>)}
      </div>
      <div className="p-5 space-y-3">
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (<div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-2.5"><span className="text-lg">💓</span><div className="flex-1"><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Heart Rate</div></div><input className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-sm font-bold tabular-nums" type="number" value={hr} onChange={e => setHr(+e.target.value)} placeholder="bpm" /><span className="text-[10px] text-neutral-400">bpm</span></div>)}
        {mode === 'done' && (<div className="rounded-xl bg-gradient-to-r from-brand to-emerald-600 p-4 text-white"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ringkasan</div><div className="text-2xl font-extrabold">{exType.emoji} {exType.name}</div></div><div className="text-right"><div className="text-3xl font-extrabold">{kcal}<span className="text-sm font-medium text-white/60"> kkal</span></div><div className="text-xs text-white/70">MET {exType.met} · {metH.toFixed(2)} MET-jam</div></div></div><div className="mt-2 grid grid-cols-4 gap-3 text-center text-xs"><div><div className="font-bold">{fmtDist(dist)}</div><div className="text-white/50">Jarak</div></div><div><div className="font-bold">{fmtD(dur)}</div><div className="text-white/50">Durasi</div></div><div><div className="font-bold">{Math.round(speed)} km/h</div><div className="text-white/50">Kecepatan</div></div><div><div className="font-bold">{hr || '—'} bpm</div><div className="text-white/50">HR</div></div></div></div>)}
        {gpsErr && <div className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">{gpsErr}</div>}
        <div className="flex gap-2">
          {mode === 'idle' && <><Button onClick={startTrack} disabled={!exType.gps} className="flex-1 h-11 rounded-xl text-sm font-bold"><span className="mr-1">▶</span> Mulai GPS{!exType.gps ? ' (N/A)' : ''}</Button><Button onClick={() => { setMode('planning'); setPlan([]) }} className="h-11 rounded-xl text-sm font-bold border-2 border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100">📍 Rencanakan Jalur</Button></>}
          {mode === 'planning' && <><Button onClick={() => setPlan([])} variant="outline" className="h-10 rounded-xl text-xs">🗑️ Hapus</Button><Button onClick={reset} variant="outline" className="flex-1 h-10 rounded-xl text-xs">Batal</Button><Button onClick={startTrack} disabled={!exType.gps} className="flex-1 h-10 rounded-xl text-xs font-bold">▶ Mulai</Button></>}
          {mode === 'tracking' && <><Button onClick={pause} className="flex-1 h-11 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600">⏸ Jeda</Button><Button onClick={stop} className="flex-1 h-11 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600">⏹ Selesai</Button></>}
          {mode === 'paused' && <><Button onClick={resume} className="flex-1 h-11 rounded-xl text-sm font-bold">▶ Lanjut</Button><Button onClick={stop} className="flex-1 h-11 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600">⏹ Selesai</Button></>}
          {mode === 'done' && <Button onClick={reset} className="w-full h-10 rounded-xl text-sm">Selesai & Reset</Button>}
        </div>
        {!exType.gps && mode === 'idle' && <ManualEx body={body} ex={exType} onComplete={onComplete} />}
      </div>
    </Card>
  )
}
function ManualEx({ body, ex, onComplete }: { body: Body; ex: Exer; onComplete: (kcal: number, min: number, metH: number) => void }) {
  const [min, setMin] = useState(30); const k = getMetBurn(ex.met, body.w, min); const mH = ex.met * (min / 60)
  return (<div className="rounded-xl border border-neutral-200 p-4"><div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-neutral-700">{ex.emoji} Manual — {ex.name}</span><span className="rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">{k} kkal</span></div><div className="flex items-center gap-3"><Stepper value={min} min={5} max={180} step={5} unit="menit" onChange={setMin} /><Button onClick={() => onComplete(k, min, mH)} className="h-9 text-xs rounded-xl shrink-0"><IconPlus size={14} /> Catat</Button></div></div>)
}

/* ═══════════════════════════════════════════════════════════════
   4. SLEEP, WATER & WEEKLY MET
   ═══════════════════════════════════════════════════════════════ */
function SleepWater({ body }: { body: Body }) {
  const { state, logWellness } = useStore(); const wt = getW(state, today())
  const weekMet = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return getW(state, d.toISOString().slice(0, 10)).metHours }).reduce((a, b) => a + b, 0)
  return (
    <Card className="!p-5"><SectionTitle icon={<span className="text-lg">💤</span>} title="Tidur, Air & Mingguan" />
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-100 p-3"><div className="flex items-center gap-2 mb-2"><span className="text-lg">🌙</span><span className="text-xs font-bold text-neutral-700">Tidur</span><span className="ml-auto text-sm font-extrabold text-indigo-500 tabular-nums"><ANum v={wt.sleepHr} d={1} /> jam</span></div><Stepper value={wt.sleepHr} min={0} max={12} step={0.5} unit="jam" onChange={v => logWellness(today(), { sleepHr: v })} /></div>
        <div className="rounded-xl border border-neutral-100 p-3"><div className="flex items-center gap-2 mb-2"><span className="text-lg">💧</span><span className="text-xs font-bold text-neutral-700">Air</span><span className="ml-auto text-sm font-extrabold text-blue-600 tabular-nums"><ANum v={wt.waterMl} /> mL</span></div><Stepper value={wt.waterMl} min={0} max={5000} step={250} unit="mL" onChange={v => logWellness(today(), { waterMl: v })} /></div>
        <div className="rounded-xl border border-neutral-100 p-3"><div className="flex items-center gap-2 mb-2"><span className="text-lg">⚡</span><span className="text-xs font-bold text-neutral-700">MET-jam/minggu</span><span className="ml-auto text-sm font-extrabold tabular-nums" style={{ color: weekMet >= 7.5 ? C.ok : C.org }}><ANum v={weekMet} d={1} /></span></div><div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mt-3"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, weekMet / 15 * 100)}%`, background: weekMet >= 7.5 ? C.ok : C.org }} /></div><div className="mt-1 flex justify-between text-[9px] text-neutral-400"><span>0</span><span>WHO: 7.5</span><span>15</span></div></div>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   5. 7-DAY TREND
   ═══════════════════════════════════════════════════════════════ */
function TrendChart({ recKcal }: { recKcal: number }) {
  const { state } = useStore(); const [vis, setVis] = useState(false); useEffect(() => requestAnimationFrame(() => setVis(true)), [])
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const dt = d.toISOString().slice(0, 10); return { dt, k: state.foods.filter(f => f.date === dt).reduce((a, f) => a + f.kcal, 0) } })
  const has = days.some(d => d.k)
  const W = 340, H = 120, base = 105, pad = 15; const xs = days.map((_, i) => pad + i * ((W - pad * 2) / 6))
  const nK = days.map(d => Math.min(1, d.k / (recKcal || 2000))); const yK = nK.map(v => base - v * (base - 15))
  const lineD = xs.length ? `M${xs[0]},${yK[0]}` + xs.slice(1).map((x, i) => ` L${x},${yK[i]}`).join('') : ''; const fillD = lineD + ` L${xs[6]},${base} L${xs[0]},${base} Z`
  return (<Card className="!p-5"><SectionTitle icon={<span className="text-lg">📊</span>} title="Tren 7 Hari" />{!has ? <Empty e="📊" t="Belum ada data" /> : (<div className="mt-3 overflow-x-auto rounded-xl bg-neutral-50 p-3"><svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}><line x1={pad} x2={W - pad} y1={base} y2={base} stroke="rgba(0,0,0,0.06)" /><line x1={pad} x2={W - pad} y1={(base + 15) / 2} y2={(base + 15) / 2} stroke="rgba(0,0,0,0.03)" strokeDasharray="4 4" /><g style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.6s' }}><path d={fillD} fill={C.ok} fillOpacity="0.15" /><path d={lineD} fill="none" stroke={C.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />{days.map((d, i) => d.k > 0 && <circle key={d.dt} cx={xs[i]} cy={yK[i]} r="3.5" fill="white" stroke={C.ok} strokeWidth="2" />)}</g>{days.map((d, i) => <text key={d.dt} x={xs[i]} y={H - 2} textAnchor="middle" fontSize="8" fill="#bbb" fontWeight="500">{new Date(d.dt).toLocaleDateString('id-ID', { weekday: 'short' })}</text>)}</svg></div>)}</Card>)
}

/* ═══════════════════════════════════════════════════════════════
   6. CHRONIC MONITOR
   ═══════════════════════════════════════════════════════════════ */
const CHRONIC_MONTHLY = 50000; const CHRONIC_LIFETIME = 7500000
function ChronicMonitor() {
  const { state, activePatient, addVital, buyChronicSub } = useStore(); const p = activePatient; const vitals = state.vitals[p.id] ?? []; const latest = vitals[vitals.length - 1]
  const [show, setShow] = useState(false); const [payMsg, setPayMsg] = useState(''); const [f, setF] = useState({ sys: 120, dia: 80, hr: 78, rr: 16, temp: 36.6, spo2: 98, glu: '' })
  const active = !!state.chronicLifetime || (!!state.chronicSubExpires && new Date(state.chronicSubExpires) > new Date())
  const daysLeft = state.chronicSubExpires ? Math.max(0, Math.ceil((new Date(state.chronicSubExpires).getTime() - Date.now()) / 86400000)) : 0
  const loggedToday = !!latest && latest.takenAt.slice(0, 10) === today()
  const evals = latest ? evaluateVitals(latest, p.chronicConditions) : []; const status = overallStatus(evals)
  async function buy(plan: 'monthly' | 'lifetime') { setPayMsg(''); if (!backendEnabled) { buyChronicSub(plan); return } try { const h = await api.health(); if (!h.features.payments) { buyChronicSub(plan); return } const r = await api.createPayment(0, 'QRIS', `chronic_${plan}`); if (r.live && r.redirectUrl) { window.open(r.redirectUrl, '_blank'); setPayMsg('Selesaikan pembayaran di tab Midtrans.'); let n = 0; const iv = setInterval(async () => { n++; try { const s = await api.paymentStatus(r.orderId); if (s.status === 'paid') { clearInterval(iv); buyChronicSub(plan); setPayMsg('✅ Berhasil!') } else if (s.status === 'failed') { clearInterval(iv); setPayMsg('Gagal.') } } catch { /* retry */ } if (n >= 45) clearInterval(iv) }, 4000) } else { await api.confirmPayment(r.orderId); buyChronicSub(plan) } } catch { setPayMsg('Gagal memproses.') } }
  function save() { addVital(p.id, { id: uid(), takenAt: new Date().toISOString(), systolic: +f.sys, diastolic: +f.dia, heartRate: +f.hr, respRate: +f.rr, tempC: +f.temp, spo2: +f.spo2, glucose: f.glu ? +f.glu : undefined }); setShow(false) }
  const fields: [string, string][] = [['sys', 'Sistolik'], ['dia', 'Diastolik'], ['hr', 'Nadi'], ['rr', 'RR'], ['temp', 'Suhu'], ['spo2', 'SpO₂'], ['glu', 'Gula (ops.)']]
  if (!active) return (<Card className="!p-5 border-2 border-brand/15"><SectionTitle icon={<IconHeart size={20} />} title="Pemantauan Kronis" right={<Badge tone="high">Langganan</Badge>} /><div className="mt-4 rounded-2xl border-2 border-dashed border-brand/25 bg-brand/[0.03] p-6"><p className="text-sm text-neutral-600">Untuk pasien <b>hipertensi, diabetes, jantung</b>: catat TTV harian, sistem menilai apakah terkontrol dan memberi peringatan dini.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={() => buy('monthly')} className="rounded-xl border-2 border-neutral-200 p-4 text-left transition hover:border-brand/40 hover:shadow-sm"><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Bulanan</div><div className="mt-1 text-2xl font-extrabold">Rp{CHRONIC_MONTHLY.toLocaleString('id-ID')}<span className="text-sm font-medium text-neutral-400">/bln</span></div></button><button onClick={() => buy('lifetime')} className="relative rounded-xl border-2 border-brand bg-brand/[0.04] p-4 text-left transition hover:shadow-sm"><span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-white">Terbaik</span><div className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Lifetime</div><div className="mt-1 text-2xl font-extrabold text-brand-dark">Rp{(CHRONIC_LIFETIME / 1e6).toLocaleString('id-ID')}jt</div></button></div>{payMsg && <p className="mt-3 text-xs font-semibold text-brand-dark">{payMsg}</p>}</div></Card>)
  return (<Card className="!p-5 border-2 border-brand/15"><div className="flex flex-wrap items-start justify-between gap-2"><SectionTitle icon={<IconHeart size={20} />} title="Pemantauan Kronis" /><Badge tone="brand">{state.chronicLifetime ? '∞ Lifetime' : `${daysLeft} hari`}</Badge></div>{!loggedToday && (<div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/[0.04] px-4 py-2.5"><span className="flex items-center gap-2 text-sm font-medium text-brand-dark"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-brand" /></span>Belum catat TTV hari ini</span><Button onClick={() => setShow(true)} className="h-7 text-xs rounded-xl">Catat</Button></div>)}{status === 'alert' && (<div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3"><span className="text-sm font-medium text-red-700"><b>Tanda vital berbahaya.</b> Segera konsultasi atau darurat.</span><div className="flex gap-2"><Link to="/consult"><Button variant="outline" className="h-7 text-xs rounded-xl"><IconStethoscope size={13} /> Konsultasi</Button></Link><Link to="/hospitals"><Button className="h-7 text-xs rounded-xl"><IconHospital size={13} /> SOS</Button></Link></div></div>)}{status === 'warn' && (<div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5"><span className="text-sm font-medium text-amber-800">⚠️ Sebagian nilai di luar target.</span><Link to="/consult"><Button variant="outline" className="h-7 text-xs rounded-xl">Konsultasi</Button></Link></div>)}<div className="mt-3 flex items-center justify-between gap-2"><span className="text-sm text-neutral-500">Status: <b style={{ color: STATUS_COLOR[status] }}>{latest ? STATUS_LABEL[status] : 'Belum ada data'}</b></span><Button variant="outline" onClick={() => setShow(s => !s)} className="h-7 text-xs rounded-xl"><IconPlus size={13} /> Catat TTV</Button></div>{show && (<div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 sm:grid-cols-4">{fields.map(([key, label]) => <Field key={key} label={label}><input className={inputClass} type="number" value={(f as Record<string, string | number>)[key]} onChange={e => setF({ ...f, [key]: e.target.value } as typeof f)} /></Field>)}<div className="flex items-end"><Button onClick={save} className="h-[38px] rounded-xl">Simpan</Button></div></div>)}{latest ? (<><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{evals.map(e => (<div key={e.label} className="relative overflow-hidden rounded-xl border border-neutral-100 p-3"><div className="absolute left-0 top-0 h-full w-1" style={{ background: STATUS_COLOR[e.status] }} /><div className="pl-2"><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{e.label}</div><div className="mt-0.5 text-xl font-extrabold tabular-nums" style={{ color: STATUS_COLOR[e.status] }}>{e.value} <span className="text-[10px] font-medium text-neutral-400">{e.unit}</span></div><div className="mt-0.5 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[e.status] }} /><span className="text-[10px] text-neutral-400">{e.target} · {STATUS_LABEL[e.status]}</span></div></div></div>))}</div><p className="mt-2 text-[10px] text-neutral-400">{vitals.length} catatan · terakhir {new Date(latest.takenAt).toLocaleString('id-ID')}</p></>) : <Empty e="🩺" t="Belum ada catatan TTV" />}</Card>)
}

/* ═══════════════════════════════════════════════════════════════
   7. LONGEVITY CALCULATOR + VITAL IMPORT + RECOMMENDATIONS
   ═══════════════════════════════════════════════════════════════ */
const PRICE_LONGEVITY = 125000
function LongevityCalc({ body, intakeKcal, proteinG, fiberG, weekMetHours }: { body: Body; intakeKcal: number; proteinG: number; fiberG: number; weekMetHours: number }) {
  const { state, account, buyLongevitySub, addPost } = useStore()
  const [shared, setShared] = useState(false); const [sleepHr, setSleepHr] = useState(7); const [hydrationL, setHydrationL] = useState(2); const [sunDone, setSunDone] = useState(false); const [sunHr, setSunHr] = useState(0.25)
  const [iv, setIv] = useState<IV[]>([]); const [ivSum, setIvSum] = useState<ReturnType<typeof avgIV> | null>(null); const [iMsg, setIMsg] = useState(''); const [drag, setDrag] = useState(false); const [btHR, setBtHR] = useState<number | null>(null); const [btL, setBtL] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof calcLong> | null>(null)
  const fRef = useRef<HTMLInputElement>(null)
  const subActive = !!state.longevitySubExpires && new Date(state.longevitySubExpires) > new Date()
  const daysLeft = state.longevitySubExpires ? Math.max(0, Math.ceil((new Date(state.longevitySubExpires).getTime() - Date.now()) / 86400000)) : 0
  const bi = getBmi(body.w, body.h); const bm = getBmr(body.w, body.h, body.age, body.g); const td = getTdee(bm, body.act)

  const handleFile = useCallback((file: File) => { const r = new FileReader(); r.onload = (e) => { const p = parseF(e.target?.result as string, file.name); if (!p.length) { setIMsg('❌ Tidak ada data. Pastikan ada kolom "date".'); return } setIv(p); const s = avgIV(p); setIvSum(s); setIMsg(`✅ ${s.n} data diimpor.`); if (btHR != null) { const ts = today(); if (!p.some(v => v.date === ts)) { const u = [...p, { date: ts, heartRate: btHR }]; setIv(u); setIvSum(avgIV(u)) } } }; r.readAsText(file) }, [btHR])
  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [handleFile])
  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDrag(true) }, [])
  async function connectBT() { if (!navigator.bluetooth) { setIMsg('❌ Browser tidak mendukung Web Bluetooth.'); return }; setBtL(true); setIMsg('Mencari perangkat...'); try { const dev = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] }); const srv = await dev.gatt.connect(); const chr = await srv.getPrimaryService('heart_rate').then(s => s.getCharacteristic('heart_rate_measurement')); const hr = await new Promise<number>((res, rej) => { const t = setTimeout(() => { chr.stopNotifications(); rej(new Error('Timeout')) }, 15000); chr.addEventListener('characteristicvaluechanged', (ev) => { const v = (ev.target as BluetoothRemoteGATTCharacteristic).value!; const h = v.getUint8(0) & 0x01 ? v.getUint16(1, true) : v.getUint8(1); clearTimeout(t); chr.stopNotifications(); res(h) }); chr.startNotifications() }); setBtHR(hr); setIMsg(`✅ HR: ${hr} bpm`); const ts = today(); if (!iv.some(v => v.date === ts)) { const u = [...iv, { date: ts, heartRate: hr }]; setIv(u); setIvSum(avgIV(u)) } srv.disconnect() } catch (err: unknown) { setIMsg(`❌ ${err instanceof Error ? err.message : 'Gagal'}`) } finally { setBtL(false) } }

  function compute() { setResult(calcLong({ sleepHr, hydrationL, sunDone, sunHr, bmiVal: bi, tdeeVal: td, intakeKcal, proteinG, weightKg: body.w, fiberG, metHoursWeek: weekMetHours, avgHR: ivSum?.avgHR, avgSpo2: ivSum?.avgSpo2, avgSteps: ivSum?.avgSteps, avgHrv: ivSum?.avgHrv, vo2Max: ivSum?.vo2Max, avgSys: ivSum?.avgSys })) }
  function shareFeed() { if (!result) return; addPost({ id: uid(), authorEmail: account?.email ?? '', authorName: account?.name ?? 'Saya', role: account?.role ?? 'pasien', postType: 'kebiasaan', kind: 'image', activity: 'Longevity', caption: `Skor Longevity: ${result.score}/100 ${result.hasV ? '(+vital)' : ''} 🌱 #PerjalananSehat`, mediaColor: '#00BF63', waterMl: Math.round(hydrationL * 1000), veggieServ: 0, sleepHr, sugaryDrinks: 0, likes: 0, comments: 0, reposts: 0, at: new Date().toISOString() }); setShared(true); setTimeout(() => setShared(false), 3000) }
  
  const recs = genRecs(body, intakeKcal, proteinG, fiberG, weekMetHours, sleepHr, hydrationL * 1000, sunDone, ivSum?.avgHR, ivSum?.avgSys, ivSum?.avgSpo2)

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap items-start justify-between gap-2"><SectionTitle icon={<IconSparkle size={20} />} title="Longevity & Rekomendasi" /><div className="flex gap-2">{subActive ? <Badge tone="brand">{daysLeft} hari</Badge> : <Badge tone="high">Langganan</Badge>}</div></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {/* Import Vital Signs */}
          <div className="rounded-xl border border-neutral-100 p-4">
            <div className="flex items-center gap-2 mb-2"><span className="text-base">💓</span><div><div className="text-sm font-bold">Import Tanda Vital</div><div className="text-[10px] text-neutral-400">Apple Health, Google Fit, CSV/JSON</div></div></div>
            <div className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all ${drag ? 'border-brand bg-brand/[0.06]' : 'border-neutral-200 hover:border-neutral-300'}`} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={() => setDrag(false)} onClick={() => fRef.current?.click()}><span className="text-xl">📁</span><p className="text-[11px] text-neutral-500 mt-1">Seret CSV/JSON atau klik</p><input ref={fRef} type="file" accept=".csv,.json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} /></div>
            <button onClick={connectBT} disabled={btL} className="mt-2 flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 w-full justify-center"><span className={`h-2 w-2 rounded-full ${btL ? 'animate-pulse bg-blue-400' : btHR != null ? 'bg-green-500' : 'bg-blue-400'}`} />{btL ? 'Menghubungkan...' : btHR != null ? `HR ${btHR} bpm ✓` : '⚡ Baca Heart Rate Bluetooth'}</button>
            {iMsg && <div className={`mt-2 rounded-lg px-3 py-2 text-[11px] font-medium ${iMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{iMsg}</div>}
            {ivSum && ivSum.n > 0 && (<div className="mt-2 flex flex-wrap items-center gap-1.5">{ivSum.avgHR != null && <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">HR {ivSum.avgHR}</span>}{ivSum.avgSpo2 != null && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">SpO₂ {ivSum.avgSpo2}%</span>}{ivSum.avgSteps != null && <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">{Math.round(ivSum.avgSteps).toLocaleString('id-ID')} steps</span>}{ivSum.avgHrv != null && <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">HRV {ivSum.avgHrv}</span>}{ivSum.avgSys != null && <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">Sistolik {ivSum.avgSys}</span>}<button onClick={() => { setIv([]); setIvSum(null); setIMsg(''); setBtHR(null) }} className="ml-auto text-[10px] text-neutral-400 hover:text-red-500">✕</button></div>)}
            <details className="mt-2"><summary className="cursor-pointer text-[10px] font-semibold text-neutral-400 hover:text-neutral-600">Format file</summary><div className="mt-1 rounded-lg bg-neutral-50 p-2 text-[10px] text-neutral-500 font-mono leading-relaxed">CSV: date,heart_rate,steps,spo2,systolic<br/>JSON: [{"date":"...","heartRate":72}]</div></details>
          </div>
          {/* Lifestyle Inputs */}
          <div className="rounded-xl border border-neutral-100 p-4 space-y-2">
            <Stepper label="😴 Tidur" value={sleepHr} min={0} max={12} step={0.5} unit="jam" onChange={setSleepHr} />
            <Stepper label="💧 Air" value={hydrationL} min={0} max={6} step={0.25} unit="L" onChange={setHydrationL} />
            <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sunDone} onChange={e => setSunDone(e.target.checked)} className="h-4 w-4 accent-[#00BF63] rounded" />☀️ Berjemur?</label>{sunDone && <Stepper value={sunHr} min={0} max={3} step={0.25} unit="jam" onChange={setSunHr} />}</div>
          </div>
          {subActive && <Button onClick={compute} className="w-full"><IconSparkle size={16} /> Hitung Longevity</Button>}
        </div>
        {/* Results & Recs */}
        <div className="space-y-4">
          {!subActive ? (<div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand/30 bg-brand/[0.03] p-8 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10"><IconSparkle size={24} className="text-brand" /></div><h3 className="mt-3 text-base font-bold">Nilai Longevity AI</h3><p className="mt-1 text-sm text-neutral-500">30 hari <b>Rp{PRICE_LONGEVITY.toLocaleString('id-ID')}</b></p><Button className="mt-4" onClick={() => buyLongevitySub()}><IconSparkle size={15} /> Langgani</Button></div>) : result ? (<div className="rounded-xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-lg"><div className="flex items-center gap-4"><Ring value={result.score} max={100} color="#fff" size={80} sw={6}><span className="text-2xl font-extrabold">{result.score}</span></Ring><div><div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Skor Longevity</div><div className="mt-1 text-sm text-white/80">{result.score >= 80 ? 'Sangat baik 🌟' : result.score >= 60 ? 'Cukup baik 👍' : 'Perlu perbaikan 💪'}</div></div></div><div className="mt-4 space-y-2">{result.hasB && <Pillar label="⚖️ BMI & Tubuh" v={result.body} />}<Pillar label="🥗 Nutrisi" v={result.nut} /><Pillar label="🏃 Olahraga (MET)" v={result.exer} /><Pillar label="💤 Tidur" v={result.sleep} />{result.hasB && <Pillar label="🔥 Keseimbangan Kalori" v={result.cal} />}<Pillar label="💧 Hidrasi" v={result.hydr} /><Pillar label="☀️ Matahari" v={result.sun} />{result.hasV && <Pillar label="💓 Tanda Vital" v={result.vit} hl />}</div><button onClick={shareFeed} className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-brand-dark transition hover:bg-white/90">{shared ? '✓ Dibagikan!' : '📣 Bagikan ke Feed'}</button></div>) : (<div className="flex h-full min-h-[200px] items-center justify-center rounded-xl bg-neutral-50 text-center text-sm text-neutral-400">Isi data & import vital, lalu tekan <b>"Hitung Longevity"</b></div>)}
          {/* Recommendations */}
          {recs.length > 0 && (<div><div className="text-sm font-bold text-neutral-800 mb-2">💡 Rekomendasi untuk Anda</div><div className="space-y-2">{recs.map((r, i) => (<div key={i} className="flex items-start gap-2.5 rounded-xl border border-neutral-100 p-3 transition hover:shadow-sm"><span className="text-lg shrink-0">{r.e}</span><div><div className="text-xs font-bold" style={{ color: r.c }}>{r.t}</div><p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{r.d}</p></div></div>))}</div></div>)}
        </div>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export function Nutrition() {
  const { state, logWellness, account, addPost } = useStore()
  const body = loadBody(); useBR()
  const td = getTdee(getBmr(body.w, body.h, body.age, body.g), body.act)
  const rec = Math.round(td * (1 + goalAdj(body.goal)))
  const todays = state.foods.filter(f => f.date === today())
  const intakeKcal = todays.reduce((a, f) => a + f.kcal, 0)
  const proteinG = todays.reduce((a, f) => a + f.protein, 0)
  const fiberG = todays.reduce((a, f) => { const fd = FD.find(x => x.name === f.name); return a + (fd ? fd.fb * f.grams / 100 : 0) }, 0)
  const weekMetHours = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return getW(state, d.toISOString().slice(0, 10)).metHours }).reduce((a, b) => a + b, 0)
  const wt = getW(state, today())

  function onExComplete(kcal: number, min: number, metH: number) {
    logWellness(today(), { exerciseKcal: wt.exerciseKcal + kcal, exerciseMin: wt.exerciseMin + min, metHours: wt.metHours + metH })
  }
  function shareBody() {
    const bi = getBmi(body.w, body.h); const info = bmiInfo(bi)
    addPost({ id: uid(), authorEmail: account?.email ?? '', authorName: account?.name ?? 'Saya', role: account?.role ?? 'pasien', postType: 'kebiasaan', kind: 'image', activity: 'Profil Tubuh', caption: `BMI ${bi.toFixed(1)} (${info.l}) · BMR ${Math.round(getBmr(body.w, body.h, body.age, body.g))} · TDEE ${Math.round(td)} kkal ⚖️ #HealthProfile`, mediaColor: info.c, calories: Math.round(td), waterMl: 0, veggieServ: 0, sleepHr: 0, sugaryDrinks: 0, likes: 0, comments: 0, reposts: 0, at: new Date().toISOString() })
  }

  return (
    <div className="space-y-5">
      <BodyCard intakeKcal={intakeKcal} onShare={shareBody} />
      <FoodTracker body={body} />
      <GPSTracker body={body} onComplete={onExComplete} />
      <SleepWater body={body} />
      <TrendChart recKcal={rec} />
      <ChronicMonitor />
      <LongevityCalc body={body} intakeKcal={intakeKcal} proteinG={proteinG} fiberG={fiberG} weekMetHours={weekMetHours} />
    </div>
  )
}
```
