import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconChartUp } from '../components/icons'
import { GrafikProgres, GLIF, panahDelta } from '../components/GrafikProgres'
import { Accordion } from '../components/Accordion'
import { getWorkouts } from '../lib/workoutStore'
import {
  UKURAN, bandingkan, ringkas, kunciPekan, BATAS_PROGRES,
  type PekanProgres,
} from '../lib/progresPekanan'

// Pelacak progres pekanan.
//
// Permintaannya berbunyi: bandingkan hasil saya minggu ke minggu, tunjukkan
// apa yang berhasil, temukan masalahnya. Itu pertanyaan tentang ARAH pada
// beberapa ukuran sekaligus -- dan arah dibaca dari bentuk garis, bukan dari
// paragraf yang menceritakan garis.

const KUNCI = 'pmd_progres_pekanan_v1'

function muat(): PekanProgres[] {
  try {
    const mentah = JSON.parse(localStorage.getItem(KUNCI) || '[]')
    return Array.isArray(mentah) ? mentah.filter((p) => p && typeof p.pekan === 'string') : []
  } catch { return [] }
}

function simpan(p: PekanProgres[]) {
  try { localStorage.setItem(KUNCI, JSON.stringify(p)) } catch { /* ignore */ }
}

/** Sesi pekan ini dibaca dari catatan latihan, bukan diketik ulang. */
function sesiPekan(kunci: string): number {
  const awal = Date.parse(`${kunci}T00:00:00Z`)
  if (!Number.isFinite(awal)) return 0
  const akhir = awal + 7 * 86400_000
  return getWorkouts().filter((w) => {
    const t = Date.parse(w.mulai)
    return Number.isFinite(t) && t >= awal && t < akhir
  }).length
}

export function PelatihProgres() {
  const [pekan, setPekan] = useState<PekanProgres[]>(muat)
  const [tabel, setTabel] = useState(false)
  const kunciKini = useMemo(() => kunciPekan(new Date()), [])

  // Konsistensi TIDAK diketik: ia sudah ada di catatan latihan, dan meminta
  // orang mengetik ulang angka yang sudah dimiliki aplikasi adalah cara
  // paling mudah membuat dua angka berbeda tentang hal yang sama.
  useEffect(() => {
    const n = sesiPekan(kunciKini)
    setPekan((lama) => {
      const ada = lama.find((p) => p.pekan === kunciKini)
      if (ada?.nilai.konsistensi === n) return lama
      const sisa = lama.filter((p) => p.pekan !== kunciKini)
      const baru = [...sisa, { pekan: kunciKini, nilai: { ...(ada?.nilai ?? {}), konsistensi: n } }]
      simpan(baru)
      return baru
    })
  }, [kunciKini])

  const banding = useMemo(() => bandingkan(pekan), [pekan])
  const r = useMemo(() => ringkas(banding), [banding])
  const kini = pekan.find((p) => p.pekan === kunciKini)

  function isi(id: string, teks: string) {
    const n = Number(teks)
    setPekan((lama) => {
      const ada = lama.find((p) => p.pekan === kunciKini)
      const nilai = { ...(ada?.nilai ?? {}) }
      if (teks.trim() === '' || !Number.isFinite(n) || n <= 0) delete nilai[id]
      else nilai[id] = n
      const baru = [...lama.filter((p) => p.pekan !== kunciKini), { pekan: kunciKini, nilai }]
      simpan(baru)
      return baru
    })
  }

  return (
    <div className="space-y-4">
      <SectionTitle icon={<IconChartUp />} title="Progress tracker"
        subtitle="Week against week — what moved, what did not, and what is too small to call" />

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-black text-ink dark:text-white">This week · {kunciKini}</h3>
          <span className="text-[11px] font-semibold text-neutral-500">{pekan.length} {pekan.length === 1 ? 'week' : 'weeks'} recorded</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {UKURAN.filter((u) => u.asal === 'diisi sendiri').map((u) => (
            <label key={u.id} className="block">
              <span className="flex items-baseline justify-between text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                <span>{u.label}</span><span className="text-[10px] text-neutral-400">{u.satuan}</span>
              </span>
              <input
                type="number" inputMode="decimal" step="0.1" min={0}
                value={kini?.nilai[u.id] ?? ''}
                onChange={(e) => isi(u.id, e.target.value)}
                aria-label={u.label}
                placeholder="—"
                className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300/70 bg-white px-3 text-sm font-semibold text-ink dark:border-white/15 dark:bg-white/[.06] dark:text-white"
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Sessions this week ({kini?.nilai.konsistensi ?? 0}) are read from your training log, not typed — asking you
          to retype a number the app already holds is the easiest way to end up with two different answers.
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-black text-ink dark:text-white">Week by week</h3>
          <button type="button" onClick={() => setTabel((v) => !v)}
            className="min-h-11 text-[11px] font-black text-brand">
            {tabel ? 'Show charts' : 'Show as table'}
          </button>
        </div>

        {tabel ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="py-1 pr-3 font-bold">Measure</th>
                  <th className="py-1 pr-3 font-bold">Previous</th>
                  <th className="py-1 pr-3 font-bold">Latest</th>
                  <th className="py-1 font-bold">Change</th>
                </tr>
              </thead>
              <tbody>
                {banding.map((b) => (
                  <tr key={b.ukuran.id} className="border-t border-neutral-200/70 dark:border-white/10">
                    <td className="py-1.5 pr-3 font-semibold text-ink dark:text-neutral-100">{b.ukuran.label}</td>
                    <td className="py-1.5 pr-3 tabular-nums text-neutral-600 dark:text-neutral-300">{b.lalu ?? '—'}</td>
                    <td className="py-1.5 pr-3 tabular-nums text-neutral-600 dark:text-neutral-300">{b.kini ?? '—'}</td>
                    <td className="py-1.5 tabular-nums text-neutral-600 dark:text-neutral-300">
                      {b.arah && b.delta !== null
                        ? `${panahDelta(b.delta, b.arah === 'datar')} ${b.delta > 0 ? '+' : ''}${b.delta} — ${GLIF[b.arah].kata}`
                        : 'not enough weeks'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {banding.map((b) => <GrafikProgres key={b.ukuran.id} banding={b} />)}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-black text-ink dark:text-white">What moved</h3>
        {r.berhasil.length === 0 && r.bermasalah.length === 0 ? (
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Nothing to compare yet. A direction needs two weeks of the same measure, and until then nothing is
            called working or broken — a single reading has no direction.
          </p>
        ) : (
          <div className="mt-2 space-y-2 text-[12px] leading-relaxed">
            {r.berhasil.length > 0 && (
              <p className="text-neutral-700 dark:text-neutral-200">
                <b>Working:</b> {r.berhasil.map((b) => `${b.ukuran.label} ${b.delta! > 0 ? '+' : ''}${b.delta} ${b.ukuran.satuan}`).join(' · ')}
              </p>
            )}
            {r.bermasalah.length > 0 && (
              <p className="text-neutral-700 dark:text-neutral-200">
                <b>Going the wrong way:</b> {r.bermasalah.map((b) => `${b.ukuran.label} ${b.delta! > 0 ? '+' : ''}${b.delta} ${b.ukuran.satuan}`).join(' · ')}
              </p>
            )}
            {r.datar.length > 0 && (
              <p className="text-neutral-600 dark:text-neutral-300">
                <b>Too small to call:</b> {r.datar.map((b) => `${b.ukuran.label} (under ${b.ukuran.ambang} ${b.ukuran.satuan})`).join(' · ')}
              </p>
            )}
          </div>
        )}
      </Card>

      <Accordion title="Limits" className="mt-1">
        <ul className="space-y-1.5">
          {BATAS_PROGRES.map((b) => <li key={b}>· {b}</li>)}
        </ul>
      </Accordion>
    </div>
  )
}
