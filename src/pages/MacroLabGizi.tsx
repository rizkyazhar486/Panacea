import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, Field } from '../components/ui'
import { KolomAngka } from '../components/KolomAngka'
import { IconLeaf } from '../components/icons'
import { useVitalField } from '../lib/useVitals'
import { KolomVitalTerikat } from '../components/KolomVital'
import { getDemo } from '../lib/profile'
import { hitungTdee, TUJUAN_GIZI, AKTIVITAS_GIZI, PROTEIN_PER_KG, type TujuanGizi, type TingkatAktivitas } from '../lib/tdee'

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

export function MacroLabGizi() {
  const demo = useMemo(() => getDemo(), [])
  const ikatBerat = useVitalField('weightKg', demo.weightKg || 70)
  const ikatTinggi = useVitalField('heightCm', demo.heightCm || 170)
  const [berat] = ikatBerat
  const [tinggi] = ikatTinggi
  const [umur, setAge] = useState<number | undefined>(demo.age || 30)
  const [tujuan, setTujuan] = useState<TujuanGizi>('rawat')
  const [aktivitas, setAktivitas] = useState<TingkatAktivitas>('sedang')
  const [makanPerHari, setMakanPerHari] = useState<number | undefined>(3)

  const h = useMemo(
    () =>
      hitungTdee({
        beratKg: berat,
        tinggiCm: tinggi,
        umur: umur ?? 30,
        sex: demo.sex,
        tujuan,
        aktivitas,
        makanPerHari,
      }),
    [berat, tinggi, umur, tujuan, aktivitas, makanPerHari, demo.sex],
  )

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
        subtitle="Sasaran makronutrien dan susunan makan, dari massa tubuh Anda sendiri"
      />

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Data Anda</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <KolomVitalTerikat ikat={ikatBerat} label="Berat (kg)" satuan="kg" step={0.1} />
          <KolomVitalTerikat ikat={ikatTinggi} label="Tinggi (cm)" satuan="cm" />
          <Field label="Age"><KolomAngka nilai={umur} onNilai={setAge} ariaLabel="Age" /></Field>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Berat dan tinggi terisi dari perangkat bila sudah tersinkron; tekan Enter setelah mengubahnya
          agar dipakai di seluruh aplikasi.
        </p>

        <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-neutral-500">Tujuan</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {TUJUAN_GIZI.map((t) => (
            <button key={t.id} onClick={() => setTujuan(t.id)} aria-pressed={tujuan === t.id}
              className={`rounded-xl p-2 text-left transition ${tujuan === t.id ? 'bg-brand/25 ring-2 ring-brand' : 'bg-white/5'}`}>
              <div className="text-[12px] font-black text-ink">{t.label}</div>
              <div className="text-[10px] text-neutral-500">{t.ringkas}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-neutral-500">Aktivitas</div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {AKTIVITAS_GIZI.map((a) => (
            <button key={a.id} onClick={() => setAktivitas(a.id)} aria-pressed={aktivitas === a.id}
              className={`rounded-xl px-2.5 py-2 text-left text-[12px] font-bold transition ${aktivitas === a.id ? 'bg-brand/25 ring-2 ring-brand text-white' : 'bg-white/5 text-neutral-600'}`}>
              {a.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Hasil */}
      <Card>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Target harian</div>
          <div className="text-[10px] text-slate-500">BMR {h.bmr} · TDEE {h.tdee} kkal</div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-4xl font-black text-brand">{h.target}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">kkal per hari</div>
        </div>

        <div className="mt-3 space-y-2">
          {bar.map((x) => (
            <div key={x.l}>
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="font-bold text-ink">{x.l}</span>
                <span className="tabular-nums text-neutral-600">{x.g} g · {x.pct}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${x.w}`} style={{ width: `${Math.min(100, x.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/5 p-2.5">
            <div className="text-[10px] font-black uppercase text-neutral-500">Serat</div>
            <div className="text-lg font-black text-ink">{h.seratG} g</div>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5">
            <div className="text-[10px] font-black uppercase text-neutral-500">Air</div>
            <div className="text-lg font-black text-ink">{h.airL} L</div>
          </div>
        </div>
      </Card>

      {/* Komposisi per makan */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Komposisi per makan</div>
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
              <div className="text-[13px] font-black text-ink">{x.v}</div>
              <div className="text-[10px] font-bold uppercase text-neutral-500">{x.l}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Pembagian rata hanya titik awal. Yang berpengaruh pada otot adalah <b>protein cukup di
          setiap kali makan</b> — sekitar {Math.max(25, h.perMakan.protein)} g sekali makan lebih
          berguna daripada menumpuk seluruh protein di makan malam.
        </p>
      </Card>

      {/* Dua hal yang paling sering salah */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Kenapa dihitung begini</div>
        <div className="mt-2 space-y-2">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-[12px] font-bold text-emerald-700">Protein dari berat badan, bukan persen kalori</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">
              Rentang Anda <b>{h.proteinLo}-{h.proteinHi} g</b> ({PROTEIN_PER_KG[tujuan][0]}-{PROTEIN_PER_KG[tujuan][1]} g/kg).
              "30% kalori dari protein" memberi angka yang sangat berbeda pada dua orang berberat sama
              tapi berkalori berbeda — padahal yang menentukan kebutuhan protein adalah jaringan yang
              harus dipelihara, bukan berapa banyak yang Anda makan.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-[12px] font-bold text-amber-700">Lemak punya lantai, bukan sekadar sisa</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">
              Lemak dijaga minimal <b>0,8 g/kg</b>. Menaruhnya sebagai "sisa kalori setelah protein dan
              karbohidrat" bisa menjatuhkannya ke bawah 0,5 g/kg, yang mengganggu hormon dan penyerapan
              vitamin A, D, E, K. Karbohidrat yang menjadi penyeimbang, bukan lemak.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-[12px] leading-relaxed text-neutral-600">
          Untuk mencatat apa yang benar-benar Anda makan hari ini, buka{' '}
          <Link to="/nutrition" className="font-bold text-brand underline">Nutrisi</Link>.
          Halaman ini hanya menghitung targetnya.
        </p>
        <Prosa kelas="mt-2 text-[10px] leading-relaxed text-slate-500">Perhitungan memakai Mifflin-St Jeor untuk BMR, rentang protein ISSN/ACSM, serat 14 g per 1000 kkal (Institute of Medicine). Angka ini titik awal untuk orang sehat — bukan resep gizi medis. Pada penyakit ginjal, hati, kehamilan atau gangguan makan, ikuti arahan tenaga kesehatan.</Prosa>
      </Card>
    </div>
  )
}

export default MacroLabGizi
