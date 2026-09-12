import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  phDariBikarbonat, bikarbonatDariPh, celahAnion, celahAnionTerkoreksi, rasioDelta,
  tafsirkan, type Gangguan,
} from '../../lib/asamBasa'

// Panel asam-basa untuk Body Exposure.
//
// Diagram Davenport, bukan daftar angka. Satu titik pada bidang pH-bikarbonat
// menjawab tiga pertanyaan sekaligus, dan yang membuatnya menjawab adalah
// JARAK titik itu ke isobar PaCO2 dan ke pita kompensasi -- sesuatu yang
// hanya bisa dilihat, tidak bisa dibacakan.

const PH_MIN = 7.0
const PH_MAKS = 7.7
const HCO3_MAKS = 44
const ISOBAR = [20, 30, 40, 50, 60, 80]

const W = 320
const H = 220
const KIRI = 34
const BAWAH = 24

const x = (ph: number) => KIRI + ((ph - PH_MIN) / (PH_MAKS - PH_MIN)) * (W - KIRI - 8)
const y = (hco3: number) => H - BAWAH - (hco3 / HCO3_MAKS) * (H - BAWAH - 10)

/** Isobar digambar dari `bikarbonatDariPh` -- fungsi yang sama yang membalik pH
 *  yang ditampilkan. Kurva dan angka tidak boleh punya dua sumber. */
function jalurIsobar(paco2: number): string {
  const titik: string[] = []
  for (let ph = PH_MIN; ph <= PH_MAKS + 1e-9; ph += 0.02) {
    const hco3 = bikarbonatDariPh(ph, paco2)
    if (hco3 > HCO3_MAKS) break
    titik.push(`${titik.length ? 'L' : 'M'}${x(ph).toFixed(1)} ${y(hco3).toFixed(1)}`)
  }
  return titik.join(' ')
}

const NAMA: Record<Gangguan, string> = {
  'normal': 'Within reference range',
  'asidosis-metabolik': 'Metabolic acidosis',
  'alkalosis-metabolik': 'Metabolic alkalosis',
  'asidosis-respiratorik': 'Respiratory acidosis',
  'alkalosis-respiratorik': 'Respiratory alkalosis',
}

/** Batas penggeser, satu sumber untuk panel dan untuk ujinya. Sebuah kasus
 *  terpandu yang keluar dari batas ini akan dijepit diam-diam oleh input range
 *  dan mengajarkan angka yang salah, maka ujinya memeriksa ini. */
export const RENTANG_ASAM_BASA = {
  bikarbonat: { min: 4, maks: 44 },
  paco2: { min: 15, maks: 90 },
  natrium: { min: 120, maks: 160 },
  klorida: { min: 80, maks: 125 },
  albumin: { min: 1, maks: 5 },
} as const

/** Masukan sebuah kasus terpandu: persis keadaan penggeser, tidak lebih. */
export interface MasukanAsamBasa {
  bikarbonat: number
  paco2: number
  natrium: number
  klorida: number
  albumin: number
  kronik: boolean
}

export interface KasusAsamBasa {
  judul: string
  ajakan: string
  masukan: MasukanAsamBasa
  pelajaran: string
}

// Kasus ini memuat MASUKAN saja. pH, gangguan utama, rentang Winter, celah
// anion terkoreksi dan rasio delta tetap dihitung mesin dari masukan itu.
// Kalau jawabannya ikut disimpan di sini, tutorialnya akan tetap tampak
// "benar" walaupun mesinnya sudah rusak -- kebalikan dari mengajar.
export const KASUS_ASAM_BASA: KasusAsamBasa[] = [
  {
    judul: 'Case 1 \u00b7 Diabetic ketoacidosis',
    ajakan: 'Bicarbonate 8, CO\u2082 22, sodium 135, chloride 95, albumin normal.',
    masukan: { bikarbonat: 8, paco2: 22, natrium: 135, klorida: 95, albumin: 4.0, kronik: false },
    pelajaran: 'The low CO\u2082 here is not a second disturbance — it is the lung answering the acid. '
      + 'Check the expected range before calling it one, and read the anion gap to see what the unmeasured '
      + 'acid is doing.',
  },
  {
    judul: 'Case 2 \u00b7 Long-standing CO\u2082 retention',
    ajakan: 'Bicarbonate 32 with CO\u2082 60 — then toggle "long-standing rather than acute".',
    masukan: { bikarbonat: 32, paco2: 60, natrium: 140, klorida: 100, albumin: 4.0, kronik: true },
    pelajaran: 'The same two numbers change meaning with the clock. Against the acute rule the bicarbonate '
      + 'looks far too high and invites a second diagnosis; against the chronic rule, where the kidney has '
      + 'had days to retain base, it is exactly what one disturbance predicts. Untick the box and watch the '
      + 'verdict flip.',
  },
  {
    judul: 'Case 3 \u00b7 A gap hidden by low albumin',
    ajakan: 'Bicarbonate 16, CO\u2082 32, sodium 140, chloride 112, albumin only 2.0 g/dL.',
    masukan: { bikarbonat: 16, paco2: 32, natrium: 140, klorida: 112, albumin: 2.0, kronik: false },
    pelajaran: 'The measured gap looks unremarkable, so the raw number invites the wrong route entirely. '
      + 'Albumin is the largest unmeasured anion; correct for it and the gap reappears. This is the case '
      + 'that is missed by reading one number instead of two.',
  },
]

function Davenport({ bikarbonat, paco2, ph }: { bikarbonat: number; paco2: number; ph: number }) {
  const px = Number.isFinite(ph) ? x(Math.min(PH_MAKS, Math.max(PH_MIN, ph))) : null
  const py = y(Math.min(HCO3_MAKS, bikarbonat))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img"
      aria-label={`Davenport diagram. pH ${Number.isFinite(ph) ? ph.toFixed(2) : 'undefined'}, bicarbonate ${bikarbonat} millimoles per litre, on the ${paco2} millimetres of mercury carbon dioxide isobar.`}>
      {/* Pita pH rujukan 7,35-7,45 -- lebarnya yang penting, bukan garis tunggal. */}
      <rect x={x(7.35)} y={10} width={x(7.45) - x(7.35)} height={H - BAWAH - 10}
        fill="#00BF63" opacity={0.10} />

      {ISOBAR.map((p) => (
        <g key={p}>
          <path d={jalurIsobar(p)} fill="none" stroke="currentColor" strokeWidth={1}
            className="text-neutral-400" opacity={p === 40 ? 0.9 : 0.35}
            strokeDasharray={p === 40 ? undefined : '3 3'} />
        </g>
      ))}

      <line x1={KIRI} y1={H - BAWAH} x2={W - 8} y2={H - BAWAH} stroke="currentColor" className="text-neutral-400" strokeWidth={1} />
      <line x1={KIRI} y1={10} x2={KIRI} y2={H - BAWAH} stroke="currentColor" className="text-neutral-400" strokeWidth={1} />

      {[7.0, 7.2, 7.4, 7.6].map((t) => (
        <text key={t} x={x(t)} y={H - BAWAH + 12} textAnchor="middle"
          className="fill-neutral-500 text-[8px] font-bold">{t.toFixed(1)}</text>
      ))}
      {[10, 24, 40].map((t) => (
        <text key={t} x={KIRI - 4} y={y(t) + 3} textAnchor="end"
          className="fill-neutral-500 text-[8px] font-bold">{t}</text>
      ))}
      <text x={KIRI - 30} y={16} className="fill-neutral-500 text-[8px] font-bold">HCO₃⁻</text>
      <text x={W - 8} y={H - 4} textAnchor="end" className="fill-neutral-500 text-[8px] font-bold">pH</text>

      {px !== null && (
        <>
          <line x1={px} y1={py} x2={px} y2={H - BAWAH} stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 3" opacity={0.8} />
          <line x1={KIRI} y1={py} x2={px} y2={py} stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 3" opacity={0.8} />
          <circle cx={px} cy={py} r={6} fill="#00BF63" opacity={0.25} />
          <circle cx={px} cy={py} r={3.5} fill="#00BF63" />
        </>
      )}
    </svg>
  )
}

function Geser({ label, nilai, min, maks, langkah = 1, onUbah, satuan }: {
  label: string; nilai: number; min: number; maks: number; langkah?: number
  onUbah: (n: number) => void; satuan: string
}) {
  return (
    <div className="mt-2">
      <label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-neutral-500">{nilai} {satuan}</span>
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

export function AsamBasaPanel() {
  const [bikarbonat, setBikarbonat] = useState<number>(24)
  const [paco2, setPaco2] = useState<number>(40)
  const [natrium, setNatrium] = useState<number>(140)
  const [klorida, setKlorida] = useState<number>(104)
  const [albumin, setAlbumin] = useState<number>(4)
  const [kronik, setKronik] = useState<boolean>(false)
  const [pelajaran, setPelajaran] = useState<string | null>(null)

  // Kasus hanya MENGISI penggeser. Tidak ada satu pun hasil yang ikut dipasang.
  function jalankanKasus(k: KasusAsamBasa) {
    setBikarbonat(k.masukan.bikarbonat)
    setPaco2(k.masukan.paco2)
    setNatrium(k.masukan.natrium)
    setKlorida(k.masukan.klorida)
    setAlbumin(k.masukan.albumin)
    setKronik(k.masukan.kronik)
    setPelajaran(k.pelajaran)
  }

  const gas = { bikarbonat, paco2 }
  const elektrolit = { natrium, klorida, bikarbonat, albumin }

  const ph = phDariBikarbonat(gas)
  const tafsir = useMemo(() => tafsirkan(gas, !kronik), [bikarbonat, paco2, kronik])
  const ag = celahAnion(elektrolit)
  const agKoreksi = celahAnionTerkoreksi(elektrolit)
  const delta = rasioDelta(elektrolit)

  return (
    <div className="space-y-4">
      <Prosa>
        <h3 className="text-base font-black">Acid–base on the Davenport plane</h3>
        <p className="text-[12px] leading-relaxed">
          Bicarbonate and carbon dioxide are not two separate readings — they are one
          equilibrium, and the point below sits on whichever carbon dioxide isobar the
          pair implies. The isobars are drawn by inverting the very equation that prints
          the pH, so the curve and the number cannot disagree.
        </p>
      </Prosa>

      {/* Tutorial: kasus yang benar-benar menjalankan alatnya. */}
      <div className="rounded-2xl border border-brand/25 bg-brand/[0.05] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">Learn by running one</p>
        <div className="mt-2 grid gap-1.5">
          {KASUS_ASAM_BASA.map((k) => (
            <button key={k.judul} type="button" onClick={() => jalankanKasus(k)}
              className="rounded-xl bg-white/75 p-2.5 text-left transition hover:bg-white dark:bg-white/[.055] dark:hover:bg-white/[.09]">
              <div className="text-[11.5px] font-black text-ink dark:text-white">{k.judul}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{k.ajakan}</div>
            </button>
          ))}
        </div>
        {pelajaran && (
          <p className="mt-2 rounded-xl bg-white/80 p-2.5 text-[11.5px] leading-relaxed text-neutral-700 dark:bg-white/[.06] dark:text-neutral-200">
            {pelajaran}
          </p>
        )}
      </div>

      <Davenport bikarbonat={bikarbonat} paco2={paco2} ph={ph} />

      <div>
        <Geser label="Bicarbonate" nilai={bikarbonat} min={RENTANG_ASAM_BASA.bikarbonat.min} maks={RENTANG_ASAM_BASA.bikarbonat.maks} onUbah={setBikarbonat} satuan="mmol/L" />
        <Geser label="Arterial CO₂" nilai={paco2} min={RENTANG_ASAM_BASA.paco2.min} maks={RENTANG_ASAM_BASA.paco2.maks} onUbah={setPaco2} satuan="mmHg" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Angka nilai={Number.isFinite(ph) ? ph.toFixed(2) : '—'} label="pH" />
        <Angka nilai={bikarbonat.toFixed(0)} satuan="mmol/L" label="HCO₃⁻" />
        <Angka nilai={paco2.toFixed(0)} satuan="mmHg" label="PaCO₂" />
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Primary disturbance</div>
        <div className="mt-1 text-[14px] font-black text-ink dark:text-white">{NAMA[tafsir.gangguan]}</div>

        {tafsir.kompensasi && tafsir.terukur !== null ? (
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            A single, established disturbance of this size would be expected to bring{' '}
            {tafsir.kompensasi.besaran === 'paco2' ? 'arterial CO₂' : 'bicarbonate'} to{' '}
            <strong>{tafsir.kompensasi.bawah.toFixed(1)}–{tafsir.kompensasi.atas.toFixed(1)}</strong>{' '}
            {tafsir.kompensasi.besaran === 'paco2' ? 'mmHg' : 'mmol/L'}. The value here is{' '}
            <strong>{tafsir.terukur.toFixed(1)}</strong>
            {tafsir.sesuaiKompensasi
              ? ' — inside that range, which is what a single disturbance compensating normally looks like.'
              : ' — outside it, which is how a second, independent disturbance announces itself.'}
          </p>
        ) : (
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            With pH inside the reference band there is no single primary disturbance to
            compensate, so no expected range applies. A normal pH does not by itself
            exclude two opposing disturbances cancelling each other.
          </p>
        )}

        {(tafsir.gangguan === 'asidosis-respiratorik' || tafsir.gangguan === 'alkalosis-respiratorik') && (
          <label className="mt-3 flex items-center gap-2 text-[11px] font-bold text-ink dark:text-white">
            <input type="checkbox" checked={kronik} onChange={(e) => setKronik(e.target.checked)}
              className="accent-[#00BF63]" />
            <span>Long-standing rather than acute</span>
          </label>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Anion gap</div>
        <Geser label="Sodium" nilai={natrium} min={RENTANG_ASAM_BASA.natrium.min} maks={RENTANG_ASAM_BASA.natrium.maks} onUbah={setNatrium} satuan="mmol/L" />
        <Geser label="Chloride" nilai={klorida} min={RENTANG_ASAM_BASA.klorida.min} maks={RENTANG_ASAM_BASA.klorida.maks} onUbah={setKlorida} satuan="mmol/L" />
        <Geser label="Albumin" nilai={albumin} min={RENTANG_ASAM_BASA.albumin.min} maks={RENTANG_ASAM_BASA.albumin.maks} langkah={0.5} onUbah={setAlbumin} satuan="g/dL" />

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Angka nilai={ag.toFixed(1)} label="Measured" />
          <Angka nilai={agKoreksi.toFixed(1)} label="Albumin-corrected" />
          <Angka nilai={Number.isFinite(delta) ? delta.toFixed(2) : '—'} label="Delta ratio" />
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {agKoreksi - ag > 1
            ? `Albumin of ${albumin.toFixed(1)} g/dL hides roughly ${(agKoreksi - ag).toFixed(1)} mmol/L of gap. Albumin is the largest unmeasured anion, so a low albumin can make a wide-gap acidosis read as normal.`
            : 'At normal albumin the correction changes nothing, which is why it is easy to forget it exists.'}
          {' '}
          {Number.isFinite(delta)
            ? 'The delta ratio compares how far the gap rose against how far bicarbonate fell; near 1–2 fits a pure wide-gap acidosis, below 1 suggests a hyperchloraemic acidosis alongside it, above 2 a concurrent metabolic alkalosis.'
            : 'With bicarbonate at or above its reference value nothing has fallen, so the delta ratio has no value to report rather than a large one.'}
        </p>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Computes from values you supply. Not a measurement, not a diagnosis, and it
          estimates no one's acid–base status. The compensation ranges are population
          regressions for single, established disturbances — they describe what is
          expected, not what is correct, and mixed disorders are recognised precisely
          because they fall outside them. The Stewart strong-ion approach is deliberately
          absent: the Davenport plane is a bicarbonate-centred frame, and mixing two
          frames in one picture obscures both.
        </p>
      </Prosa>
    </div>
  )
}
