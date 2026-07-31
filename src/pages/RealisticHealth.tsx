import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'
import { useVitals } from '../lib/useVitals'
import { vitalsAge } from '../lib/healthVitals'
import {
  DOMAIN_LABEL, pickDoses, triageBadReading,
  type Domain, type Slot,
} from '../lib/minimumDose'

// ─────────────────────────────────────────────────────────────────────────────
// "Sehat Tapi Sibuk" — built as a deliberate answer to the complaint that
// wearables hand out bad scores and no solutions.
//
// Three rules the page holds to:
//   1. Never open with a score. The first thing on screen is an action.
//   2. Every action must fit the time and energy the user actually says they
//      have — no plan is offered that assumes an hour they do not have.
//   3. A bad reading is reframed as information about today's plan, never as a
//      verdict on the person.
// ─────────────────────────────────────────────────────────────────────────────

const SLOTS: { v: Slot; l: string; sub: string }[] = [
  { v: 2, l: '2 menit', sub: 'Sedang tidak punya waktu sama sekali' },
  { v: 10, l: '10 menit', sub: 'Ada sela di antara pekerjaan' },
  { v: 30, l: '30 menit', sub: 'Hari ini agak longgar' },
]

export function RealisticHealth() {
  const vitals = useVitals()
  const [slot, setSlot] = useState<Slot>(2)
  const [wrecked, setWrecked] = useState(false)
  const [worst, setWorst] = useState<Domain | null>(null)
  const [doneIds, setDoneIds] = useState<string[]>([])

  const doses = useMemo(() => pickDoses({ slot, wrecked, worst }), [slot, wrecked, worst])
  const primary = doses[0]
  const alternatives = doses.slice(1, 4)

  const triage = useMemo(
    () => triageBadReading({ sleepH: vitals.sleepH, restingHr: vitals.restingHr }),
    [vitals.sleepH, vitals.restingHr],
  )

  const toggleDone = (id: string) =>
    setDoneIds((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">🌱</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-white">Sehat Tapi Sibuk</h1>
          <p className="text-xs text-neutral-400">Satu tindakan yang muat di hari Anda — bukan skor yang membuat Anda merasa gagal</p>
        </div>
      </div>

      <Card className="!p-4">
        <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Halaman ini dibuat karena keluhan yang wajar: banyak aplikasi kesehatan memberi tahu Anda
          bahwa pemulihan Anda buruk, lalu berhenti di situ. Diberi nilai jelek tanpa jalan keluar
          tidak membuat siapa pun lebih sehat — itu hanya membuat orang berhenti membuka aplikasinya.
          Jadi di sini <b>tindakan lebih dulu, angka belakangan</b>, dan tidak ada saran yang
          mengandaikan waktu yang tidak Anda punya.
        </p>
      </Card>

      {/* Step 1 — the only inputs, kept to three taps. */}
      <Card className="!p-4">
        <SectionTitle icon={<IconHeart size={18} />} title="Hari ini realistisnya berapa?" subtitle="Jawab jujur — jawaban kecil justru berguna" />

        <div className="mt-3 grid gap-2">
          {SLOTS.map((s) => (
            <button
              key={s.v}
              onClick={() => setSlot(s.v)}
              className={`rounded-xl px-3 py-2.5 text-left transition ${
                slot === s.v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-200'
              }`}
            >
              <div className="text-[13px] font-bold">{s.l}</div>
              <div className={`text-[11px] ${slot === s.v ? 'text-white/80' : 'text-neutral-500'}`}>{s.sub}</div>
            </button>
          ))}
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
          <input type="checkbox" checked={wrecked} onChange={(e) => setWrecked(e.target.checked)} />
          <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
            Saya benar-benar kehabisan tenaga hari ini
          </span>
        </label>
        {wrecked && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
            Baik — saran yang menuntut tenaga disembunyikan. Pada hari seperti ini, mempertahankan
            kebiasaan lebih berharga daripada memaksakan latihan.
          </p>
        )}

        <div className="mt-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Yang paling mengganggu sekarang</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => setWorst(null)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!worst ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
            >
              Tidak yakin
            </button>
            {(Object.keys(DOMAIN_LABEL) as Domain[]).map((d) => (
              <button
                key={d}
                onClick={() => setWorst(worst === d ? null : d)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${worst === d ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
              >
                {DOMAIN_LABEL[d]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Step 2 — ONE action. This is the point of the page. */}
      {primary && (
        <Card className="!p-5">
          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Lakukan ini saja hari ini</div>
          <h2 className="mt-1 text-[17px] font-black leading-snug text-ink dark:text-white">{primary.title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">{primary.how}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">{primary.why}</p>
          <button
            onClick={() => toggleDone(primary.id)}
            className={`mt-3 w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
              doneIds.includes(primary.id) ? 'bg-brand-50 text-brand-dark' : 'bg-brand text-white hover:opacity-90'
            }`}
          >
            {doneIds.includes(primary.id) ? 'Sudah dikerjakan ✓' : 'Tandai sudah dikerjakan'}
          </button>
          {doneIds.includes(primary.id) && (
            <p className="mt-2 text-center text-[11px] leading-relaxed text-neutral-500">
              Itu sudah cukup untuk hari ini. Tidak ada target harian yang perlu dikejar di halaman ini.
            </p>
          )}
        </Card>
      )}

      {alternatives.length > 0 && (
        <Card className="!p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Kalau yang tadi tidak cocok</div>
          <div className="mt-2 space-y-2">
            {alternatives.map((d) => (
              <div key={d.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-bold text-ink dark:text-white">{d.title}</div>
                  <Badge tone="low">{d.minutes} mnt</Badge>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{d.how}</p>
                <button
                  onClick={() => toggleDone(d.id)}
                  className="mt-2 text-[11px] font-bold text-brand-dark hover:underline"
                >
                  {doneIds.includes(d.id) ? 'Sudah ✓' : 'Tandai sudah'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step 3 — reframe a bad wearable reading, only if there IS one. */}
      {triage && (
        <Card className="!p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">
            Soal angka Anda {vitalsAge(vitals) ? `· ${vitalsAge(vitals)}` : ''}
          </div>
          <h3 className="mt-1 text-[14px] font-black text-ink dark:text-white">{triage.headline}</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{triage.meaning}</p>
          <div className="mt-3 rounded-xl bg-brand-50 p-3 dark:bg-brand/10">
            <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Yang berguna hari ini</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{triage.doToday}</p>
          </div>
          {triage.seeDoctor && (
            <div className="mt-2 rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
              <div className="text-[11px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-300">Periksakan bila</div>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{triage.seeDoctor}</p>
            </div>
          )}
        </Card>
      )}

      {/* The principles, stated plainly — users deserve to know the reasoning. */}
      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Prinsip halaman ini</div>
        <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          <li><b>Jangan pernah nol.</b> Dua menit mengalahkan nol, dan bukan versi gagal dari tiga puluh menit. Lompatan kesehatan terbesar terjadi saat naik dari tidak pernah sama sekali menjadi sedikit — bukan dari sedikit menjadi banyak.</li>
          <li><b>Ubah lingkungan, jangan andalkan kemauan.</b> Menaruh telepon di ruangan lain lebih andal daripada berniat tidak membukanya. Kemauan adalah hal pertama yang habis ketika Anda lelah.</li>
          <li><b>Tambah, jangan larang.</b> Menambahkan protein lebih mungkin bertahan daripada melarang gorengan. Aturan yang melarang akan gagal pada minggu yang berat, dan kegagalan itu biasanya diikuti berhenti total.</li>
          <li><b>Melewatkan sehari bukan kegagalan.</b> Yang menentukan hasil adalah rata-rata berbulan-bulan, bukan kesempurnaan tiap hari. Aplikasi yang menghukum Anda karena satu hari bolong membuat Anda berhenti, dan berhenti itulah kerugian yang sesungguhnya.</li>
        </ul>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Saran umum untuk orang sehat. Bila Anda punya penyakit jantung, paru, sendi, sedang hamil,
        atau minum obat rutin, bicarakan dulu dengan dokter sebelum menambah aktivitas fisik.
      </div>
    </div>
  )
}

export default RealisticHealth
