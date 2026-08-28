import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconBook } from '../../components/icons'
import { Prosa } from '../../components/Prosa'
import { KURIKULUM, JENJANG_LABEL, semuaTopik } from '../../lib/usmleKurikulum'
import { catatanUntuk } from '../../lib/usmleNotes'
import type { Jenjang, Sumber } from '../../lib/usmle'

// ─────────────────────────────────────────────────────────────────────────────
// Kurikulum praklinik dan USMLE.
//
// SATU KEPUTUSAN TAMPILAN YANG MENENTUKAN SELURUHNYA: keadaan tiap topik
// DITULIS DI LAYAR. Topik yang catatannya sudah ada bertanda "Notes"; yang
// belum bertanda "Outline". Angka keduanya berdiri di kepala halaman.
//
// Alasannya bukan kerendahan hati melainkan kegunaan. Kurikulum yang tampak
// lengkap padahal separuhnya kosong membuat orang menyusun jadwal belajar di
// atas sesuatu yang tidak ada, dan baru mengetahuinya pada malam sebelum
// ujian. Daftar yang mengaku setengah jadi masih bisa dipakai; daftar yang
// berbohong tentang dirinya tidak.
//
// SUMBER SELALU IKUT DITAMPILKAN, dan tidak ada satu pun yang dikarang —
// lihat aturannya di kepala lib/usmle.ts. Tahun pedoman ditulis sebagai
// penanda, disertai peringatan bahwa pedoman diperbarui.
// ─────────────────────────────────────────────────────────────────────────────

const JENJANG: Jenjang[] = ['preklinik', 'step1', 'step2ck', 'step3', 'ecfmg', 'spesialis']

function TautanSumber({ s }: { s: Sumber }) {
  const teks = `${s.badan} — ${s.nama}${s.tahun ? ` (${s.tahun})` : ''}`
  if (!s.tautan) return <span>{teks}</span>
  return (
    <a href={s.tautan} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2">
      {teks}
    </a>
  )
}

export default function UsmleSection({ cariAwal = '' }: { cariAwal?: string }) {
  const [jenjang, setJenjang] = useState<Jenjang | null>(null)
  const [query, setQuery] = useState(cariAwal)
  const [buka, setBuka] = useState<string | null>(null)

  const semua = useMemo(() => semuaTopik(), [])
  const ditulis = useMemo(() => semua.filter((t) => catatanUntuk(t.id)).length, [semua])

  const blok = useMemo(() => {
    const q = query.toLowerCase().trim()
    return KURIKULUM
      .filter((b) => !jenjang || b.jenjang === jenjang)
      .map((b) => ({
        ...b,
        topik: q
          ? b.topik.filter((t) => `${t.judul} ${t.blok} ${t.sistem ?? ''} ${t.mengapa}`.toLowerCase().includes(q))
          : b.topik,
      }))
      .filter((b) => b.topik.length > 0)
  }, [jenjang, query])

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconBook size={20} />}
          title="Preclinical & USMLE curriculum"
          subtitle="The basic sciences, Step 1, Step 2 CK, Step 3, the ECFMG pathway, and specialty training — each topic with the source you can check it against."
        />

        {/* Keadaannya dinyatakan sebagai angka, bukan disamarkan. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{semua.length} topics mapped</Badge>
          <Badge tone={ditulis > 0 ? 'low' : 'neutral'}>{ditulis} with notes written</Badge>
          <Badge tone="neutral">{semua.length - ditulis} outline only</Badge>
        </div>

        <Prosa kelas="mt-2 text-[11px] leading-relaxed text-neutral-500">
          The outline is complete and follows the official USMLE content outline, the ECFMG requirements, and the ABMS
          specialty list. The written notes are not complete, and every topic says which it is — a curriculum that looks
          finished while half of it is empty is worse than one that admits where it stands, because you would build a
          study plan on top of it and find out the night before.
        </Prosa>
        <Prosa kelas="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
          <b>On the sources.</b> Nothing here cites a page number or a DOI. Guidelines are named by the body that
          publishes them so you can find the current edition — a citation that is one digit wrong points at a different
          paper entirely, and nobody would notice. Thresholds that are revised often are pointed at rather than printed.
        </Prosa>
      </Card>

      <Card className="!p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics, disciplines, systems…"
          aria-label="Search curriculum"
          className="min-h-[44px] w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
        />
        <div className="geser-aman mt-2 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setJenjang(null)}
            aria-pressed={jenjang === null}
            className={`min-h-[36px] shrink-0 rounded-full px-3 text-[12px] font-bold ${
              jenjang === null ? 'bg-brand text-ink' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
            }`}
          >
            All
          </button>
          {JENJANG.map((j) => (
            <button
              key={j}
              onClick={() => setJenjang(jenjang === j ? null : j)}
              aria-pressed={jenjang === j}
              className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full px-3 text-[12px] font-bold ${
                jenjang === j ? 'bg-brand text-ink' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
              }`}
            >
              {JENJANG_LABEL[j].judul}
            </button>
          ))}
        </div>
        {jenjang && (
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{JENJANG_LABEL[jenjang].ringkas}</p>
        )}
      </Card>

      {blok.map((b) => (
        <Card key={b.id} className="!p-4">
          <div className="flex items-baseline gap-2">
            <span aria-hidden className="text-[16px]">{b.emoji}</span>
            <h3 className="min-w-0 flex-1 text-[14px] font-black text-ink dark:text-white">{b.judul}</h3>
            <span className="shrink-0 text-[10px] font-bold tabular-nums text-neutral-400">{b.topik.length}</span>
          </div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{b.ringkas}</p>

          <div className="mt-2 space-y-1.5">
            {b.topik.map((t) => {
              const c = catatanUntuk(t.id)
              const terbuka = buka === t.id
              return (
                <div key={t.id} className="rounded-2xl bg-white/60 p-3 dark:bg-white/5">
                  <button
                    onClick={() => setBuka(terbuka ? null : t.id)}
                    aria-expanded={terbuka}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-ink dark:text-white">{t.judul}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
                        {t.mengapa}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide ${
                      c ? 'bg-brand-100 text-brand-dark' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
                    }`}>
                      {c ? 'Notes' : 'Outline'}
                    </span>
                  </button>

                  {terbuka && (
                    <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-white/10">
                      {t.sistem && (
                        <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-neutral-400">
                          {t.sistem}
                        </div>
                      )}

                      {c ? (
                        <div className="space-y-2">
                          <ul className="space-y-1">
                            {c.poin.map((p, i) => (
                              <li key={i} className="flex gap-1.5 text-[12px] leading-[1.6] text-ink dark:text-neutral-200">
                                <span aria-hidden className="shrink-0 text-brand">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                          {c.rumus && (
                            <div className="rounded-xl bg-brand/10 p-2">
                              <div className="text-[10px] font-black uppercase tracking-wide text-brand-dark">
                                Learn exactly
                              </div>
                              <ul className="mt-1 space-y-1">
                                {c.rumus.map((r, i) => (
                                  <li key={i} className="text-[11.5px] leading-[1.6] text-ink dark:text-neutral-200">{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {c.jebakan && (
                            <div className="rounded-xl bg-amber-500/10 p-2">
                              <div className="text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
                                Where this goes wrong
                              </div>
                              <ul className="mt-1 space-y-1">
                                {c.jebakan.map((r, i) => (
                                  <li key={i} className="text-[11.5px] leading-[1.6] text-ink dark:text-neutral-200">{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Kosong ditulis kosong. Tidak ada ringkasan buatan yang
                           menutupi ketiadaannya. */
                        <p className="text-[11.5px] leading-relaxed text-neutral-500">
                          Notes for this topic have not been written yet. The sources below are the ones to read, and
                          they are the same sources the notes will be built from.
                        </p>
                      )}

                      <div className="mt-2">
                        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Sources</div>
                        <ul className="mt-1 space-y-0.5">
                          {t.sumber.map((s, i) => (
                            <li key={i} className="text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
                              <TautanSumber s={s} />
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 text-[10px] leading-snug text-neutral-400">
                          Guidelines are revised. Check the current edition before you rely on a threshold or a dose.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      {blok.length === 0 && (
        <Card className="!p-4">
          <p className="text-[12px] leading-relaxed text-neutral-500">No topic matches that search.</p>
        </Card>
      )}
    </div>
  )
}
