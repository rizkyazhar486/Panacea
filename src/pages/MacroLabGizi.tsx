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
    { l: 'Carbohydrate', g: h.karboG, pct: h.pctK, w: 'bg-sky-500' },
    { l: 'Fat', g: h.lemakG, pct: h.pctL, w: 'bg-amber-500' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle
        icon={<IconLeaf />}
        title="Macro Lab"
        subtitle="Macronutrient targets and meal structure, from your own body mass"
      />

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Your data</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <KolomVitalTerikat ikat={ikatBerat} label="Weight (kg)" satuan="kg" step={0.1} />
          <KolomVitalTerikat ikat={ikatTinggi} label="Height (cm)" satuan="cm" />
          <Field label="Age"><KolomAngka nilai={umur} onNilai={setAge} ariaLabel="Age" /></Field>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Weight and height fill in from your device once synced; press Enter after changing one so it
          is used across the whole app.
        </p>

        <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-neutral-500">Goal</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {TUJUAN_GIZI.map((t) => (
            <button key={t.id} onClick={() => setTujuan(t.id)} aria-pressed={tujuan === t.id}
              className={`rounded-xl p-2 text-left transition ${tujuan === t.id ? 'bg-brand/25 ring-2 ring-brand' : 'bg-white/5'}`}>
              <div className="text-[12px] font-black text-ink">{t.label}</div>
              <div className="text-[10px] text-neutral-500">{t.ringkas}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-neutral-500">Activity</div>
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
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Daily target</div>
          <div className="text-[10px] text-slate-500">BMR {h.bmr} · TDEE {h.tdee} kcal</div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-4xl font-black text-brand">{h.target}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">kcal per day</div>
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
            <div className="text-[10px] font-black uppercase text-neutral-500">Fibre</div>
            <div className="text-lg font-black text-ink">{h.seratG} g</div>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5">
            <div className="text-[10px] font-black uppercase text-neutral-500">Water</div>
            <div className="text-lg font-black text-ink">{h.airL} L</div>
          </div>
        </div>
      </Card>

      {/* Komposisi per makan */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Composition per meal</div>
          <div className="w-24">
            <Field label="Meals">
              <KolomAngka nilai={makanPerHari} onNilai={setMakanPerHari} ariaLabel="Meals per day" />
            </Field>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          {[
            { l: 'kcal', v: h.perMakan.kkal },
            { l: 'protein', v: `${h.perMakan.protein} g` },
            { l: 'carbs', v: `${h.perMakan.karbo} g` },
            { l: 'fat', v: `${h.perMakan.lemak} g` },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-white/5 p-2">
              <div className="text-[13px] font-black text-ink">{x.v}</div>
              <div className="text-[10px] font-bold uppercase text-neutral-500">{x.l}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          An even split is only a starting point. What affects muscle is <b>enough protein at every
          meal</b> — roughly {Math.max(25, h.perMakan.protein)} g per meal is more useful than piling
          all of the day’s protein into dinner.
        </p>
      </Card>

      {/* Dua hal yang paling sering salah */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Why it is calculated this way</div>
        <div className="mt-2 space-y-2">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-[12px] font-bold text-emerald-700">Protein from body weight, not a percentage of calories</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">
              Your range is <b>{h.proteinLo}-{h.proteinHi} g</b> ({PROTEIN_PER_KG[tujuan][0]}-{PROTEIN_PER_KG[tujuan][1]} g/kg).
              "30% of calories from protein" gives wildly different numbers for two people of the same
              weight eating different amounts — yet what determines protein need is the tissue that has
              to be maintained, not how much you happen to eat.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-[12px] font-bold text-amber-700">Fat has a floor, it is not just the remainder</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">
              Fat is held at a minimum of <b>0.8 g/kg</b>. Treating it as "whatever calories are left
              after protein and carbohydrate" can push it below 0.5 g/kg, which disrupts hormones and the
              absorption of vitamins A, D, E and K. Carbohydrate is the variable that balances, not fat.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-[12px] leading-relaxed text-neutral-600">
          To log what you actually ate today, open{' '}
          <Link to="/nutrition" className="font-bold text-brand underline">Nutrition</Link>.
          This page only computes the targets.
        </p>
        <Prosa kelas="mt-2 text-[10px] leading-relaxed text-slate-500">Calculations use Mifflin-St Jeor for BMR, ISSN/ACSM protein ranges, and 14 g of fibre per 1000 kcal (Institute of Medicine). These figures are a starting point for healthy people — not a medical nutrition prescription. In kidney or liver disease, pregnancy, or an eating disorder, follow the guidance of a health professional.</Prosa>
      </Card>
    </div>
  )
}

export default MacroLabGizi
