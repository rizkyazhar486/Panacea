import { useLongitudinalState } from '../lib/useLongitudinalState'
import { JENDELA_HARI, perubahanTeratas, labelMetrik, asal, angka } from '../lib/perubahanLongitudinal'

// "What changed" — konsumen runtime pertama status longitudinal kanonik.
// Menaruh lab, vital, dan kebugaran di satu daftar yang sama, diurutkan menurut
// besarnya perubahan relatif dalam 180 hari. Ini deskripsi perubahan, bukan
// penilaian klinis: tidak ada label normal/abnormal di sini.
export function ApaYangBerubah() {
  const { state } = useLongitudinalState()
  if (!state) return null
  const daftar = perubahanTeratas(state, new Date())
  return (
    <section className="kaca rounded-3xl p-3" aria-label="What changed" data-what-changed>
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">What changed · last {JENDELA_HARI} days</h2>
      {daftar.length === 0 ? (
        <p className="t-kecil mt-1 text-neutral-500">Record something twice — a lab result, weight or blood pressure — to see how it moves.</p>
      ) : (
        <ul className="mt-1.5 divide-y divide-neutral-100 dark:divide-white/10">
          {daftar.map(({ m, t, s }) => (
            <li key={m} className="flex min-h-[44px] items-center justify-between gap-3 py-1.5" data-metric={m}>
              <div className="min-w-0">
                <p className="t-kecil truncate font-bold text-ink dark:text-white">{labelMetrik(m)}</p>
                <p className="t-mikro text-neutral-500">{t.sampleCount} records since {t.firstRecordedAt.slice(0, 10)} · {asal(s.latest.provenance.method, s.latest.provenance.sourceKind)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="t-kecil font-black tabular-nums text-ink dark:text-white">{angka(Number(s.latest.value))} <span className="t-mikro font-normal text-neutral-400">{t.unit}</span></p>
                <p className="t-mikro tabular-nums text-neutral-500">{t.absoluteDelta >= 0 ? '▲ +' : '▼ −'}{angka(Math.abs(t.absoluteDelta))} ({Math.round(Math.abs(t.relativeDelta!) * 100)}%)</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ApaYangBerubah
