import { lazy, Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconSearch, IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// SKOR KLINIS — dua puluh satu halaman terpisah dijadikan SATU.
//
// Tiap skor dulu punya rutenya sendiri: /wells-score, /meld-score,
// /braden-scale, dan seterusnya. Padahal semuanya mengerjakan hal yang sama —
// isi beberapa butir, dapatkan angka, baca artinya — dan dipakai dengan cara
// yang sama pula: seseorang sedang di depan pasien, tahu skor apa yang ia mau,
// dan perlu sampai ke sana cepat. Dua puluh satu rute berarti dua puluh satu
// tempat untuk dihafal, dan tidak satu pun bisa dicari dari dalam yang lain.
//
// KOMPONEN SKORNYA TIDAK DITULIS ULANG, dan itu keputusan yang disengaja.
// Halaman ini hanya MEMASANG komponen yang sudah ada di dalam satu kerangka.
// Menyalin ulang logika penilaian berarti berisiko salah menyalin satu ambang
// atau satu bobot, dan pada skor klinis kesalahan seperti itu tidak kelihatan
// oleh pembacanya — ia hanya menghasilkan angka yang salah dengan percaya
// diri. Tidak ada satu baris pun logika penilaian yang berubah di sini.
//
// Rute lamanya tetap hidup dan mengalihkan ke sini beserta skornya terpilih,
// supaya tautan yang sudah tersebar tidak mati.
// ─────────────────────────────────────────────────────────────────────────────

type Kategori = 'Kardiovaskular' | 'Respirasi' | 'Cerna & Hati' | 'Ginjal' | 'Neurologi'
              | 'Hematologi' | 'Perawatan & Risiko' | 'Muskuloskeletal' | 'Cairan & Anak'

interface Skor {
  /** Dipakai di ?s= — DATA, bukan teks layar. Jangan diterjemahkan. */
  key: string
  nama: string
  /** Untuk apa skor ini menjawab — satu kalimat, supaya bisa dipilih tanpa dibuka. */
  untuk: string
  kategori: Kategori
  /** Rute lamanya, dipertahankan sebagai pengalihan. */
  ruteLama: string
  Komponen: React.LazyExoticComponent<React.ComponentType>
}

const L = <T extends Record<string, React.ComponentType>>(f: () => Promise<T>, n: keyof T) =>
  lazy(() => f().then((m) => ({ default: m[n] as React.ComponentType })))

export const SKOR: Skor[] = [
  { key: 'wells', nama: 'Wells Score', untuk: 'Pre-test probability of DVT or pulmonary embolism', kategori: 'Kardiovaskular', ruteLama: '/wells-score',
    Komponen: L(() => import('./WellsScore'), 'WellsScore') },
  { key: 'perc', nama: 'PERC Rule', untuk: 'Rules OUT pulmonary embolism in low-risk patients without testing', kategori: 'Kardiovaskular', ruteLama: '/perc-rule',
    Komponen: L(() => import('./PercRule'), 'PercRule') },
  { key: 'grace', nama: 'GRACE Score', untuk: 'Mortality risk after acute coronary syndrome', kategori: 'Kardiovaskular', ruteLama: '/grace-score',
    Komponen: L(() => import('./GraceScore'), 'GraceScore') },
  { key: 'timi', nama: 'TIMI Risk Score', untuk: 'Risk stratification in unstable angina and NSTEMI', kategori: 'Kardiovaskular', ruteLama: '/timi-risk-score',
    Komponen: L(() => import('./TimiRiskScore'), 'TimiRiskScore') },
  { key: 'hasbled', nama: 'HAS-BLED', untuk: 'Bleeding risk on anticoagulation for atrial fibrillation', kategori: 'Kardiovaskular', ruteLama: '/has-bled-score',
    Komponen: L(() => import('./HasBledScore'), 'HasBledScore') },
  { key: 'qtc', nama: 'QTc Calculator', untuk: 'Corrects the QT interval for heart rate', kategori: 'Kardiovaskular', ruteLama: '/qtc-calculator',
    Komponen: L(() => import('./QTcCalculator'), 'QTcCalculator') },
  { key: 'duke', nama: 'Duke Criteria', untuk: 'Diagnosis of infective endocarditis', kategori: 'Kardiovaskular', ruteLama: '/duke-criteria',
    Komponen: L(() => import('./DukeCriteria'), 'DukeCriteria') },
  { key: 'stroke-risk', nama: 'Stroke Risk', untuk: 'Stroke risk estimation', kategori: 'Neurologi', ruteLama: '/stroke-risk-calculator',
    Komponen: L(() => import('./StrokeRiskCalculator'), 'StrokeRiskCalculator') },

  { key: 'news2', nama: 'NEWS2', untuk: 'Early warning of clinical deterioration from bedside observations', kategori: 'Respirasi', ruteLama: '/news2-score',
    Komponen: L(() => import('./News2Score'), 'News2Score') },
  { key: 'lights', nama: "Light's Criteria", untuk: 'Separates exudative from transudative pleural effusion', kategori: 'Respirasi', ruteLama: '/lights-criteria',
    Komponen: L(() => import('./LightsCriteria'), 'LightsCriteria') },

  { key: 'meld', nama: 'MELD Score', untuk: 'Severity of end-stage liver disease and transplant priority', kategori: 'Cerna & Hati', ruteLama: '/meld-score',
    Komponen: L(() => import('./MeldScore'), 'MeldScore') },
  { key: 'child-pugh', nama: 'Child-Pugh', untuk: 'Prognosis in cirrhosis', kategori: 'Cerna & Hati', ruteLama: '/child-pugh-score',
    Komponen: L(() => import('./ChildPughScore'), 'ChildPughScore') },
  { key: 'maddrey', nama: 'Maddrey DF', untuk: 'Severity of alcoholic hepatitis and steroid decision', kategori: 'Cerna & Hati', ruteLama: '/maddrey-score',
    Komponen: L(() => import('./MaddreyScore'), 'MaddreyScore') },
  { key: 'ranson', nama: 'Ranson Criteria', untuk: 'Severity of acute pancreatitis', kategori: 'Cerna & Hati', ruteLama: '/ranson-criteria',
    Komponen: L(() => import('./RansonCriteria'), 'RansonCriteria') },
  { key: 'bisap', nama: 'BISAP', untuk: 'Early mortality risk in acute pancreatitis', kategori: 'Cerna & Hati', ruteLama: '/bisap-score',
    Komponen: L(() => import('./BisapScore'), 'BisapScore') },
  { key: 'blatchford', nama: 'Glasgow-Blatchford', untuk: 'Need for intervention in upper GI bleeding', kategori: 'Cerna & Hati', ruteLama: '/glasgow-blatchford-score',
    Komponen: L(() => import('./GlasgowBlatchfordScore'), 'GlasgowBlatchfordScore') },
  { key: 'rockall', nama: 'Rockall Score', untuk: 'Rebleeding and mortality risk after upper GI bleed', kategori: 'Cerna & Hati', ruteLama: '/rockall-score',
    Komponen: L(() => import('./RockallScore'), 'RockallScore') },

  { key: 'fena', nama: 'FENa', untuk: 'Separates pre-renal from intrinsic renal failure', kategori: 'Ginjal', ruteLama: '/fena-calculator',
    Komponen: L(() => import('./FenaCalculator'), 'FenaCalculator') },
  { key: 'creatinine-clearance', nama: 'Creatinine Clearance', untuk: 'Cockcroft-Gault estimate for drug dosing', kategori: 'Ginjal', ruteLama: '/creatinine-clearance',
    Komponen: L(() => import('./CreatinineClearance'), 'CreatinineClearance') },
  { key: 'serum-osmolality', nama: 'Serum Osmolality', untuk: 'Calculated osmolality and the osmolar gap', kategori: 'Ginjal', ruteLama: '/serum-osmolality',
    Komponen: L(() => import('./SerumOsmolality'), 'SerumOsmolality') },
  { key: 'corrected-calcium', nama: 'Corrected Calcium', untuk: 'Corrects total calcium for albumin', kategori: 'Ginjal', ruteLama: '/corrected-calcium',
    Komponen: L(() => import('./CorrectedCalcium'), 'CorrectedCalcium') },

  { key: '4ts', nama: '4Ts Score', untuk: 'Probability of heparin-induced thrombocytopenia', kategori: 'Hematologi', ruteLama: '/4ts-score',
    Komponen: L(() => import('./FourTsScore'), 'FourTsScore') },
  { key: 'caprini', nama: 'Caprini Score', untuk: 'Surgical VTE risk and prophylaxis choice', kategori: 'Hematologi', ruteLama: '/caprini-score',
    Komponen: L(() => import('./CapriniScore'), 'CapriniScore') },
  { key: 'padua', nama: 'Padua Prediction', untuk: 'VTE risk in medical inpatients', kategori: 'Hematologi', ruteLama: '/padua-score',
    Komponen: L(() => import('./PaduaScore'), 'PaduaScore') },

  { key: 'sofa', nama: 'SOFA Score', untuk: 'Organ dysfunction in critical illness', kategori: 'Perawatan & Risiko', ruteLama: '/sofa-score',
    Komponen: L(() => import('./SofaScore'), 'SofaScore') },
  { key: 'charlson', nama: 'Charlson Index', untuk: 'Comorbidity burden and 10-year survival', kategori: 'Perawatan & Risiko', ruteLama: '/charlson-index',
    Komponen: L(() => import('./CharlsonIndex'), 'CharlsonIndex') },
  { key: 'braden', nama: 'Braden Scale', untuk: 'Pressure ulcer risk', kategori: 'Perawatan & Risiko', ruteLama: '/braden-scale',
    Komponen: L(() => import('./BradenScale'), 'BradenScale') },
  { key: 'epworth', nama: 'Epworth Sleepiness', untuk: 'Daytime sleepiness severity', kategori: 'Perawatan & Risiko', ruteLama: '/epworth-sleepiness',
    Komponen: L(() => import('./EpworthSleepiness'), 'EpworthSleepiness') },
  { key: 'findrisc', nama: 'FINDRISC', untuk: 'Ten-year risk of type 2 diabetes', kategori: 'Perawatan & Risiko', ruteLama: '/findrisc',
    Komponen: L(() => import('./Findrisc'), 'Findrisc') },

  // Kalkulator yang bentuknya sama tapi sempat tertinggal di rutenya sendiri.
  { key: 'fluid', nama: 'Fluid Calculators', untuk: 'Maintenance fluids, deficit and replacement', kategori: 'Cairan & Anak', ruteLama: '/fluid-calculators',
    Komponen: L(() => import('./FluidCalculators'), 'FluidCalculators') },
  { key: 'dka-anak', nama: 'Paediatric DKA', untuk: 'Fluid and insulin in paediatric diabetic ketoacidosis', kategori: 'Cairan & Anak', ruteLama: '/pediatric-dka-calculator',
    Komponen: L(() => import('./PediatricDkaCalculator'), 'PediatricDkaCalculator') },
  { key: 'ldl', nama: 'LDL Calculator', untuk: 'Calculated LDL cholesterol — and when the calculation fails', kategori: 'Kardiovaskular', ruteLama: '/ldl-calculator',
    Komponen: L(() => import('./LdlCalculator'), 'LdlCalculator') },
  { key: 'risiko', nama: 'Risk Calculators', untuk: 'Cardiovascular and general risk estimation', kategori: 'Perawatan & Risiko', ruteLama: '/risk',
    Komponen: L(() => import('./RiskCalculators'), 'RiskCalculators') },

  { key: 'ottawa-ankle', nama: 'Ottawa Ankle Rules', untuk: 'Whether an ankle injury needs a radiograph at all', kategori: 'Muskuloskeletal', ruteLama: '/ottawa-ankle-rules',
    Komponen: L(() => import('./OttawaAnkleRules'), 'OttawaAnkleRules') },
]

const KATEGORI: Kategori[] = [
  'Kardiovaskular', 'Respirasi', 'Cerna & Hati', 'Ginjal', 'Hematologi', 'Neurologi', 'Perawatan & Risiko', 'Cairan & Anak', 'Muskuloskeletal',
]

export function ClinicalScores() {
  const [params, setParams] = useSearchParams()
  const terpilih = params.get('s')
  const [cari, setCari] = useState('')
  const [kategori, setKategori] = useState<Kategori | null>(null)

  const aktif = SKOR.find((s) => s.key === terpilih) ?? null

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return SKOR.filter((s) => {
      if (kategori && s.kategori !== kategori) return false
      if (!q) return true
      // Dicocokkan ke nama DAN ke kegunaannya — orang sering ingat untuk apa
      // skornya dipakai tanpa ingat namanya.
      return s.nama.toLowerCase().includes(q) || s.untuk.toLowerCase().includes(q)
    })
  }, [cari, kategori])

  function pilih(key: string | null) {
    // Skor terpilih hidup di URL, bukan di state saja: rute lama bisa
    // mengalihkan ke sini, dan tautannya bisa dibagikan.
    if (key) setParams({ s: key })
    else setParams({})
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-24">
      <SectionTitle
        icon={<IconActivity />}
        title="Clinical Scores"
        subtitle={`${SKOR.length} validated scores in one place — search by name or by what you need to decide`}
      />

      {aktif ? (
        <>
          <Card className="!py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="t-mikro font-bold uppercase tracking-wide text-brand">{aktif.kategori}</div>
                <h2 className="text-base font-black text-ink dark:text-white">{aktif.nama}</h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{aktif.untuk}</p>
              </div>
              <button
                onClick={() => pilih(null)}
                className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-bold text-neutral-500 dark:border-white/10"
              >
                All scores
              </button>
            </div>
          </Card>
          <Suspense fallback={<Card><p className="text-sm text-neutral-500">Loading {aktif.nama}…</p></Card>}>
            <aktif.Komponen />
          </Suspense>
        </>
      ) : (
        <>
          <Card>
            <div className="relative">
              <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Search — e.g. “pulmonary embolism”, “cirrhosis”, “bleeding risk”…"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="-mx-1 mt-2 flex gap-1 overflow-x-auto px-1 pb-1">
              <button
                onClick={() => setKategori(null)}
                className={`min-h-[30px] shrink-0 rounded-full border px-2.5 text-[11px] font-bold transition ${
                  kategori === null ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                }`}
              >
                All
              </button>
              {KATEGORI.map((k) => (
                <button
                  key={k}
                  onClick={() => setKategori(kategori === k ? null : k)}
                  className={`min-h-[30px] shrink-0 rounded-full border px-2.5 text-[11px] font-bold transition ${
                    kategori === k ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-1.5">
            {hasil.map((s) => (
              <button
                key={s.key}
                onClick={() => pilih(s.key)}
                className="flex w-full items-start justify-between gap-2 rounded-xl border border-neutral-200 p-3 text-left transition hover:border-brand dark:border-white/10"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink dark:text-white">{s.nama}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">{s.untuk}</span>
                </span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-white/10">
                  {s.kategori}
                </span>
              </button>
            ))}
            {hasil.length === 0 && (
              <p className="px-1 text-sm text-neutral-500">No score matches that. Try the condition rather than the eponym.</p>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-neutral-400">
            Each score opens the same validated calculator that previously had its own page — none of the scoring
            logic was rewritten when they were brought together, because a mistranscribed threshold produces a
            confidently wrong number that the reader cannot see. Scores support a decision; they do not make one.
          </p>
        </>
      )}
    </div>
  )
}

export default ClinicalScores
