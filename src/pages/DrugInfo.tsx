import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass, Button, Badge } from '../components/ui'
import { IconPill, IconShield } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { ATC, cariObat, jumlahObat, jumlahEml, dosisSkdi, type Obat } from '../lib/obatKatalog'
import { HERBAL, cariHerbal, jumlahHerbal, BUKTI_LABEL, BPOM_LABEL, type Herbal } from '../lib/herbal'
import { semuaButir, periksa, dariNama, type Butir } from '../lib/interaksi'

// ─────────────────────────────────────────────────────────────────────────────
// Drug Info — dua sumber, dan tiap kalimat di layar mengaku datang dari yang mana.
//
// Sebelum ini halaman ini hanya berupa satu kotak pencarian yang meneruskan
// pertanyaannya ke openFDA. Bagus selama servernya hidup dan selama obatnya
// terdaftar di Amerika Serikat, dan KOSONG SAMA SEKALI di luar itu — tanpa
// jaringan tidak ada apa pun, dan zat yang tidak dipasarkan di sana tidak
// ditemukan meskipun ia obat yang dipakai setiap hari di tempat lain.
//
// Sekarang ada dua lapis:
//
//   1. KATALOG DI DALAM APLIKASI. Zat aktif beserta golongan, kelompok ATC,
//      indikasi, dan satu catatan keamanan yang benar-benar perlu diketahui.
//      Selalu ada, juga tanpa jaringan. TIDAK ADA DOSIS di sini — alasannya
//      ditulis panjang di kepala lib/obatKatalog.ts, dan ringkasnya: dosis
//      yang dikarang di aplikasi medis bukan ketidaknyamanan, ia bahaya.
//
//   2. LABEL RESMI, saat daring. openFDA lewat server aplikasi ini, berikut
//      dosis dan peringatan sebagaimana tertulis di labelnya. Di sinilah dosis
//      boleh muncul, sebab ia dikutip dari dokumen resmi, bukan dari ingatan.
//
// Tiap bagian di layar menyebutkan sumbernya. Pembaca yang tidak tahu sebuah
// kalimat datang dari label atau dari katalog tidak punya cara menimbangnya.
// ─────────────────────────────────────────────────────────────────────────────

interface Drug { brand: string; generic: string; purpose: string; usage: string; warnings: string; dosage: string; adverse: string; manufacturer: string }
interface RelatedDrug { name: string; tty: string }
const EXAMPLES = ['metformin', 'amoxicillin', 'artesunate', 'enoxaparin', 'levothyroxine']
const TTY_LABEL: Record<string, string> = { SCD: 'Generic', SBD: 'Brand' }

export function DrugInfo() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [drug, setDrug] = useState<Drug | null | undefined>(undefined)
  const [related, setRelated] = useState<RelatedDrug[]>([])
  const [pilih, setPilih] = useState<Obat | null>(null)
  const [jelajah, setJelajah] = useState<string | null>(null)
  const [tab, setTab] = useState<'obat' | 'herbal' | 'periksa'>('obat')
  const [daftar, setDaftar] = useState<Butir[]>([])
  const [cariButir, setCariButir] = useState('')
  const [muatPengingat, setMuatPengingat] = useState(false)
  const [takDikenali, setTakDikenali] = useState<string[]>([])
  const [pesanPengingat, setPesanPengingat] = useState('')
  const [herbalBuka, setHerbalBuka] = useState<string | null>(null)

  const total = useMemo(() => jumlahObat(), [])
  const eml = useMemo(() => jumlahEml(), [])
  const hasil = useMemo(() => cariObat(q), [q])
  const hasilHerbal = useMemo(() => cariHerbal(q), [q])
  const totalHerbal = useMemo(() => jumlahHerbal(), [])
  const dosis = useMemo(() => (pilih ? dosisSkdi(pilih.nama) : []), [pilih])
  const butir = useMemo(() => semuaButir(), [])
  const saran = useMemo(() => {
    const t = cariButir.toLowerCase().trim()
    if (t.length < 2) return []
    return butir
      .filter((x) => !daftar.some((d) => d.id === x.id) && `${x.nama} ${x.keterangan}`.toLowerCase().includes(t))
      .slice(0, 8)
  }, [cariButir, butir, daftar])
  const temuan = useMemo(() => periksa(daftar), [daftar])

  async function search(name?: string) {
    const text = (name ?? q).trim()
    if (!text) return
    if (name) setQ(name)
    setLoading(true); setErr(''); setDrug(undefined); setRelated([])
    try {
      const r = await api.lookupDrug(text)
      setDrug(r.drug)
      if (r.error) setErr('The label database is temporarily unavailable. The catalogue entry above still applies.')
      api.findRelatedDrugs(text).then((rr) => setRelated(rr.drugs)).catch(() => {})
    } catch {
      setErr('Could not reach the label database. The catalogue entry above still applies — it works offline.')
    } finally { setLoading(false) }
  }

  /**
   * Ambil daftar obat yang SUDAH tersimpan sebagai pengingat, alih-alih
   * memaksa mengetiknya ulang. Daftar yang harus diketik ulang tiap kali
   * adalah daftar yang tidak pernah diperiksa.
   *
   * Nama yang tidak dikenali TIDAK dibuang diam-diam — ia ditampilkan. Nama
   * yang hilang tanpa jejak membuat pemeriksaan tampak lengkap padahal
   * separuh daftarnya tidak pernah ikut diperiksa.
   */
  async function dariPengingat() {
    setMuatPengingat(true); setPesanPengingat(''); setTakDikenali([])
    try {
      const r = await api.listReminders()
      const nama = r.filter((x) => x.active).map((x) => `${x.medName} ${x.dose ?? ''}`.trim())
      if (nama.length === 0) { setPesanPengingat('No active reminders saved yet.'); return }
      const { cocok, tidakDikenali } = dariNama(nama)
      setDaftar((d) => [...d, ...cocok.filter((c) => !d.some((y) => y.id === c.id))])
      setTakDikenali(tidakDikenali)
      if (cocok.length === 0) setPesanPengingat('None of your reminders matched a substance in the catalogue.')
    } catch {
      setPesanPengingat('Could not reach your saved reminders. You can still add medicines by hand below.')
    } finally { setMuatPengingat(false) }
  }

  function buka(x: Obat) {
    setPilih(x); setQ(x.nama); search(x.nama)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconPill size={20} />}
          title="Drug Info"
          subtitle="Search an active substance — its class, what it is used for, and the safety point that matters. The official label is fetched on top when you are online."
        />
        {tab !== 'periksa' && <div className="mt-3 flex gap-2">
          <input
            className={inputClass}
            value={q}
            onChange={(e) => { setQ(e.target.value); setPilih(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') search() }}
            placeholder="Generic or brand name — e.g. metformin"
            aria-label="Search drugs"
          />
          <Button onClick={() => search()} disabled={loading || !q.trim()}>{loading ? '…' : 'Label'}</Button>
        </div>}

        {/* Herbal berdiri sebagai bagiannya sendiri, tidak dicampur ke dalam
            daftar obat. Mencampurnya membuat keduanya terbaca seperti benda
            yang setara — padahal yang satu punya label resmi berdosis dan yang
            lain kadar bahan aktifnya berbeda antar produk dan antar panen. */}
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={() => setTab('obat')} aria-pressed={tab === 'obat'}
            className={`min-h-[36px] flex-1 rounded-full px-3 text-[12px] font-bold ${
              tab === 'obat' ? 'bg-brand text-ink' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}
          >
            💊 Medicines
          </button>
          <button
            onClick={() => setTab('herbal')} aria-pressed={tab === 'herbal'}
            className={`min-h-[36px] flex-1 rounded-full px-3 text-[12px] font-bold ${
              tab === 'herbal' ? 'bg-brand text-ink' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}
          >
            🌿 Herbal
          </button>
          <button
            onClick={() => setTab('periksa')} aria-pressed={tab === 'periksa'}
            className={`min-h-[36px] flex-1 rounded-full px-3 text-[12px] font-bold ${
              tab === 'periksa' ? 'bg-brand text-ink' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}
          >
            ⚠️ Check
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {tab === 'periksa' ? (
            <Badge tone="neutral">{daftar.length} in your list</Badge>
          ) : tab === 'obat' ? (
            <>
              <Badge tone="brand">{total} substances</Badge>
              <Badge tone="low">{eml} on the WHO essential list</Badge>
            </>
          ) : (
            <Badge tone="brand">{totalHerbal} preparations</Badge>
          )}
          <Badge tone="neutral">works offline</Badge>
        </div>

        {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{err}</p>}

        {!q && tab !== 'periksa' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => { setQ(ex) }} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-brand-50 hover:text-brand-dark dark:bg-white/5 dark:text-neutral-300">
                {ex}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* ── Hasil katalog: instan, tanpa jaringan ───────────────────────────── */}
      {tab === 'obat' && q.trim() && !pilih && (
        <Card className="!p-4">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            In this app's catalogue {hasil.length > 0 && `· ${hasil.length}`}
          </div>
          {hasil.length === 0 ? (
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              Not in the catalogue. That does not mean the drug does not exist — the catalogue holds {total} active
              substances, not every product on earth. Press <b>Label</b> to search the official FDA label database
              instead, which covers essentially everything marketed in the United States.
            </p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {hasil.map((x) => (
                <button
                  key={x.nama}
                  onClick={() => buka(x)}
                  className="flex w-full items-start gap-2 rounded-2xl bg-white/60 p-2.5 text-left dark:bg-white/5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-[13px] font-bold text-ink dark:text-white">{x.nama}</span>
                      {x.eml && <span className="rounded-full bg-brand-100 px-1.5 py-px text-[9px] font-black uppercase text-brand-dark">WHO EML</span>}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
                      {x.kelas} · {x.untuk}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-black text-neutral-400">{x.huruf}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'obat' && pilih && (
        <Card className="!p-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <div className="text-xl font-black text-ink dark:text-white">{pilih.nama}</div>
            {pilih.eml && <Badge tone="brand">WHO essential medicine</Badge>}
          </div>
          <div className="mt-0.5 text-sm text-neutral-500">{pilih.kelas}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink dark:text-neutral-200">{pilih.untuk}</p>
          {pilih.catatan && (
            <div className="mt-2 rounded-xl bg-amber-500/10 p-2.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Worth knowing
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink dark:text-neutral-200">{pilih.catatan}</p>
            </div>
          )}
          {/* Ketiadaan dosis DINYATAKAN, bukan dibiarkan tampak seperti kelalaian. */}
          {dosis.length > 0 ? (
            <div className="mt-2 rounded-xl bg-brand/10 p-2.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-brand-dark">
                Dose · from this app's SKDI therapy reference
              </div>
              {dosis.map((d, i) => (
                <div key={i} className="mt-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                    {d.golongan} · {d.keluhan}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink dark:text-neutral-200">{d.dosis}</p>
                </div>
              ))}
              {/* Dosis ini milik GOLONGANNYA, dan sering menyebut lebih dari
                  satu zat di dalamnya. Menyebutnya "dosis obat ini" akan
                  keliru pada golongan yang anggotanya beberapa. */}
              <p className="mt-1.5 text-[10px] leading-snug text-neutral-500">
                These are the doses recorded for the drug group, which may name more than one substance. Written for
                Indonesian practice; check against the label for the product in your hand.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-[10.5px] leading-relaxed text-neutral-500">
              No dose is given here on purpose. Doses in this app come from a source that can be named — the official
              label below, or the curated SKDI therapy reference — never from memory.
            </p>
          )}
          <button onClick={() => { setPilih(null) }} className="mt-2 min-h-[36px] text-[11px] font-bold text-brand">
            ← Back to results
          </button>
        </Card>
      )}

      {tab === 'obat' && loading && <Card className="!p-8 text-center"><span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /></Card>}

      {tab === 'obat' && drug === null && !loading && (
        <Card className="!p-5 text-center text-sm text-neutral-500">
          No FDA label found for that name. The label database covers products marketed in the United States, so a drug
          used elsewhere can be entirely real and still absent here. Try the generic name, or check the spelling.
        </Card>
      )}

      {tab === 'obat' && drug && (
        <>
          <Card className="!p-5">
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">From the official label</div>
            <div className="mt-1 text-lg font-black text-ink dark:text-white">{drug.brand}</div>
            {drug.generic && <div className="text-sm text-neutral-500">Generic: {drug.generic}</div>}
            {drug.manufacturer && <div className="mt-0.5 text-[11px] text-neutral-500">{drug.manufacturer}</div>}
          </Card>
          <Section title="What it is for" body={drug.purpose || drug.usage} />
          <Section title="Dosage & administration" body={drug.dosage} />
          <Section title="⚠️ Warnings" body={drug.warnings} danger />
          <Section title="Possible side effects" body={drug.adverse} />
          {related.length > 0 && (
            <Card className="!p-5">
              <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Related brand/generic products</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {related.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
                    {TTY_LABEL[d.tty] && <span className="text-[10px] font-bold uppercase text-brand-dark">{TTY_LABEL[d.tty]}</span>}
                    {d.name}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">Via RxNorm (NIH) — other formulations and brands of the same active ingredient. Not a substitution check.</p>
            </Card>
          )}
        </>
      )}

      {/* ── Jelajah menurut kelompok ATC ────────────────────────────────────── */}
      {tab === 'obat' && !q.trim() && (
        <Card className="!p-4">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Browse by ATC group</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
            The anatomical–therapeutic–chemical classification, published by the WHO Collaborating Centre for Drug
            Statistics Methodology. Only the groups are given here, never a per-substance code — one wrong digit in a
            seven-character code points at a different drug entirely, and nobody would notice.
          </p>
          <div className="mt-2 space-y-1.5">
            {ATC.map((g) => {
              const n = g.sub.reduce((a, s) => a + s.obat.length, 0)
              const terbuka = jelajah === g.huruf
              return (
                <div key={g.huruf} className="rounded-2xl bg-white/60 dark:bg-white/5">
                  <button
                    onClick={() => setJelajah(terbuka ? null : g.huruf)}
                    aria-expanded={terbuka}
                    className="flex min-h-[48px] w-full items-center gap-2 p-2.5 text-left"
                  >
                    <span aria-hidden className="text-[16px]">{g.emoji}</span>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-100 text-[11px] font-black text-brand-dark">
                      {g.huruf}
                    </span>
                    <span className="min-w-0 flex-1 text-[12.5px] font-bold text-ink dark:text-white">{g.judul}</span>
                    <span className="shrink-0 text-[10px] font-bold tabular-nums text-neutral-400">{n}</span>
                  </button>
                  {terbuka && (
                    <div className="space-y-2 px-2.5 pb-2.5">
                      {g.sub.map((sb) => (
                        <div key={sb.nama}>
                          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">{sb.nama}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {sb.obat.map((x) => (
                              <button
                                key={x.nama}
                                onClick={() => buka(x)}
                                className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-200"
                              >
                                {x.nama}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── Herbal ─────────────────────────────────────────────────────────── */}
      {tab === 'herbal' && (
        <>
          <Card className="!p-4">
            <p className="text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              Traditional use is listed, and then what the human evidence actually shows — including when the honest
              answer is "thin", or "trials were done and did not find it". Both can be true of the same plant at once,
              and hiding the second out of respect for the first respects nobody.
            </p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              <b>Interactions are the reason this section exists.</b> Herbal preparations are commonly taken alongside
              prescribed medicines, and it is the meeting of the two that causes harm more often than either alone.
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-neutral-500">
              No doses are given. The amount of active constituent differs between products and between harvests, so any
              number printed here would be wrong for almost every real product.
            </p>
          </Card>

          {(q.trim() ? [{ id: 'cari', judul: `Matching “${q.trim()}”`, emoji: '🔎', isi: hasilHerbal }] : HERBAL).map((g) => (
            g.isi.length === 0 ? null : (
              <Card key={g.id} className="!p-4">
                <div className="flex items-baseline gap-2">
                  <span aria-hidden className="text-[16px]">{g.emoji}</span>
                  <h3 className="min-w-0 flex-1 text-[13.5px] font-black text-ink dark:text-white">{g.judul}</h3>
                  <span className="shrink-0 text-[10px] font-bold tabular-nums text-neutral-400">{g.isi.length}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {g.isi.map((h: Herbal) => {
                    const bk = BUKTI_LABEL[h.bukti]
                    const terbuka = herbalBuka === h.latin
                    return (
                      <div key={h.latin} className="rounded-2xl bg-white/60 p-3 dark:bg-white/5">
                        <button
                          onClick={() => setHerbalBuka(terbuka ? null : h.latin)}
                          aria-expanded={terbuka}
                          className="flex w-full items-start gap-2 text-left"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-bold text-ink dark:text-white">
                              {h.nama}{h.lokal ? ` · ${h.lokal}` : ''}
                            </span>
                            <span className="block text-[11px] italic text-neutral-500">{h.latin}</span>
                          </span>
                          <span className="shrink-0"><Badge tone={bk.nada}>{bk.label}</Badge></span>
                        </button>

                        {terbuka && (
                          <div className="mt-2 space-y-2 border-t border-neutral-200 pt-2 dark:border-white/10">
                            <Baris judul="Traditionally used for" isi={h.tradisional} />
                            <Baris judul={`Evidence · ${bk.label}`} isi={`${h.temuan} ${bk.jelas}`} />
                            {h.interaksi && (
                              <div className="rounded-xl bg-rose-500/10 p-2">
                                <div className="text-[10px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-300">
                                  Interactions with medicines
                                </div>
                                <p className="mt-0.5 text-[12px] leading-relaxed text-ink dark:text-neutral-200">{h.interaksi}</p>
                              </div>
                            )}
                            {h.bahaya && (
                              <div className="rounded-xl bg-amber-500/10 p-2">
                                <div className="text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
                                  Harms
                                </div>
                                <p className="mt-0.5 text-[12px] leading-relaxed text-ink dark:text-neutral-200">{h.bahaya}</p>
                              </div>
                            )}
                            {h.bpom && (
                              <p className="text-[11px] leading-snug text-neutral-500">
                                <b>Indonesia · {BPOM_LABEL[h.bpom].label}</b> — {BPOM_LABEL[h.bpom].jelas}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          ))}

          {q.trim() && hasilHerbal.length === 0 && (
            <Card className="!p-4">
              <p className="text-[12px] leading-relaxed text-neutral-500">
                No herbal preparation here matches that. Absence from this list is not a safety statement — it means it
                has not been written up yet.
              </p>
            </Card>
          )}
        </>
      )}

      {/* ── Pemeriksa interaksi ─────────────────────────────────────────────── */}
      {tab === 'periksa' && (
        <>
          <Card className="!p-4">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Your list</div>
              {backendEnabled && (
                <button
                  onClick={dariPengingat}
                  disabled={muatPengingat}
                  className="min-h-[36px] text-[11px] font-bold text-brand"
                >
                  {muatPengingat ? 'Loading…' : 'Load my reminders'}
                </button>
              )}
            </div>
            {pesanPengingat && (
              <p className="mt-1 text-[11px] leading-snug text-neutral-500">{pesanPengingat}</p>
            )}
            {takDikenali.length > 0 && (
              /* Yang tidak dikenali DITAMPILKAN, bukan dibuang. */
              <div className="mt-1.5 rounded-xl bg-amber-500/10 p-2">
                <div className="text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  Not recognised — these were NOT checked
                </div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink dark:text-neutral-200">
                  {takDikenali.join(' · ')}
                </p>
                <p className="mt-1 text-[10.5px] leading-snug text-neutral-600 dark:text-neutral-300">
                  Compounded preparations and brand names the catalogue does not hold. Add them by their generic name
                  below if you know it — otherwise this check is missing part of your list, and you should treat it
                  that way.
                </p>
              </div>
            )}
            <input
              value={cariButir}
              onChange={(e) => setCariButir(e.target.value)}
              placeholder="Add a medicine or herbal — type at least two letters"
              aria-label="Add to interaction list"
              className="mt-2 min-h-[44px] w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
            />
            {saran.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {saran.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => { setDaftar((d) => [...d, x]); setCariButir('') }}
                    className="flex min-h-[40px] w-full items-center gap-2 rounded-xl bg-neutral-100 px-2.5 text-left dark:bg-white/10"
                  >
                    <span aria-hidden>{x.jenis === 'herbal' ? '🌿' : '💊'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-bold text-ink dark:text-white">{x.nama}</span>
                      <span className="block truncate text-[10.5px] text-neutral-500">{x.keterangan}</span>
                    </span>
                    <span className="text-[11px] font-black text-brand">Add</span>
                  </button>
                ))}
              </div>
            )}

            {daftar.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {daftar.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setDaftar((d) => d.filter((y) => y.id !== x.id))}
                    className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-[11.5px] font-bold text-brand-dark"
                  >
                    {x.jenis === 'herbal' ? '🌿' : '💊'} {x.nama}
                    <span aria-hidden className="text-[13px] leading-none">×</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {daftar.length >= 2 && (
            <Card className="!p-4">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                Found {temuan.length}
              </div>
              {temuan.length === 0 ? (
                /* KOSONG TIDAK BERARTI AMAN, dan itu ditulis. Hasil kosong yang
                   dibaca sebagai "aman" adalah kegagalan paling merugikan yang
                   bisa dilakukan alat semacam ini. */
                <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                  Nothing in this app's rules matched that combination. <b>That does not mean it is safe.</b> This tool
                  only knows the mechanisms written into it, and no list of mechanisms is complete. Your pharmacist has
                  a full database and your whole medication list; this does not replace either.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {temuan.map((t, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl p-3 ${t.berat === 'serius' ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide ${
                          t.berat === 'serius' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'}`}>
                          {t.berat === 'serius' ? 'Serious' : 'Caution'}
                        </span>
                        <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                          {t.a.nama} + {t.b.nama}
                        </span>
                      </div>
                      <div className="mt-1 text-[13px] font-black text-ink dark:text-white">{t.judul}</div>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-ink dark:text-neutral-200">{t.sebab}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card className="!p-4">
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">What this is, and is not</div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              This checks the <b>mechanisms</b> written into this app — enzyme induction and inhibition, added bleeding
              risk, potassium shifts, QT prolongation, sedation, and a few others. It works by tagging drug classes
              rather than listing pairs, so one rule covers a whole class at once and can tell you <i>why</i>.
            </p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              It is <b>not a complete interaction check</b>, and it does not know your kidney function, your liver, your
              pregnancy status, or your doses. Combinations that are perfectly normal treatment are deliberately not
              flagged, because a tool that warns constantly stops being read.
            </p>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        <IconShield size={12} className="mr-1 inline" />
        Label text via the free openFDA API (US labels — wording and availability vary by country and brand); related
        products via RxNorm (NIH); classification per the WHO ATC index; essential-medicine flags per the WHO Model
        List. This is reference information, not personal medical advice. For interactions with your own medicines and
        conditions, ask your pharmacist or doctor.
      </div>
    </div>
  )
}

function Baris({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">{judul}</div>
      <p className="mt-0.5 text-[12px] leading-relaxed text-ink dark:text-neutral-200">{isi}</p>
    </div>
  )
}

function Section({ title, body, danger }: { title: string; body: string; danger?: boolean }) {
  if (!body) return null
  return (
    <Card className="!p-5">
      <div className={'text-xs font-black uppercase tracking-wide ' + (danger ? 'text-rose-600' : 'text-neutral-500')}>{title}</div>
      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">{body}</p>
    </Card>
  )
}

export default DrugInfo
