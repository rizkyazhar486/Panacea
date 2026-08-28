import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconShield } from '../components/icons'
import { NABI, NAMA_25, BATAS, type Nabi } from '../lib/kisahNabi'
import { AyatTerambil } from '../components/AyatTerambil'

// ─────────────────────────────────────────────────────────────────────────────
// Kisah para nabi.
//
// RINGKASAN DITULIS DI APLIKASI INI; AYATNYA TIDAK. Tiap kisah menyertakan
// alamat ayat, dan ayatnya DIAMBIL lewat jalur yang sudah memeriksa keutuhan
// teks — sehingga yang membaca ringkasannya dapat langsung memeriksa
// sumbernya tanpa berpindah aplikasi, dan yang ditampilkan sebagai firman
// benar-benar berasal dari penyedia yang disebut namanya.
//
// PERINCIAN YANG SERING DIKIRA BAGIAN AL-QUR'AN diberi tempatnya sendiri di
// tiap kartu. Perincian semacam itu beredar luas dan terdengar meyakinkan,
// dan justru karena itu ia berbahaya di layar yang tampak berwibawa.
// ─────────────────────────────────────────────────────────────────────────────

function Kartu({ n }: { n: Nabi }) {
  const [buka, setBuka] = useState(false)
  const [ayat, setAyat] = useState<string | null>(null)

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-white/10">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex min-h-[56px] w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-black text-ink dark:text-white">
            {n.nama}
            {n.lain && <span className="ml-2 text-[11px] font-semibold text-neutral-400">{n.lain}</span>}
          </span>
          <span className="block text-[11px] text-neutral-400">{n.rujukan.length} passages</span>
        </span>
        <span dir="rtl" lang="ar" className="shrink-0 text-[18px] text-ink dark:text-white">{n.namaArab}</span>
        <span aria-hidden className="shrink-0 text-[12px] font-black text-brand">{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="space-y-3 px-3 pb-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Ringkasan</div>
            <p className="mt-1 text-[13px] leading-[1.7] text-ink dark:text-neutral-200">{n.ringkasId}</p>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">In English</div>
            <p className="mt-1 text-[13px] leading-[1.7] text-neutral-600 dark:text-neutral-300">{n.ringkasEn}</p>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-brand">Read it yourself</div>
            <div className="mt-1.5 space-y-1.5">
              {n.rujukan.map((r) => {
                const kunci = `${r.surah}:${r.ayat ?? 0}`
                const terbuka = ayat === kunci
                return (
                  <div key={kunci} className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5">
                    <button
                      onClick={() => setAyat(terbuka ? null : kunci)}
                      aria-expanded={terbuka}
                      className="flex min-h-[40px] w-full items-baseline justify-between gap-2 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block text-[12px] font-black text-brand-dark dark:text-brand">
                          Surah {r.surah}{r.ayat ? `:${r.ayat}` : ''}
                        </span>
                        <span className="block text-[11.5px] leading-snug text-neutral-600 dark:text-neutral-300">
                          {r.keterangan}
                        </span>
                      </span>
                      {r.ayat && (
                        <span aria-hidden className="shrink-0 text-[11px] font-black text-brand">
                          {terbuka ? '▲' : 'Baca ▼'}
                        </span>
                      )}
                    </button>
                    {terbuka && r.ayat && <AyatTerambil surah={r.surah} ayat={r.ayat} />}
                  </div>
                )
              })}
            </div>
          </div>

          {n.pelajaran.length > 0 && (
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Yang lazim diambil pembaca
              </div>
              <ul className="mt-1 space-y-1">
                {n.pelajaran.map((t, i) => (
                  <li key={i} className="text-[12.5px] leading-snug text-ink dark:text-white">• {t}</li>
                ))}
              </ul>
            </div>
          )}

          {n.seringKeliru && (
            <div className="rounded-xl bg-amber-500/10 p-2.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Sering dikira bagian Al-Qur&apos;an, padahal bukan
              </div>
              <p className="mt-1 text-[12.5px] leading-snug text-ink dark:text-white">{n.seringKeliru}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function KisahNabi() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle
        icon={<IconShield />}
        title="Stories of the prophets"
        subtitle="Ringkasan kisahnya, dan ayat yang memuatnya — diambil, bukan ditulis"
      />

      <div className="space-y-2">
        {NABI.map((n) => <Kartu key={n.id} n={n} />)}
      </div>

      <Card className="!p-4">
        <div className="text-[12px] font-black text-ink dark:text-white">
          Dua puluh lima nama yang disebut dalam Al-Qur&apos;an
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {NAMA_25.join(' · ')}
        </p>
      </Card>

      <Card className="!p-4">
        <div className="text-[12px] font-black text-ink dark:text-white">What this page does and does not do</div>
        <ul className="mt-1.5 space-y-1.5">
          {BATAS.map((t, i) => (
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

export default KisahNabi
