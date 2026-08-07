import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconActivity } from '../components/icons'
import {
  FORMAT, BENCHMARK, ARKETIPE, RABDO, ATURAN_AMAN, RUJUKAN,
  type Benchmark,
} from '../lib/crossfit'

// ─────────────────────────────────────────────────────────────────────────────
// CrossFit — halaman edukasi.
//
// Susunannya sengaja menaruh penskalaan dan batas berhenti SEJAJAR dengan
// workout-nya, bukan sebagai catatan kaki di bawah. Alasannya medis: format
// berbasis waktu memberi hadiah pada mengabaikan sinyal berhenti, dan halaman
// kesehatan yang menampilkan "AMRAP 20 menit" tanpa cara menurunkannya sudah
// memilih pihak.
// ─────────────────────────────────────────────────────────────────────────────

const KELOMPOK: { id: Benchmark['kelompok'] | 'semua'; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'pemula', label: 'Mulai di sini' },
  { id: 'girls', label: 'The Girls' },
  { id: 'hero', label: 'Hero WOD' },
]

export function CrossFit() {
  const [cari, setCari] = useState('')
  const [kelompok, setKelompok] = useState<Benchmark['kelompok'] | 'semua'>('semua')
  const [hanyaBodyweight, setHanyaBodyweight] = useState(false)
  const [bukaFormat, setBukaFormat] = useState<string | null>('amrap')
  const [bukaWod, setBukaWod] = useState<string | null>(null)

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return BENCHMARK.filter((b) => {
      if (kelompok !== 'semua' && b.kelompok !== kelompok) return false
      if (hanyaBodyweight && !b.bodyweight) return false
      if (!q) return true
      return (b.nama + ' ' + b.format + ' ' + b.isi.join(' ') + ' ' + (b.catatan ?? '')).toLowerCase().includes(q)
    })
  }, [cari, kelompok, hanyaBodyweight])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle
        icon={<IconActivity />}
        title="CrossFit & AMRAP"
        subtitle="Format latihan, benchmark bernama, dan cara menurunkannya agar aman"
      />

      {/* Peringatan didahulukan, bukan disembunyikan di bawah. */}
      <Card className="!border-rose-500/30 !bg-rose-500/5">
        <div className="text-[11px] font-black uppercase tracking-wide text-rose-400">⚠️ {RABDO.judul}</div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-300">{RABDO.isi}</p>
        <div className="mt-2 text-[11px] font-bold text-slate-400">Segera cari pertolongan medis bila muncul:</div>
        <ul className="mt-1 space-y-1">
          {RABDO.tanda.map((t) => (
            <li key={t} className="flex gap-2 text-[12px] leading-snug text-slate-300">
              <span className="text-rose-400">•</span><span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Format */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Format latihan</div>
        <p className="mt-1 text-[12px] text-slate-400">
          Semua sesi CrossFit adalah salah satu dari ini. Memahami formatnya lebih berguna daripada menghafal nama workout.
        </p>
        <div className="mt-3 space-y-1.5">
          {FORMAT.map((f) => {
            const buka = bukaFormat === f.id
            return (
              <div key={f.id} className="overflow-hidden rounded-xl bg-white/5">
                <button
                  onClick={() => setBukaFormat(buka ? null : f.id)}
                  aria-expanded={buka}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left">
                  <div className="min-w-0">
                    <div className="text-[13px] font-black text-white">{f.nama}</div>
                    <div className="truncate text-[11px] text-slate-400">{f.singkat}</div>
                  </div>
                  <span className={`shrink-0 text-slate-400 transition ${buka ? 'rotate-90' : ''}`}>›</span>
                </button>
                {buka && (
                  <div className="space-y-2 border-t border-white/10 px-3 py-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{f.kepanjangan}</div>
                    <p className="text-[12px] leading-relaxed text-slate-300">{f.caraKerja}</p>
                    <div className="rounded-lg bg-emerald-500/10 p-2">
                      <div className="text-[10px] font-black uppercase text-emerald-400">Bagus untuk</div>
                      <p className="text-[12px] leading-snug text-slate-300">{f.bagusUntuk}</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 p-2">
                      <div className="text-[10px] font-black uppercase text-amber-400">Jebakannya</div>
                      <p className="text-[12px] leading-snug text-slate-300">{f.jebakan}</p>
                    </div>
                    <div className="text-[11px] text-slate-400"><b>Contoh:</b> {f.contoh}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Arketipe motivasi */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Pilih gaya Anda</div>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
          Enam arketipe, masing-masing menunjuk ke format yang cocok. Pilih yang paling terasa seperti
          Anda — bukan yang paling keren.
        </p>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {ARKETIPE.map((a) => (
            <div key={a.id} className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{a.ikon}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-black leading-tight text-white">{a.nama}</div>
                  <div className="text-[10px] text-slate-400">{a.sifat}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-300"><b>Fokus:</b> {a.latihan}</div>
              <div className="text-[11px] text-slate-300"><b>Mulai dari:</b> {a.format}</div>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">{a.kenapa}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Benchmark */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Benchmark</div>
        <input
          className={`${inputClass} mt-2`}
          placeholder="Cari: cindy, murph, pull-up, kettlebell…"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          aria-label="Cari benchmark"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {KELOMPOK.map((k) => (
            <button
              key={k.id}
              onClick={() => setKelompok(k.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                kelompok === k.id ? 'bg-brand text-white' : 'bg-white/5 text-slate-300'
              }`}>
              {k.label}
            </button>
          ))}
          <button
            onClick={() => setHanyaBodyweight((v) => !v)}
            aria-pressed={hanyaBodyweight}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              hanyaBodyweight ? 'bg-brand text-white' : 'bg-white/5 text-slate-300'
            }`}>
            Tanpa alat
          </button>
        </div>

        {daftar.length === 0 && (
          <p className="mt-3 text-[12px] text-slate-400">Tidak ada yang cocok dengan "{cari}".</p>
        )}

        <div className="mt-3 space-y-1.5">
          {daftar.map((b) => {
            const buka = bukaWod === b.nama
            return (
              <div key={b.nama} className="overflow-hidden rounded-xl bg-white/5">
                <button
                  onClick={() => setBukaWod(buka ? null : b.nama)}
                  aria-expanded={buka}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-black text-white">{b.nama}</span>
                      {b.bodyweight && (
                        <span className="rounded bg-emerald-500/20 px-1 text-[9px] font-bold text-emerald-400">tanpa alat</span>
                      )}
                      {b.kelompok === 'hero' && (
                        <span className="rounded bg-white/10 px-1 text-[9px] font-bold text-slate-300">hero</span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-slate-400">{b.format}</div>
                  </div>
                  <span className={`shrink-0 text-slate-400 transition ${buka ? 'rotate-90' : ''}`}>›</span>
                </button>
                {buka && (
                  <div className="space-y-2 border-t border-white/10 px-3 py-2.5">
                    <ul className="space-y-0.5">
                      {b.isi.map((x) => (
                        <li key={x} className="text-[12px] text-slate-200">• {x}</li>
                      ))}
                    </ul>
                    {b.bebanRx && <div className="text-[11px] text-slate-400"><b>Beban Rx:</b> {b.bebanRx}</div>}
                    <div className="text-[11px] text-slate-400"><b>Rentang waktu:</b> {b.targetWaktu}</div>
                    <div className="rounded-lg bg-brand/10 p-2">
                      <div className="text-[10px] font-black uppercase text-brand">Cara menurunkannya</div>
                      <p className="text-[12px] leading-snug text-slate-300">{b.skala}</p>
                    </div>
                    {b.catatan && <p className="text-[11px] leading-relaxed text-slate-400">{b.catatan}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Aturan aman */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Enam aturan yang menjaga Anda tetap berlatih</div>
        <ul className="mt-2 space-y-1.5">
          {ATURAN_AMAN.map((a, i) => (
            <li key={a} className="flex gap-2 text-[12px] leading-relaxed text-slate-300">
              <span className="font-black text-brand">{i + 1}.</span><span>{a}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Rujukan</div>
        <ul className="mt-2 space-y-1">
          {RUJUKAN.map((r) => (
            <li key={r} className="text-[10px] leading-relaxed text-slate-500">{r}</li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          "The Girls" dan "Hero WOD" adalah benchmark bernama milik CrossFit Inc. yang sudah lama
          beredar umum; yang dimuat di sini hanya daftar gerakan dan repetisinya. Hero WOD dinamai
          dari anggota militer dan petugas penyelamat yang gugur — asal namanya disebutkan karena
          memang pantas diketahui. Halaman ini bersifat edukatif dan bukan pengganti penilaian
          pelatih atau dokter.
        </p>
      </Card>
    </div>
  )
}

export default CrossFit
