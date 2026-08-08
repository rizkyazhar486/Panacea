import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, Field } from '../components/ui'
import { KolomAngka } from '../components/KolomAngka'
import { IconLeaf } from '../components/icons'
import { useVitalField } from '../lib/useVitals'
import { KolomVitalTerikat } from '../components/KolomVital'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Macro Lab — target makronutrien dan komposisi makan.
//
// Halaman ini dibuat karena entri "Macro Lab" di Wellness Hub selama ini
// menjanjikan "macronutrient targets and meal composition" tetapi menuju
// halaman EKONOMI MAKRO. Dua arti kata "makro" bertabrakan, dan yang membuka
// dari menu gizi mendarat di PDB dan suku bunga.
//
// Dua hal yang ditegaskan halaman ini, karena keduanya paling sering salah:
//
//   1. PROTEIN DIHITUNG DARI MASSA TUBUH, BUKAN DARI PERSENTASE KALORI.
//      "30% kalori dari protein" memberi angka yang sangat berbeda pada dua
//      orang berberat sama tapi berkalori berbeda — dan yang menentukan
//      kebutuhan protein adalah jaringan yang harus dipelihara, bukan berapa
//      banyak yang Anda makan.
//   2. LEMAK PUNYA LANTAI, BUKAN CUMA SISA. Menaruh lemak sebagai "sisa kalori
//      setelah protein dan karbohidrat" bisa menjatuhkannya ke bawah 0,5 g/kg,
//      yang mengganggu hormon dan penyerapan vitamin larut lemak. Karbohidrat
//      yang jadi penyeimbang, bukan lemak.
// ─────────────────────────────────────────────────────────────────────────────

type Tujuan = 'defisit' | 'rawat' | 'surplus'
type Aktivitas = 'ringan' | 'sedang' | 'berat' | 'atlet'

const TUJUAN: { id: Tujuan; label: string; ringkas: string; faktor: number }[] = [
  { id: 'defisit', label: 'Turun berat', ringkas: 'Defisit ±20%', faktor: 0.8 },
  { id: 'rawat', label: 'Pertahankan', ringkas: 'Sesuai kebutuhan', faktor: 1 },
  { id: 'surplus', label: 'Naik massa', ringkas: 'Surplus ±10%', faktor: 1.1 },
]

const AKTIVITAS: { id: Aktivitas; label: string; f: number }[] = [
  { id: 'ringan', label: 'Jarang olahraga', f: 1.375 },
  { id: 'sedang', label: '3-4× sepekan', f: 1.55 },
  { id: 'berat', label: '5-6× sepekan', f: 1.725 },
  { id: 'atlet', label: 'Atlet / 2× sehari', f: 1.9 },
]

/** Protein per kg berat badan menurut tujuan — rentang konsensus ISSN/ACSM. */
const PROTEIN_PER_KG: Record<Tujuan, [number, number]> = {
  defisit: [1.8, 2.4],   // lebih tinggi saat defisit: menjaga otot
  rawat: [1.4, 1.8],
  surplus: [1.6, 2.2],
}

export function MacroLabGizi() {
  const demo = useMemo(() => getDemo(), [])
  const ikatBerat = useVitalField('weightKg', demo.weightKg || 70)
  const ikatTinggi = useVitalField('heightCm', demo.heightCm || 170)
  const [berat] = ikatBerat
  const [tinggi] = ikatTinggi
  const [umur, setUmur] = useState<number | undefined>(demo.age || 30)
  const [tujuan, setTujuan] = useState<Tujuan>('rawat')
  const [aktivitas, setAktivitas] = useState<Aktivitas>('sedang')
  const [makanPerHari, setMakanPerHari] = useState<number | undefined>(3)

  const h = useMemo(() => {
    const b = berat > 0 ? berat : 70
    const t = tinggi > 0 ? tinggi : 170
    const u = umur && umur > 0 ? umur : 30
    // Mifflin-St Jeor. Dipakai pria/wanita lewat demo.sex bila ada.
    const bmr = 10 * b + 6.25 * t - 5 * u + (demo.sex === 'F' ? -161 : 5)
    const tdee = bmr * (AKTIVITAS.find((a) => a.id === aktivitas)?.f ?? 1.55)
    const target = tdee * (TUJUAN.find((x) => x.id === tujuan)?.faktor ?? 1)

    const [pLo, pHi] = PROTEIN_PER_KG[tujuan]
    const proteinG = Math.round(b * ((pLo + pHi) / 2))
    // Lantai lemak 0,8 g/kg — di bawah itu hormon dan vitamin larut lemak
    // mulai terganggu, jadi lemak TIDAK diperlakukan sebagai sisa.
    const lemakG = Math.max(Math.round(b * 0.8), Math.round((target * 0.25) / 9))
    const sisaKkal = target - proteinG * 4 - lemakG * 9
    const karboG = Math.max(0, Math.round(sisaKkal / 4))

    const perMakan = makanPerHari && makanPerHari > 0 ? makanPerHari : 3
    return {
      bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target),
      proteinG, lemakG, karboG,
      proteinLo: Math.round(b * pLo), proteinHi: Math.round(b * pHi),
      pctP: Math.round((proteinG * 4 / target) * 100),
      pctL: Math.round((lemakG * 9 / target) * 100),
      pctK: Math.round((karboG * 4 / target) * 100),
      perMakan: {
        kkal: Math.round(target / perMakan),
        protein: Math.round(proteinG / perMakan),
        karbo: Math.round(karboG / perMakan),
        lemak: Math.round(lemakG / perMakan),
      },
      seratG: Math.round((target / 1000) * 14),   // 14 g per 1000 kkal
      airL: Math.round(b * 0.033 * 10) / 10,
    }
  }, [berat, tinggi, umur, tujuan, aktivitas, makanPerHari, demo.sex])

  const bar = [
    { l: 'Protein', g: h.proteinG, pct: h.pctP, w: 'bg-emerald-500' },
    { l: 'Karbohidrat', g: h.karboG, pct: h.pctK, w: 'bg-sky-500' },
    { l: 'Lemak', g: h.lemakG, pct: h.pctL, w: 'bg-amber-500' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle
        icon={<IconLeaf />}
        title="Macro Lab"
        subtitle="Macronutrient targets and meal composition, from your own body mass"
      />

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Data Anda</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <KolomVitalTerikat ikat={ikatBerat} label="Berat (kg)" satuan="kg" step={0.1} />
          <KolomVitalTerikat ikat={ikatTinggi} label="Tinggi (cm)" satuan="cm" />
          <Field label="Umur"><KolomAngka nilai={umur} onNilai={setUmur} ariaLabel="Umur" /></Field>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Berat dan tinggi terisi dari perangkat bila sudah tersinkron; tekan Enter setelah mengubahnya
          agar dipakai di seluruh aplikasi.
        </p>

        <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">Tujuan</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {TUJUAN.map((t) => (
            <button key={t.id} onClick={() => setTujuan(t.id)} aria-pressed={tujuan === t.id}
              className={`rounded-xl p-2 text-left transition ${tujuan === t.id ? 'bg-brand/25 ring-2 ring-brand' : 'bg-white/5'}`}>
              <div className="text-[12px] font-black text-white">{t.label}</div>
              <div className="text-[10px] text-slate-400">{t.ringkas}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">Aktivitas</div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {AKTIVITAS.map((a) => (
            <button key={a.id} onClick={() => setAktivitas(a.id)} aria-pressed={aktivitas === a.id}
              className={`rounded-xl px-2.5 py-2 text-left text-[12px] font-bold transition ${aktivitas === a.id ? 'bg-brand/25 ring-2 ring-brand text-white' : 'bg-white/5 text-slate-300'}`}>
              {a.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Hasil */}
      <Card>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Target harian</div>
          <div className="text-[10px] text-slate-500">BMR {h.bmr} · TDEE {h.tdee} kkal</div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-4xl font-black text-brand">{h.target}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">kkal per hari</div>
        </div>

        <div className="mt-3 space-y-2">
          {bar.map((x) => (
            <div key={x.l}>
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="font-bold text-white">{x.l}</span>
                <span className="tabular-nums text-slate-300">{x.g} g · {x.pct}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${x.w}`} style={{ width: `${Math.min(100, x.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/5 p-2.5">
            <div className="text-[10px] font-black uppercase text-slate-400">Serat</div>
            <div className="text-lg font-black text-white">{h.seratG} g</div>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5">
            <div className="text-[10px] font-black uppercase text-slate-400">Air</div>
            <div className="text-lg font-black text-white">{h.airL} L</div>
          </div>
        </div>
      </Card>

      {/* Komposisi per makan */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Komposisi per makan</div>
          <div className="w-24">
            <Field label="Kali makan">
              <KolomAngka nilai={makanPerHari} onNilai={setMakanPerHari} ariaLabel="Kali makan per hari" />
            </Field>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          {[
            { l: 'kkal', v: h.perMakan.kkal },
            { l: 'protein', v: `${h.perMakan.protein} g` },
            { l: 'karbo', v: `${h.perMakan.karbo} g` },
            { l: 'lemak', v: `${h.perMakan.lemak} g` },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-white/5 p-2">
              <div className="text-[13px] font-black text-white">{x.v}</div>
              <div className="text-[9px] font-bold uppercase text-slate-400">{x.l}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          Pembagian rata hanya titik awal. Yang berpengaruh pada otot adalah <b>protein cukup di
          setiap kali makan</b> — sekitar {Math.max(25, h.perMakan.protein)} g sekali makan lebih
          berguna daripada menumpuk seluruh protein di makan malam.
        </p>
      </Card>

      {/* Dua hal yang paling sering salah */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Kenapa dihitung begini</div>
        <div className="mt-2 space-y-2">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-[12px] font-bold text-emerald-400">Protein dari berat badan, bukan persen kalori</div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-300">
              Rentang Anda <b>{h.proteinLo}-{h.proteinHi} g</b> ({PROTEIN_PER_KG[tujuan][0]}-{PROTEIN_PER_KG[tujuan][1]} g/kg).
              "30% kalori dari protein" memberi angka yang sangat berbeda pada dua orang berberat sama
              tapi berkalori berbeda — padahal yang menentukan kebutuhan protein adalah jaringan yang
              harus dipelihara, bukan berapa banyak yang Anda makan.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-[12px] font-bold text-amber-400">Lemak punya lantai, bukan sekadar sisa</div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-300">
              Lemak dijaga minimal <b>0,8 g/kg</b>. Menaruhnya sebagai "sisa kalori setelah protein dan
              karbohidrat" bisa menjatuhkannya ke bawah 0,5 g/kg, yang mengganggu hormon dan penyerapan
              vitamin A, D, E, K. Karbohidrat yang menjadi penyeimbang, bukan lemak.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-[12px] leading-relaxed text-slate-300">
          Untuk mencatat apa yang benar-benar Anda makan hari ini, buka{' '}
          <Link to="/nutrition" className="font-bold text-brand underline">Nutrisi</Link>.
          Halaman ini hanya menghitung targetnya.
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Perhitungan memakai Mifflin-St Jeor untuk BMR, rentang protein ISSN/ACSM, serat 14 g per
          1000 kkal (Institute of Medicine). Angka ini titik awal untuk orang sehat — bukan resep
          gizi medis. Pada penyakit ginjal, hati, kehamilan atau gangguan makan, ikuti arahan
          tenaga kesehatan.
        </p>
      </Card>
    </div>
  )
}

export default MacroLabGizi
