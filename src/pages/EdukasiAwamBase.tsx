import { useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconBook } from '../components/icons'
import { KELUHAN_AWAM, BUKAN, type Keluhan } from '../lib/edukasiAwam'

// ─────────────────────────────────────────────────────────────────────────────
// Halaman edukasi untuk orang awam.
//
// URUTAN DI DALAM TIAP KARTU ADALAH BAGIAN YANG PALING MENENTUKAN, dan ia
// sengaja tidak mengikuti urutan yang lazim dipakai artikel kesehatan:
//
//   biasanya apa → KAPAN HARUS KE DOKTER → yang menolong → yang tidak menolong
//
// Tanda bahaya diletakkan KEDUA, bukan terakhir. Artikel kesehatan pada
// umumnya menaruhnya di paling bawah, sesudah paragraf pengobatan mandiri —
// dan yang membaca sampai bawah justru orang yang paling tidak cemas, sedangkan
// yang benar-benar sakit berhenti membaca begitu menemukan sesuatu yang dapat
// dikerjakan sendiri.
// ─────────────────────────────────────────────────────────────────────────────

function Kartu({ k }: { k: Keluhan }) {
  const [buka, setBuka] = useState(false)
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-white/10">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex min-h-[52px] w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span aria-hidden className="text-[18px]">{k.emoji}</span>
        <span className="min-w-0 flex-1 text-[14px] font-black text-ink dark:text-white">{k.judul}</span>
        <span aria-hidden className="shrink-0 text-[12px] font-black text-brand">{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="space-y-3 px-3 pb-3">
          <p className="text-[13px] leading-[1.7] text-ink dark:text-neutral-200">{k.biasanya}</p>

          {/* PALING PENTING, DAN KARENA ITU PALING ATAS DI ANTARA DAFTARNYA. */}
          {k.segera && k.segera.length > 0 && (
            <div className="rounded-xl bg-red-500/10 p-2.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-red-700 dark:text-red-300">
                Go now — emergency
              </div>
              <ul className="mt-1 space-y-1">
                {k.segera.map((t, i) => (
                  <li key={i} className="text-[12.5px] font-semibold leading-snug text-ink dark:text-white">• {t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl bg-amber-500/10 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
              See a doctor if
            </div>
            <ul className="mt-1 space-y-1">
              {k.keDokter.map((t, i) => (
                <li key={i} className="text-[12.5px] leading-snug text-ink dark:text-white">• {t}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-emerald-500/10 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              What actually helps
            </div>
            <ul className="mt-1 space-y-1.5">
              {k.menolong.map((t, i) => (
                <li key={i} className="text-[12.5px] leading-[1.6] text-ink dark:text-white">• {t}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-neutral-100 p-2.5 dark:bg-white/5">
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              What does not help, despite what you may have heard
            </div>
            <ul className="mt-1 space-y-1.5">
              {k.tidakMenolong.map((t, i) => (
                <li key={i} className="text-[12.5px] leading-[1.6] text-neutral-700 dark:text-neutral-300">• {t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export function EdukasiAwam() {
  const [cari, setCari] = useState('')
  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    if (!q) return KELUHAN_AWAM
    return KELUHAN_AWAM.filter((k) =>
      `${k.judul} ${k.biasanya} ${k.menolong.join(' ')} ${k.keDokter.join(' ')}`.toLowerCase().includes(q),
    )
  }, [cari])

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle
        icon={<IconBook />}
        title="Health, explained"
        subtitle="Everyday complaints: what it usually is, when to see someone, and what actually helps"
      />

      <Card className="!p-4">
        <p className="text-[13px] leading-[1.7] text-ink dark:text-neutral-200">
          Written for anyone, with no medical training assumed. Each topic answers four questions in the same order,
          and the order is deliberate: what it usually is, <b>when to see a doctor</b>, what actually helps, and what
          does not help despite being widely believed.
        </p>
      </Card>

      <input
        type="search"
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="Search a complaint — fever, cough, diarrhoea, sleep…"
        className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 text-[13px] text-ink placeholder:text-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-white"
      />

      <div className="space-y-2">
        {tampil.map((k) => <Kartu key={k.id} k={k} />)}
        {tampil.length === 0 && (
          <p className="text-center text-[12.5px] text-neutral-500">Nothing matched — try another word.</p>
        )}
      </div>

      <Card className="!p-4">
        <div className="text-[12px] font-black text-ink dark:text-white">What this page is not</div>
        <ul className="mt-1.5 space-y-1.5">
          {BUKAN.map((t, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-[1.6] text-neutral-600 dark:text-neutral-300">
              <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-neutral-400" aria-hidden />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

export default EdukasiAwam
