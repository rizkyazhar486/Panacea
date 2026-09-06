import { useMemo, useState } from 'react'
import Pathway3D from '../../components/Pathway3D'
import { JALUR, hitungJalur, ujiObat } from '../../lib/pathway'
import { VARIAN, labelVarian, type BidangVarian, type VarianKlinis } from '../../lib/variantBank'
import {
  bersihkanUrutan, persenGC, komplemenBalik, terjemahkan, cariORF, suhuLeleh, terapkanVarian,
} from '../../lib/genomics'
import { rancangPanduan, templateHDR } from '../../lib/crispr'
import { CARDIO_CONDITIONS } from '../../lib/cardioPathology'
import { SYSTEM_CONDITIONS } from '../../lib/specialtyPathology'
import { DRUG_TARGETS } from '../../lib/drugTargets'
import { SKDI_DISEASE_LIST } from '../../lib/skdiDiseaseList'

// ─────────────────────────────────────────────────────────────────────────────
// RUANG GENOMIKA — dari urutan DNA ke tindakan klinis.
//
// Empat bagian yang saling menyambung, bukan empat alat terpisah:
//   Varian   apa yang berubah dalam penanganan kalau varian ini ditemukan
//   Urutan   hitung sendiri: GC, translasi, kerangka baca, suhu leleh primer
//   CRISPR   rancang panduan pada urutan yang ditempelkan, dengan alasannya
//   Jalur    mutasi mana yang membuat obat mana berguna — dihitung, bukan dihafal
//
// BATASNYA DINYATAKAN DI LAYAR. Aplikasi ini tidak memanggil basa dari sinyal
// nanopore, tidak menyejajarkan ke genom rujukan, tidak menilai patogenisitas
// varian baru, dan tidak memeriksa sasaran-lain CRISPR di seluruh genom. Semua
// itu memerlukan model dan basis data yang tidak ada di dalam satu halaman web.
// ─────────────────────────────────────────────────────────────────────────────

type Bagian = 'varian' | 'urutan' | 'crispr' | 'jalur'

const BAGIAN: Array<{ key: Bagian; label: string }> = [
  { key: 'varian', label: 'Variants' },
  { key: 'urutan', label: 'Sequence' },
  { key: 'crispr', label: 'CRISPR' },
  { key: 'jalur', label: 'Pathways' },
]

const BIDANG: Array<{ key: BidangVarian | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'haematology', label: 'Blood' },
  { key: 'oncology', label: 'Cancer' },
  { key: 'pharmacogenomics', label: 'Drug response' },
  { key: 'metabolic', label: 'Metabolic' },
  { key: 'neurodevelopmental', label: 'Neurodevelopmental' },
  { key: 'respiratory', label: 'Respiratory' },
  { key: 'bone', label: 'Bone' },
]

/** Contoh urutan: awal gen beta-globin manusia, tempat mutasi sel sabit berada. */
const CONTOH_URUTAN =
  'ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGG'

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[32px] shrink-0 rounded-full border px-3 text-[11.5px] font-bold transition ${
        aktif ? 'border-brand bg-brand text-white'
              : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
      }`}
    >
      {children}
    </button>
  )
}

function Daftar({ judul, isi }: { judul: string; isi: string[] }) {
  if (!isi.length) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{judul}</div>
      <ul className="mt-1 space-y-1">
        {isi.map((x) => (
          <li key={x} className="flex gap-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
            <span className="text-neutral-400">·</span><span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function labelKondisi(id: string): string | null {
  return CARDIO_CONDITIONS.find((x) => x.id === id)?.label
    ?? SYSTEM_CONDITIONS.find((x) => x.id === id)?.label
    ?? null
}

interface Props {
  onBukaOrgan?: (organKey: string) => void
  onBukaObat?: (drugId: string) => void
}

export function GenomicsLab({ onBukaObat }: Props) {
  const [bagian, setBagian] = useState<Bagian>('varian')

  // ── Varian ────────────────────────────────────────────────────────────────
  const [bidang, setBidang] = useState<BidangVarian | 'all'>('all')
  const [varianId, setVarianId] = useState<string | null>(null)
  const daftarVarian = useMemo(
    () => VARIAN.filter((v) => bidang === 'all' || v.bidang === bidang),
    [bidang],
  )
  const varian: VarianKlinis | null = varianId ? VARIAN.find((v) => v.id === varianId) ?? null : null

  // ── Urutan ────────────────────────────────────────────────────────────────
  const [urutanMentah, setUrutanMentah] = useState(CONTOH_URUTAN)
  const urutan = useMemo(() => bersihkanUrutan(urutanMentah), [urutanMentah])
  const orf = useMemo(() => cariORF(urutan, 10).slice(0, 3), [urutan])
  const [posVarian, setPosVarian] = useState('20')
  const [basaBaru, setBasaBaru] = useState('T')
  const akibat = useMemo(() => {
    const p = Number(posVarian)
    if (!urutan || !p || p < 1 || p > urutan.length || !/^[ACGT]$/.test(basaBaru)) return null
    return terapkanVarian(urutan, p, urutan[p - 1], basaBaru)
  }, [urutan, posVarian, basaBaru])

  // ── CRISPR ────────────────────────────────────────────────────────────────
  const panduan = useMemo(() => rancangPanduan(urutan, 8), [urutan])
  const [panduanTerpilih, setPanduanTerpilih] = useState(0)
  const hdr = useMemo(() => {
    const p = panduan[panduanTerpilih]
    const pos = Number(posVarian)
    if (!p || !pos) return null
    return templateHDR(urutan, pos, basaBaru, p.posisiPotong, 30)
  }, [urutan, panduan, panduanTerpilih, posVarian, basaBaru])

  // ── Jalur ─────────────────────────────────────────────────────────────────
  const [jalurId, setJalurId] = useState(JALUR[0].id)
  const jalur = JALUR.find((j) => j.id === jalurId) ?? JALUR[0]
  const [mutasiAktif, setMutasiAktif] = useState<string[]>([])
  const [obatAktif, setObatAktif] = useState<string[]>([])
  const hasilJalur = useMemo(
    () => hitungJalur(jalur, { mutasi: mutasiAktif, obat: obatAktif }),
    [jalur, mutasiAktif, obatAktif],
  )
  const [simpulPilih, setSimpulPilih] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-ink dark:text-white">Genomics &amp; targeted therapy</h2>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">
          {VARIAN.length} clinically actionable variants, sequence tools that compute rather than look things up,
          a CRISPR guide designer, and signalling pathways where the effect of a drug on a mutation is calculated.
        </p>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {BAGIAN.map((b) => (
          <Chip key={b.key} aktif={bagian === b.key} onClick={() => setBagian(b.key)}>{b.label}</Chip>
        ))}
      </div>

      {/* ══ VARIAN ═══════════════════════════════════════════════════════════ */}
      {bagian === 'varian' && (
        <>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {BIDANG.map((b) => (
              <Chip key={b.key} aktif={bidang === b.key} onClick={() => { setBidang(b.key); setVarianId(null) }}>
                {b.label}
              </Chip>
            ))}
          </div>

          <div className="space-y-1.5">
            {daftarVarian.map((v) => (
              <button
                key={v.id}
                onClick={() => setVarianId(varianId === v.id ? null : v.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  varianId === v.id ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 dark:border-white/10'
                }`}
              >
                <span className="block text-xs font-bold text-ink dark:text-white">{labelVarian(v)}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">{v.penyakit}</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-neutral-400">{v.waris}</span>
              </button>
            ))}
          </div>

          {varian && (
            <section className="space-y-2.5 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div>
                <h3 className="text-sm font-black text-ink dark:text-white">{labelVarian(varian)}</h3>
                <p className="mt-0.5 text-[11.5px] text-neutral-500">{varian.penyakit}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[varian.hgvsC, varian.hgvsP, varian.bentukLain].filter(Boolean).map((x) => (
                    <span key={x} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                      {x}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Mechanism</div>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{varian.mekanisme}</p>
              </div>

              <div className="rounded-xl bg-brand/[0.06] p-2">
                <div className="t-mikro font-bold uppercase tracking-wide text-brand">What changes if this is found</div>
                <ul className="mt-1 space-y-1">
                  {varian.tindakan.map((t) => (
                    <li key={t} className="flex gap-1.5 text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200">
                      <span className="text-brand">→</span><span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Daftar judul="How it is detected" isi={[varian.deteksi]} />

              {varian.kondisi.length > 0 && (
                <div>
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">In the pathology atlas</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {varian.kondisi.map((k) => (
                      <span key={k} className="rounded-full border border-neutral-200 px-2 py-1 text-[10.5px] font-semibold text-neutral-600 dark:border-white/10 dark:text-neutral-300">
                        {labelKondisi(k) ?? k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {varian.obat.length > 0 && (
                <div>
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Drugs this result affects</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {varian.obat.map((o) => {
                      const d = DRUG_TARGETS.find((x) => x.id === o)
                      return (
                        <button
                          key={o}
                          onClick={() => onBukaObat?.(o)}
                          className="rounded-full border border-brand/40 bg-brand/10 px-2 py-1 text-[10.5px] font-bold text-brand"
                        >
                          {d?.katalog ?? o}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">In the clinical library</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {varian.skdi.map((n) => {
                    const e = SKDI_DISEASE_LIST.find((x) => x.disease === n)
                    return (
                      <span key={n} className="rounded-full border border-neutral-200 px-2 py-1 text-[10.5px] font-semibold text-neutral-600 dark:border-white/10 dark:text-neutral-300">
                        {n}{e && <b className="ml-1 text-brand">SKDI {e.level}</b>}
                      </span>
                    )
                  })}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ══ URUTAN ═══════════════════════════════════════════════════════════ */}
      {bagian === 'urutan' && (
        <>
          <textarea
            value={urutanMentah}
            onChange={(e) => setUrutanMentah(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full rounded-xl border border-neutral-200 bg-white p-2 font-mono text-[11px] text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <p className="text-[10.5px] text-neutral-400">
            Paste any DNA sequence or FASTA. The default is the opening of the human beta-globin coding sequence —
            position 20 is where sickle cell disease begins.
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { l: 'Length', v: `${urutan.length}`, s: 'bp' },
              { l: 'GC', v: `${persenGC(urutan)}`, s: '%' },
              { l: 'Primer Tm', v: `${suhuLeleh(urutan.slice(0, 20))}`, s: '°C' },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-neutral-50 p-2 text-center dark:bg-white/5">
                <div className="text-[13px] font-black tabular-nums text-ink dark:text-white">{x.v}</div>
                <div className="t-mikro text-neutral-500">{x.l} ({x.s})</div>
              </div>
            ))}
          </div>

          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Translation (frame 1)</div>
            <p className="mt-0.5 break-all font-mono text-[11px] text-neutral-700 dark:text-neutral-200">
              {terjemahkan(urutan) || '—'}
            </p>
          </div>
          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Reverse complement</div>
            <p className="mt-0.5 break-all font-mono text-[10px] text-neutral-500">{komplemenBalik(urutan).slice(0, 200)}</p>
          </div>

          {orf.length > 0 && (
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Open reading frames</div>
              <ul className="mt-1 space-y-1">
                {orf.map((o) => (
                  <li key={`${o.bingkai}:${o.mulai}`} className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    frame {o.bingkai > 0 ? `+${o.bingkai}` : o.bingkai} · start {o.mulai} · {o.protein.length} aa
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="space-y-2 rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Apply a variant</div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-neutral-500">c.</label>
              <input
                value={posVarian} onChange={(e) => setPosVarian(e.target.value)} inputMode="numeric"
                className="min-h-[36px] w-20 rounded-lg border border-neutral-200 px-2 text-[12px] dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <span className="text-[11px] text-neutral-500">
                {urutan[Number(posVarian) - 1] ?? '?'} &gt;
              </span>
              <input
                value={basaBaru} onChange={(e) => setBasaBaru(e.target.value.toUpperCase().slice(0, 1))} maxLength={1}
                className="min-h-[36px] w-12 rounded-lg border border-neutral-200 px-2 text-center text-[12px] uppercase dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            {akibat ? (
              <div className="space-y-1">
                <p className="text-[12px] font-bold text-ink dark:text-white">
                  {akibat.hgvsProtein} · <span className="uppercase tracking-wide text-brand">{akibat.jenis}</span>
                </p>
                <p className="break-all font-mono text-[10.5px] text-neutral-500">
                  reference {akibat.proteinRujukan.slice(0, 40)}
                </p>
                <p className="break-all font-mono text-[10.5px] text-red-500">
                  variant&nbsp;&nbsp; {akibat.proteinVarian.slice(0, 40)}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500">Enter a position within the sequence and a base A, C, G or T.</p>
            )}
          </section>
        </>
      )}

      {/* ══ CRISPR ═══════════════════════════════════════════════════════════ */}
      {bagian === 'crispr' && (
        <>
          <p className="text-[11.5px] leading-relaxed text-neutral-500">
            SpCas9 guides on the sequence in the Sequence tab. Off-target search here covers only that sequence —
            a guide still has to be checked against the whole genome before it is used for anything.
          </p>
          {panduan.length === 0 && (
            <p className="text-[12px] text-neutral-500">No NGG PAM found in this sequence.</p>
          )}
          <div className="space-y-1.5">
            {panduan.map((p, i) => (
              <button
                key={`${p.untai}${p.posisi}`}
                onClick={() => setPanduanTerpilih(i)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  panduanTerpilih === i ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-ink dark:text-white">
                    {p.spacer}<span className="text-brand">{p.pam}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-black tabular-nums text-brand">{p.skor}</span>
                </div>
                <div className="mt-0.5 text-[10px] text-neutral-500">
                  strand {p.untai} · position {p.posisi} · cut at {p.posisiPotong} · GC {p.gc}%
                  {p.sasaranLain > 0 && ` · ${p.sasaranLain} seed match(es) here`}
                </div>
                {panduanTerpilih === i && p.catatan.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {p.catatan.map((c) => (
                      <li key={c} className="text-[10.5px] leading-relaxed text-neutral-500">· {c}</li>
                    ))}
                  </ul>
                )}
              </button>
            ))}
          </div>

          {hdr && (
            <section className="space-y-1.5 rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
                HDR repair template for c.{posVarian} &gt; {basaBaru}
              </div>
              <p className="break-all font-mono text-[10px] text-neutral-600 dark:text-neutral-300">
                {hdr.kiri}<span className="rounded bg-brand/20 px-0.5 font-bold text-brand">{hdr.sisipan}</span>{hdr.kanan}
              </p>
              <p className="text-[10.5px] text-neutral-500">{hdr.panjangTotal} nt total</p>
              <ul className="space-y-0.5">
                {hdr.catatan.map((c) => (
                  <li key={c} className="text-[10.5px] leading-relaxed text-neutral-500">· {c}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* ══ JALUR ════════════════════════════════════════════════════════════ */}
      {bagian === 'jalur' && (
        <>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {JALUR.map((j) => (
              <Chip key={j.id} aktif={jalurId === j.id} onClick={() => {
                setJalurId(j.id); setMutasiAktif([]); setObatAktif([]); setSimpulPilih(null)
              }}>{j.label}</Chip>
            ))}
          </div>
          <p className="text-[11.5px] leading-relaxed text-neutral-500">{jalur.ringkas}</p>

          <Pathway3D jalur={jalur} keadaan={{ mutasi: mutasiAktif, obat: obatAktif }} onPilih={setSimpulPilih} />

          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-xl bg-neutral-50 p-2 text-center dark:bg-white/5">
              <div className="text-[15px] font-black tabular-nums text-ink dark:text-white">
                {Math.round(hasilJalur.keluaran * 100)}
              </div>
              <div className="t-mikro text-neutral-500">Output now</div>
            </div>
            <div className="rounded-xl bg-neutral-50 p-2 text-center dark:bg-white/5">
              <div className="text-[15px] font-black tabular-nums text-neutral-500">
                {Math.round(hasilJalur.keluaranDasar * 100)}
              </div>
              <div className="t-mikro text-neutral-500">Quiet pathway</div>
            </div>
          </div>

          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-red-500">Mutations</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {jalur.mutasi.map((m) => (
                <Chip
                  key={m.id}
                  aktif={mutasiAktif.includes(m.id)}
                  onClick={() => setMutasiAktif((p) => p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id])}
                >{m.label}</Chip>
              ))}
            </div>
          </div>

          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-brand">Inhibitors</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {jalur.penghambat.map((o) => (
                <Chip
                  key={o.id}
                  aktif={obatAktif.includes(o.id)}
                  onClick={() => setObatAktif((p) => p.includes(o.id) ? p.filter((x) => x !== o.id) : [...p, o.id])}
                >{o.label}</Chip>
              ))}
            </div>
          </div>

          {mutasiAktif.length > 0 && (
            <section className="space-y-1.5 rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
                Does each inhibitor help against this mutation?
              </div>
              {jalur.penghambat.map((o) => {
                const u = ujiObat(jalur, mutasiAktif, o.id)
                return (
                  <div key={o.id} className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-bold text-ink dark:text-white">{o.label}</span>
                      <span className="block text-[10.5px] leading-relaxed text-neutral-500">{o.catatan}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.menolong ? 'bg-brand/15 text-brand' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {u.menolong ? `−${Math.round(u.penurunan * 100)}` : 'no effect'}
                    </span>
                  </div>
                )
              })}
            </section>
          )}

          {simpulPilih && (
            <section className="rounded-xl border border-brand/30 bg-brand/[0.04] p-2.5">
              <div className="t-mikro font-bold uppercase tracking-wide text-brand">
                {jalur.simpul.find((s) => s.id === simpulPilih)?.label}
              </div>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {jalur.simpul.find((s) => s.id === simpulPilih)?.keterangan}
              </p>
            </section>
          )}
        </>
      )}

      <p className="text-[10px] leading-relaxed text-neutral-400">
        Educational tools, not a diagnostic or laboratory system. This page does not basecall nanopore signal, align
        to a reference genome, judge whether a novel variant is pathogenic, or check CRISPR guides against the whole
        genome — each of those needs data and models that do not live inside a web page.
      </p>
    </div>
  )
}

export default GenomicsLab
