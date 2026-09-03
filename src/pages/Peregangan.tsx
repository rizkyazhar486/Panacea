import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconLeaf } from '../components/icons'
import {
  GERAKAN, PROTOKOL, SALAH_KAPRAH, RUJUKAN_PEREGANGAN,
  type Kapan,
} from '../lib/peregangan'

// ─────────────────────────────────────────────────────────────────────────────
// Peregangan & Postur.
//
// Disusun menurut KAPAN, bukan menurut otot, karena kesalahan yang sebenarnya
// terjadi bukan salah memilih otot melainkan salah memilih waktu: peregangan
// statis sebelum latihan menurunkan tenaga dan tidak menurunkan risiko cedera.
// Halaman yang menyusunnya per otot diam-diam mendorong kesalahan itu.
// ─────────────────────────────────────────────────────────────────────────────

const TAB: { id: Kapan | 'semua'; label: string; emoji: string }[] = [
  { id: 'semua', label: 'All', emoji: '📋' },
  { id: 'sebelum', label: 'Before', emoji: '⚡' },
  { id: 'sesudah', label: 'After', emoji: '🧘' },
  { id: 'harian', label: 'Daily', emoji: '💺' },
  { id: 'yoga', label: 'Yoga & Pilates', emoji: '🕉️' },
]

const WARNA: Record<Kapan, string> = {
  sebelum: 'text-amber-700', sesudah: 'text-emerald-700',
  harian: 'text-sky-700', yoga: 'text-violet-700',
}
const LABEL_KAPAN: Record<Kapan, string> = {
  sebelum: 'dynamic · before training', sesudah: 'static · after training',
  harian: 'daily · posture', yoga: 'yoga & pilates',
}

export function Peregangan() {
  const [tab, setTab] = useState<Kapan | 'semua'>('semua')
  const [cari, setCari] = useState('')
  const [buka, setBuka] = useState<string | null>(null)
  const [protokol, setProtokol] = useState<string | null>(null)

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return GERAKAN.filter((g) => {
      if (tab !== 'semua' && g.kapan !== tab) return false
      if (!q) return true
      return (g.nama + ' ' + g.target + ' ' + g.untuk.join(' ')).toLowerCase().includes(q)
    })
  }, [tab, cari])

  const pAktif = PROTOKOL.find((p) => p.id === protokol) ?? null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle
        icon={<IconLeaf />}
        title="Stretching & Posture"
        subtitle="Organised by when, not by muscle"
      />

      {/* Hal yang paling sering salah, ditaruh paling atas. */}
      <Card className="!border-amber-500/30 !bg-amber-500/5">
        <div className="text-[11px] font-black uppercase tracking-wide text-amber-700">One thing to get straight first</div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600">
          <b>Static</b> stretching before training — holding a position for 30 seconds or more —
          temporarily lowers power and strength, and does <b>not</b> reduce injury risk. What belongs
          before training is <b>dynamic</b> work: movement that takes the joints through their range,
          repeatedly.
        </p>
        <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-600">Static stretching still has its place — after training, or as a session of its own to increase joint range of motion. All that was ever wrong was the timing.</Prosa>
      </Card>

      {/* Protokol siap pakai */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Ready-made routines</div>
        <p className="mt-1 text-[12px] text-neutral-500">Pick the situation, not the muscle.</p>
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PROTOKOL.map((p) => (
            <button
              key={p.id}
              onClick={() => setProtokol(protokol === p.id ? null : p.id)}
              aria-pressed={protokol === p.id}
              className={`rounded-xl p-2.5 text-left transition ${
                protokol === p.id ? 'bg-brand/25 ring-2 ring-brand' : 'bg-white/5'
              }`}>
              <div className="text-lg">{p.ikon}</div>
              <div className="text-[12px] font-black leading-tight text-ink">{p.nama}</div>
              <div className="text-[10px] text-neutral-500">{p.ringkas}</div>
            </button>
          ))}
        </div>

        {pAktif && (
          <div className="mt-3 rounded-xl bg-white/5 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[13px] font-black text-ink">{pAktif.ikon} {pAktif.nama}</div>
              <div className="text-[10px] font-bold text-neutral-500">{pAktif.durasiTotal}</div>
            </div>
            <ol className="mt-2 space-y-1">
              {pAktif.urutan.map((id, i) => {
                const g = GERAKAN.find((x) => x.id === id)
                if (!g) return null
                return (
                  <li key={id}>
                    <button
                      onClick={() => { setBuka(id); setTab('semua') }}
                      className="flex w-full items-baseline gap-2 rounded-lg px-1 py-1 text-left hover:bg-white/5">
                      <span className="text-[11px] font-black text-brand">{i + 1}.</span>
                      <span className="flex-1 text-[12px] font-semibold text-ink">{g.nama}</span>
                      <span className="text-[10px] text-neutral-500">{g.durasi}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{pAktif.catatan}</p>
          </div>
        )}
      </Card>

      {/* Daftar gerakan */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Movements</div>
        <input
          className={`${inputClass} mt-2`}
          placeholder="Search: hamstring, shoulder, running, desk…"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          aria-label="Search movements"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TAB.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                tab === t.id ? 'bg-brand text-white' : 'bg-white/5 text-neutral-600'
              }`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {daftar.length === 0 && (
          <p className="mt-3 text-[12px] text-neutral-500">Tidak ada yang cocok dengan "{cari}".</p>
        )}

        <div className="mt-3 space-y-1.5">
          {daftar.map((g) => {
            const terbuka = buka === g.id
            return (
              <div key={g.id} className="overflow-hidden rounded-xl bg-white/5">
                <button
                  onClick={() => setBuka(terbuka ? null : g.id)}
                  aria-expanded={terbuka}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-black text-ink">{g.nama}</span>
                      {g.video ? <span className="text-[10px]" title="Has a clip">🎬</span>
                        : g.gambar ? <span className="text-[10px]" title="Has a reference photo">🖼️</span> : null}
                    </div>
                    <div className={`truncate text-[10px] font-bold ${WARNA[g.kapan]}`}>{LABEL_KAPAN[g.kapan]}</div>
                  </div>
                  <span className={`shrink-0 text-neutral-500 transition ${terbuka ? 'rotate-90' : ''}`}>›</span>
                </button>
                {terbuka && (
                  <div className="space-y-2 border-t border-white/10 px-3 py-2.5">
                    {g.video ? (
                      <video src={g.video} autoPlay muted loop playsInline preload="metadata"
                        aria-label={`${g.nama} demonstration`}
                        className="aspect-square w-full rounded-xl object-cover" />
                    ) : g.gambar ? (
                      <img src={g.gambar} alt={`${g.nama} end position`} loading="lazy"
                        className="aspect-square w-full rounded-xl object-cover" />
                    ) : null}
                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500">
                      <span><b className="text-neutral-600">Target:</b> {g.target}</span>
                      <span><b className="text-neutral-600">Duration:</b> {g.durasi}</span>
                    </div>
                    <ol className="space-y-1">
                      {g.cara.map((c, i) => (
                        <li key={c} className="flex gap-2 text-[12px] leading-snug text-ink">
                          <span className="font-black text-brand">{i + 1}.</span><span>{c}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="flex flex-wrap gap-1">
                      {g.untuk.map((u) => (
                        <span key={u} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">{u}</span>
                      ))}
                    </div>
                    {g.hindari && (
                      <div className="rounded-lg bg-rose-500/10 p-2">
                        <div className="text-[10px] font-black uppercase text-rose-600">Avoid</div>
                        <p className="text-[12px] leading-snug text-neutral-600">{g.hindari}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Salah kaprah */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Four misconceptions</div>
        <div className="mt-2 space-y-2">
          {SALAH_KAPRAH.map((s) => (
            <div key={s.klaim} className="rounded-xl bg-white/5 p-3">
              <div className="text-[12px] font-bold text-rose-600">✗ {s.klaim}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">{s.fakta}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">References</div>
        <ul className="mt-2 space-y-1">
          {RUJUKAN_PEREGANGAN.map((r) => (
            <li key={r} className="text-[10px] leading-relaxed text-slate-500">{r}</li>
          ))}
        </ul>
        <Prosa kelas="mt-3 text-[11px] leading-relaxed text-neutral-500">The demonstration clips are AI-generated depictions of the movement, not footage of an instructor. If a movement causes sharp pain, tingling, or numbness, stop and get it checked — that points to a nerve, not a muscle.</Prosa>
      </Card>
    </div>
  )
}

export default Peregangan
