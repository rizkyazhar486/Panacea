import { useEffect, useMemo, useState } from 'react'
import { KolomAngka } from './KolomAngka'
import { Card, SectionTitle, Field, Badge } from './ui'
import { IconActivity, IconChartUp } from './icons'
import {
  konversi, phenoAge, egfrCkdEpi2021, fib4, hrMaksTanaka, vo2maxUth,
  sindromMetabolikIdf, type Hasil, type HasilAngka,
} from '../lib/longevity'
import { bangunBundel, ringkasBundel, keJson } from '../lib/fhir'

// ─────────────────────────────────────────────────────────────────────────────
// Panel ini berdiri terpisah dari model poin di halaman yang sama, dan
// perbedaannya disengaja: di sini setiap koefisien berasal dari makalah yang
// bisa dibuka, sedangkan model poin itu pilihan penulis. Keduanya ditampilkan
// berdampingan supaya penggunanya melihat mana yang mana — bukan untuk
// menyembunyikan yang lemah di balik yang kuat.
//
// Masukan diminta dalam satuan yang tertulis di lembar laboratorium Indonesia
// (mg/dL, g/dL), lalu diubah di sini. Meminta pengguna mengonversi sendiri
// adalah cara tercepat mendapat PhenoAge yang meleset dua puluh tahun.
// ─────────────────────────────────────────────────────────────────────────────

interface Lab {
  albuminGdL: number; kreatininMgdL: number; glukosaPuasaMgdL: number
  crpMgL: number; limfositPersen: number; mcv: number; rdw: number
  alp: number; wbc: number
  ast: number; alt: number; trombosit: number
  trigliserida: number; hdl: number; diastolik: number
}
const KOSONG: Lab = {
  albuminGdL: 0, kreatininMgdL: 0, glukosaPuasaMgdL: 0, crpMgL: 0, limfositPersen: 0,
  mcv: 0, rdw: 0, alp: 0, wbc: 0, ast: 0, alt: 0, trombosit: 0,
  trigliserida: 0, hdl: 0, diastolik: 0,
}
const KUNCI = 'pmd_labs_v1'

export interface LongevityPanelProps {
  age: number
  sex: 'M' | 'F'
  restingHr: number
  waistCm: number
  systolic: number
}

// Nilai penanda ditampilkan setelah dikonversi, sehingga glukosa 112 mg/dL
// menjadi 6.215937219034088 mmol/L kalau dicetak apa adanya — angka sepanjang
// itu membaca seperti kesalahan, bukan seperti hasil laboratorium.
const rapi = (x: number) => Number(x.toFixed(2)).toString()

function Baris({ nama, hasil }: { nama: string; hasil: Hasil<HasilAngka> | null }) {
  if (!hasil) return null
  return (
    <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-bold text-ink dark:text-ink">{nama}</div>
        {hasil.ok
          ? <div className="shrink-0 text-lg font-black text-brand-dark">{hasil.data.nilai}<span className="ml-1 text-[10px] font-bold text-neutral-500">{hasil.data.satuan}</span></div>
          : <div className="shrink-0 text-[11px] font-semibold text-neutral-400">—</div>}
      </div>
      <ul className="mt-1 space-y-0.5">
        {(hasil.ok ? hasil.data.catatan : [hasil.alasan]).map((c) => (
          <li key={c} className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-500">{c}</li>
        ))}
      </ul>
    </div>
  )
}

export function LongevityPanel({ age, sex, restingHr, waistCm, systolic }: LongevityPanelProps) {
  const [lab, setLab] = useState<Lab>(() => {
    try { return { ...KOSONG, ...JSON.parse(localStorage.getItem(KUNCI) || '{}') } } catch { return { ...KOSONG } }
  })
  useEffect(() => { try { localStorage.setItem(KUNCI, JSON.stringify(lab)) } catch { /* abaikan */ } }, [lab])
  const u = (p: Partial<Lab>) => setLab((x) => ({ ...x, ...p }))
  const perempuan = sex === 'F'

  const pheno = useMemo(() => {
    // Angka nol berarti "belum diisi", bukan hasil laboratorium bernilai nol —
    // menghitung PhenoAge dari kolom kosong akan menghasilkan angka yang
    // terlihat sungguhan.
    const wajib = [lab.albuminGdL, lab.kreatininMgdL, lab.glukosaPuasaMgdL, lab.crpMgL,
      lab.limfositPersen, lab.mcv, lab.rdw, lab.alp, lab.wbc]
    if (age <= 0 || wajib.some((x) => !(x > 0))) return null
    return phenoAge({
      usia: age,
      albuminGL: konversi.albuminGdLKeGL(lab.albuminGdL),
      kreatininUmolL: konversi.kreatininMgdLKeUmolL(lab.kreatininMgdL),
      glukosaMmolL: konversi.glukosaMgdLKeMmolL(lab.glukosaPuasaMgdL),
      crpMgdL: konversi.crpMgLKeMgdL(lab.crpMgL),
      limfositPersen: lab.limfositPersen, mcvFL: lab.mcv, rdwPersen: lab.rdw,
      alpUL: lab.alp, wbcRibu: lab.wbc,
    })
  }, [lab, age])

  const egfr = age > 0 && lab.kreatininMgdL > 0 ? egfrCkdEpi2021(lab.kreatininMgdL, age, perempuan) : null
  const fib = age > 0 && lab.ast > 0 && lab.alt > 0 && lab.trombosit > 0
    ? fib4(age, lab.ast, lab.alt, lab.trombosit) : null
  const hrMaks = age > 0 ? hrMaksTanaka(age) : null
  const vo2 = age > 0 && restingHr > 0 ? vo2maxUth(restingHr, age) : null
  const metab = waistCm > 0 && lab.trigliserida > 0 && lab.hdl > 0 && systolic > 0 && lab.glukosaPuasaMgdL > 0
    ? sindromMetabolikIdf({
      lingkarPinggangCm: waistCm, perempuan, trigliseridaMgdL: lab.trigliserida,
      hdlMgdL: lab.hdl, sistolik: systolic, diastolik: lab.diastolik || 80,
      glukosaPuasaMgdL: lab.glukosaPuasaMgdL,
    })
    : null

  // Ekspor FHIR. Data yang tidak bisa dibawa keluar hanya berguna selama
  // pengguna memakai aplikasi ini; klinik yang menerimanya membutuhkan bentuk
  // yang bisa dibaca mesin lain, bukan tangkapan layar.
  const bundel = useMemo(() => {
    let bio: Record<string, number> = {}
    try { bio = JSON.parse(localStorage.getItem('pmd_bioage_v1') || '{}') } catch { /* abaikan */ }
    const bersih = (x: unknown) => (typeof x === 'number' && x > 0 ? x : undefined)
    return bangunBundel({
      nilai: {
        weightKg: bersih(bio.weightKg), heightCm: bersih(bio.heightCm),
        systolic: bersih(systolic), diastolic: bersih(lab.diastolik),
        heartRate: bersih(restingHr), waistCm: bersih(waistCm), hba1c: bersih(bio.hba1c),
        albuminGdL: bersih(lab.albuminGdL), kreatininMgdL: bersih(lab.kreatininMgdL),
        glukosaPuasaMgdL: bersih(lab.glukosaPuasaMgdL), crpMgL: bersih(lab.crpMgL),
        limfositPersen: bersih(lab.limfositPersen), mcv: bersih(lab.mcv), rdw: bersih(lab.rdw),
        alp: bersih(lab.alp), wbc: bersih(lab.wbc), ast: bersih(lab.ast), alt: bersih(lab.alt),
        trombosit: bersih(lab.trombosit), trigliserida: bersih(lab.trigliserida), hdl: bersih(lab.hdl),
        phenoAge: pheno?.ok ? pheno.data.phenoAge : undefined,
        egfr: egfr?.ok ? egfr.data.nilai : undefined,
        fib4: fib?.ok ? fib.data.nilai : undefined,
        vo2max: vo2?.ok ? vo2.data.nilai : undefined,
      },
      pasien: { kelamin: sex },
    })
  }, [lab, systolic, restingHr, waistCm, sex, pheno, egfr, fib, vo2])
  const ringkas = ringkasBundel(bundel)

  function unduh() {
    const blob = new Blob([keJson(bundel)], { type: 'application/fhir+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panaceamed-fhir-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const kolom = (label: string, k: keyof Lab, step = 1) => (
    <Field label={label} key={k}>
      <KolomAngka nilai={lab[k] || undefined} onNilai={(n) => u({ [k]: n } as Partial<Lab>)} step={step} ariaLabel={label} />
    </Field>
  )

  return (
    <>
      <Card className="!p-5">
        <SectionTitle
          icon={<IconActivity size={20} />}
          title="Blood panel"
          subtitle="Enter values exactly as your lab report prints them — conversion happens here"
        />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {kolom('Albumin (g/dL)', 'albuminGdL', 0.1)}
          {kolom('Creatinine (mg/dL)', 'kreatininMgdL', 0.01)}
          {kolom('Fasting glucose (mg/dL)', 'glukosaPuasaMgdL')}
          {kolom('CRP (mg/L)', 'crpMgL', 0.1)}
          {kolom('Lymphocytes (%)', 'limfositPersen', 0.1)}
          {kolom('MCV (fL)', 'mcv', 0.1)}
          {kolom('RDW (%)', 'rdw', 0.1)}
          {kolom('Alk. phosphatase (U/L)', 'alp')}
          {kolom('White cells (×10³/µL)', 'wbc', 0.1)}
          {kolom('AST (U/L)', 'ast')}
          {kolom('ALT (U/L)', 'alt')}
          {kolom('Platelets (×10⁹/L)', 'trombosit')}
          {kolom('Triglycerides (mg/dL)', 'trigliserida')}
          {kolom('HDL (mg/dL)', 'hdl')}
          {kolom('Diastolic BP', 'diastolik')}
        </div>
        <p className="mt-3 text-[11px] leading-snug text-neutral-500">
          Nothing leaves your device. Blank fields are treated as missing, never as zero.
        </p>
      </Card>

      <Card className="!p-5">
        <SectionTitle
          icon={<IconChartUp size={20} />}
          title="Published equations"
          subtitle="Every coefficient below comes from a citable paper, unlike the points model above"
        />

        {pheno && (
          <div className="mt-3 rounded-2xl border border-neutral-100 p-4 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">PhenoAge — Levine 2018</div>
            {pheno.ok ? (
              <>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-4xl font-black" style={{ color: pheno.data.percepatan <= 0 ? '#00BF63' : '#ef4444' }}>{pheno.data.phenoAge}</div>
                  <Badge tone={pheno.data.percepatan <= 0 ? 'brand' : 'critical'}>
                    {pheno.data.percepatan <= 0
                      ? `${Math.abs(pheno.data.percepatan)} years below chronological`
                      : `${pheno.data.percepatan} years above chronological`}
                  </Badge>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-neutral-500">
                  This is a mortality-risk age, not a tissue age: it means your 10-year mortality risk
                  ({pheno.data.mortalitas10Tahun}% by the published model) resembles that of an average
                  person aged {pheno.data.phenoAge}. It is not a diagnosis and not a prediction about you.
                </p>
                <div className="mt-3 space-y-1">
                  {pheno.data.kontribusi.slice(0, 5).map((k) => (
                    <div key={k.penanda} className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="truncate font-semibold text-ink dark:text-ink">{k.penanda}</span>
                      <span className="shrink-0 tabular-nums text-neutral-500">{rapi(k.nilai)} {k.satuan} · {k.sumbangan >= 0 ? '+' : '−'}{Math.abs(k.sumbangan).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-neutral-500">Top five contributors to the model's linear term — the same PhenoAge can come from very different causes.</p>
              </>
            ) : (
              <p className="mt-1 text-[11px] leading-snug text-amber-700 dark:text-amber-300">{pheno.alasan}</p>
            )}
          </div>
        )}

        <div className="mt-3 space-y-2">
          <Baris nama="eGFR (CKD-EPI 2021)" hasil={egfr} />
          <Baris nama="FIB-4 liver fibrosis index" hasil={fib} />
          <Baris nama="Maximum heart rate (Tanaka)" hasil={hrMaks} />
          <Baris nama="Estimated VO₂max (Uth)" hasil={vo2} />
        </div>

        {metab && metab.ok && (
          <div className="mt-2 rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-bold text-ink dark:text-ink">Metabolic syndrome (IDF 2006)</div>
              <Badge tone={metab.data.memenuhi ? 'critical' : 'brand'}>{metab.data.memenuhi ? 'Criteria met' : 'Not met'}</Badge>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-neutral-500">
              {metab.data.obesitasSentral
                ? 'Central obesity present — IDF requires it, plus two of the four below.'
                : 'Central obesity absent, so IDF criteria cannot be met regardless of the others.'}
              {' '}Waist thresholds used are the South/South-East Asian ones ({perempuan ? '80' : '90'} cm), not the European ones.
            </p>
            <div className="mt-2 space-y-0.5">
              {metab.data.kriteriaTerpenuhi.map((c) => <div key={c} className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">● {c}</div>)}
              {metab.data.kriteriaTidak.map((c) => <div key={c} className="text-[11px] text-neutral-400">○ {c}</div>)}
            </div>
          </div>
        )}

        {!pheno && !egfr && !fib && !metab && (
          <p className="mt-3 rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
            Fill in the blood panel above to see these. Each equation appears only once it has every value it needs — a partial panel gives a wrong answer, not a rough one.
          </p>
        )}

        {ringkas.observasi > 0 && (
          <div className="mt-3 rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-ink dark:text-ink">Export as FHIR</div>
                <div className="text-[11px] leading-snug text-neutral-500">
                  {ringkas.observasi} observations — {ringkas.berkode} LOINC-coded, {ringkas.lokal} locally
                  coded because they are derived scores, not laboratory results.
                </div>
              </div>
              <button
                onClick={unduh}
                className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark active:scale-95"
              >
                Download
              </button>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-neutral-500">
              A FHIR R4 collection Bundle any clinic system or SMART on FHIR app can read. Derived scores
              never claim a LOINC code — a wrong code files a number under the wrong row with no warning.
            </p>
          </div>
        )}

        <p className="mt-3 rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
          Not included here: DNA-methylation clocks (Horvath, GrimAge, DunedinPACE), which need methylation data,
          and Klemera-Doubal, which needs a reference population. No number in this app measures "reversing aging",
          because none exists.
        </p>
      </Card>
    </>
  )
}

export default LongevityPanel
