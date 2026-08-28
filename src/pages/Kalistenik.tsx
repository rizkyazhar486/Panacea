import { useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconLeaf } from '../components/icons'
import { FASE, TANGGA, JUMLAH_GERAKAN, ATURAN, type Tangga, type FaseId } from '../lib/kalistenik'
import { bacaKemajuan, tandaiLevel, hitungTuntas, type Kemajuan } from '../lib/kalistenikProgres'
import { GerakDasar } from '../components/GerakDasar'

// ─────────────────────────────────────────────────────────────────────────────
// Kalistenik pemula sampai mahir — empat fase, dua belas tangga, 109 gerakan.
//
// BENTUKNYA TANGGA YANG DAPAT DICENTANG, bukan artikel yang dapat dibaca.
// Program yang hanya bisa dibaca akan dibaca sekali lalu ditutup; yang menahan
// orang kembali adalah melihat di mana ia berdiri sekarang dan apa satu anak
// tangga berikutnya.
//
// Karena itu tiap tangga menunjukkan TIGA hal dan tidak lebih: anak tangga yang
// sudah dikuasai, anak tangga yang sedang dikerjakan, dan syarat angka untuk
// naik. Sisanya terlipat.
// ─────────────────────────────────────────────────────────────────────────────

const WARNA_FASE: Record<FaseId, string> = {
  1: '#34d399',
  2: '#60a5fa',
  3: '#a78bfa',
  4: '#f59e0b',
}

function KartuTangga({
  t,
  kemajuan,
  onTandai,
}: {
  t: Tangga
  kemajuan: Kemajuan
  onTandai: (tanggaId: string, level: number) => void
}) {
  const [buka, setBuka] = useState(false)
  const dikuasai = kemajuan[t.id]?.level ?? 0
  const berikut = t.anak.find((a) => a.level > dikuasai) ?? null
  const pct = Math.round((t.anak.filter((a) => a.level <= dikuasai).length / t.anak.length) * 100)

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-white/10">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="w-full px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-black text-ink dark:text-white">{t.nama}</span>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t.pola}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-[16px] font-black tabular-nums text-ink dark:text-white">
              {dikuasai}/{t.anak.length}
            </span>
            <span className="block text-[10px] font-bold text-neutral-400">{pct}%</span>
          </span>
          <span aria-hidden className="shrink-0 text-[12px] font-black text-brand">{buka ? '▲' : '▼'}</span>
        </div>

        <span className="mt-2 flex h-1.5 gap-[2px]" aria-hidden>
          {t.anak.map((a) => (
            <span
              key={a.level}
              className="flex-1 rounded-full"
              style={{ background: a.level <= dikuasai ? WARNA_FASE[a.fase] : 'rgba(120,120,120,0.22)' }}
            />
          ))}
        </span>

        {!buka && berikut && (
          <span className="mt-2 block text-[12px] leading-snug text-neutral-600 dark:text-neutral-300">
            <b className="text-brand-dark dark:text-brand">Next: </b>
            {berikut.nama} — {berikut.target}
          </span>
        )}
        {!buka && !berikut && (
          <span className="mt-2 block text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
            Whole ladder complete
          </span>
        )}
      </button>

      {buka && (
        <div className="px-3 pb-3">
          <p className="text-[11.5px] leading-snug text-neutral-500">{t.otot}</p>
          <div className="mt-2 space-y-1.5">
            {t.anak.map((a) => {
              const sudah = a.level <= dikuasai
              const sedang = berikut?.level === a.level
              return (
                <div
                  key={a.level}
                  className={`rounded-xl border p-2.5 ${
                    sedang
                      ? 'border-brand bg-brand/5'
                      : sudah
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-neutral-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                      style={{ background: WARNA_FASE[a.fase] }}
                      title={`Phase ${a.fase}`}
                    >
                      {a.level}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-black leading-snug text-ink dark:text-white">{a.nama}</div>
                      <div className="mt-0.5 text-[12px] font-bold tabular-nums text-brand-dark dark:text-brand">
                        {a.target}
                      </div>
                      <p className="mt-1 text-[12px] leading-[1.55] text-neutral-600 dark:text-neutral-300">{a.cue}</p>
                      <p className="mt-1 text-[11.5px] leading-snug text-neutral-500">
                        <b>Unlocks the next step: </b>
                        {a.buka}
                      </p>
                      {a.keliru && (
                        <p className="mt-1.5 rounded-lg bg-amber-500/10 p-2 text-[11.5px] leading-snug text-amber-900 dark:text-amber-200">
                          <b>Common mistake: </b>
                          {a.keliru}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onTandai(t.id, sudah ? a.level - 1 : a.level)}
                    className={`mt-2 min-h-[40px] w-full rounded-lg text-[12px] font-bold ${
                      sudah
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
                    }`}
                  >
                    {sudah ? '✓ Owned — tap to move back' : 'Mark as owned'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function Kalistenik() {
  const [kemajuan, setKemajuan] = useState<Kemajuan>(bacaKemajuan)
  const [faseTampil, setFaseTampil] = useState<FaseId | null>(null)

  const total = useMemo(() => hitungTuntas(kemajuan, TANGGA), [kemajuan])
  const pct = total.total > 0 ? Math.round((total.tuntas / total.total) * 100) : 0

  function tandai(tanggaId: string, level: number) {
    setKemajuan(tandaiLevel(tanggaId, level))
  }

  const tampil = faseTampil === null ? TANGGA : TANGGA.filter((t) => t.anak.some((a) => a.fase === faseTampil))

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle
        icon={<IconLeaf />}
        title="Calisthenics: beginner to advanced"
        subtitle={`Four phases, ${TANGGA.length} ladders, ${JUMLAH_GERAKAN} movements — each step with the number that unlocks the next`}
      />

      {/* KEMAJUAN SEBAGAI ANGKA, PALING ATAS. Ini satu-satunya alasan orang
          membuka halaman ini lagi setelah pekan pertama. */}
      <Card>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Movements owned</div>
            <div className="text-[30px] font-black leading-none tabular-nums text-ink dark:text-white">
              {total.tuntas}
              <span className="text-[16px] font-bold text-neutral-400"> / {total.total}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[26px] font-black leading-none tabular-nums text-brand">{pct}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">of the whole ladder</div>
          </div>
        </div>
        <span className="mt-3 block h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
          <span className="block h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </span>
        <p className="mt-2 text-[11.5px] leading-snug text-neutral-500">
          Nothing here is timed. There is no &ldquo;front lever in 8 weeks&rdquo; because how fast this goes depends on
          your bodyweight, limb length, training age, sleep and food. What is promised is the ORDER.
        </p>
      </Card>

      {/* Lima gerakan dasar, digambar. Ditaruh SEBELUM fase dan tangga:
          yang baru mulai perlu melihat bentuk gerakannya lebih dahulu, sebelum
          diminta memilih anak tangga mana yang ia kuasai. */}
      <div className="space-y-2">
        <h2 className="text-[13px] font-black uppercase tracking-wide text-brand">The five basics, drawn</h2>
        <GerakDasar />
      </div>

      {/* Fase */}
      <div className="space-y-2">
        <h2 className="text-[13px] font-black uppercase tracking-wide text-brand">The four phases</h2>
        {FASE.map((f) => (
          <div key={f.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white"
                style={{ background: WARNA_FASE[f.id] }}
              >
                {f.id}
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-black text-ink dark:text-white">{f.nama}</div>
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-neutral-400">{f.lama}</div>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] leading-[1.6] text-neutral-700 dark:text-neutral-200">{f.fokus}</p>
            <div className="mt-2 rounded-xl bg-emerald-500/10 p-2.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Phase is finished when
              </div>
              <ul className="mt-1 space-y-0.5">
                {f.lulus.map((t, i) => (
                  <li key={i} className="text-[12px] leading-snug text-ink dark:text-white">
                    • {t}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-[11.5px] leading-snug text-neutral-500">
              <b>Week: </b>
              {f.pekan}
            </p>
          </div>
        ))}
      </div>

      {/* Tangga */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-black uppercase tracking-wide text-brand">The ladders</h2>
          <span className="text-[10px] text-neutral-400">{tampil.length} shown</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFaseTampil(null)}
            aria-pressed={faseTampil === null}
            className={`min-h-[36px] rounded-full px-2.5 text-[11px] font-bold ${
              faseTampil === null ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
            }`}
          >
            All
          </button>
          {FASE.map((f) => (
            <button
              key={f.id}
              onClick={() => setFaseTampil(faseTampil === f.id ? null : f.id)}
              aria-pressed={faseTampil === f.id}
              /* Keping yang TIDAK terpilih memakai bentuk yang sama seperti
                 keping "All" di sebelahnya. Sebelumnya ia putih di atas abu-abu
                 35% — terukur 1,64:1, yaitu tulisan yang praktis tidak ada,
                 padahal justru keping yang belum terpilih itulah yang harus
                 terbaca supaya orang tahu ada apa di baliknya. Warna fasenya
                 tetap dipakai, hanya saat keping itu terpilih; dan tulisannya
                 tinta, sebab keempat warna fase itu warna terang. */
              className={`min-h-[36px] rounded-full px-2.5 text-[11px] font-bold ${
                faseTampil === f.id ? 'text-ink' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
              }`}
              style={faseTampil === f.id ? { background: WARNA_FASE[f.id] } : undefined}
            >
              Phase {f.id}
            </button>
          ))}
        </div>
        {tampil.map((t) => (
          <KartuTangga key={t.id} t={t} kemajuan={kemajuan} onTandai={tandai} />
        ))}
      </div>

      {/* Aturan */}
      <div className="space-y-2">
        <h2 className="text-[13px] font-black uppercase tracking-wide text-brand">Rules that apply to every phase</h2>
        {ATURAN.map((a) => (
          <div key={a.judul} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[13px] font-black text-ink dark:text-white">{a.judul}</div>
            <p className="mt-1 text-[12.5px] leading-[1.6] text-neutral-700 dark:text-neutral-200">{a.isi}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Kalistenik
