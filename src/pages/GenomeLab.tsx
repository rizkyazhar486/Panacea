import { useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { Prosa } from '../components/Prosa'
import { IconActivity } from '../components/icons'
import {
  TETAPAN, TELOMERASE, GARPU_PER_ORIGIN,
  mulaiReplikasi, langkahReplikasi, lamaFaseSDetik, anggaranGalat,
  mulaiTelomer, langkahPembelahan, sisaPembelahan, batasHayflick,
  type JenisSel, type KeadaanReplikasi,
} from '../lib/replikasiDna'
import { bersihkanUrutan, komplemenBalik, persenGC, terjemahkan } from '../lib/genomics'
import { rancangPanduan } from '../lib/crispr'
import {
  hill, konsentrasiUntukEfek, bebanSetimbang, bebanAnalitik,
  SENYAWA_GERO, cakupanKuantitatif, type SenyawaGero,
} from '../lib/farmakodinamik'

// Halaman ini menjelaskan MEKANISME, bukan keadaan seseorang. Tidak ada satu
// pun angka di sini yang berasal dari pengguna, dan tidak satu pun boleh
// dibaca sebagai "usia biologis" atau ramalan umur. Lihat pita batas di bawah.

const JENIS: Array<{ id: JenisSel; label: string; catatan: string }> = [
  { id: 'somatik', label: 'Somatic', catatan: 'No telomerase. Divides until the reserve runs out.' },
  { id: 'punca', label: 'Stem', catatan: 'Partial telomerase. Ages more slowly — not never.' },
  { id: 'germinal', label: 'Germline', catatan: 'Length maintained across generations.' },
  { id: 'kanker', label: 'Cancer', catatan: 'Telomerase reactivated; the limit is bypassed.' },
]

function Angka({ nilai, satuan, label }: { nilai: string; satuan?: string; label: string }) {
  return (
    <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2.5">
      <div className="font-[var(--font-angka)] text-[19px] font-black leading-none tracking-tight text-ink dark:text-white">
        {nilai}{satuan && <span className="ml-1 text-[11px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
    </div>
  )
}

/** Garpu replikasi: untai maju kontinu, untai lambat terputus-putus. */
function GarpuSvg({ k }: { k: KeadaanReplikasi }) {
  const L = 320, H = 132
  const maju = Math.min(1, k.garpu.majuBp / 1200)
  const fragmenLebar = (k.panjangOkazaki / 1200) * L
  const jumlahFragmen = Math.min(14, k.garpu.fragmen)
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img"
      aria-label={`Replication fork: leading strand continuous, ${k.garpu.fragmen} Okazaki fragments completed on the lagging strand`}>
      {/* Untai induk yang terbuka */}
      <path d={`M8 ${H / 2} L${L * 0.34} ${H / 2} L${L - 8} 16`} fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2.5" />
      <path d={`M8 ${H / 2} L${L * 0.34} ${H / 2} L${L - 8} ${H - 16}`} fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2.5" />
      {/* Untai maju — satu garis tanpa putus */}
      <path d={`M8 ${H / 2 - 7} L${8 + (L * 0.34 - 8 + (L - 8 - L * 0.34) * maju)} ${H / 2 - 7}`}
        fill="none" stroke="#00BF63" strokeWidth="4.5" strokeLinecap="round" />
      <text x="10" y={H / 2 - 14} className="fill-current text-[9px] font-bold" opacity="0.75">LEADING · continuous</text>
      {/* Untai lambat — potongan-potongan Okazaki */}
      {Array.from({ length: jumlahFragmen }).map((_, i) => (
        <rect key={i} x={10 + i * (fragmenLebar + 3)} y={H / 2 + 4} width={Math.max(3, fragmenLebar)} height="5"
          rx="2.5" fill="#FF5A1F" opacity={0.55 + 0.45 * (i / Math.max(1, jumlahFragmen))} />
      ))}
      <text x="10" y={H / 2 + 24} className="fill-current text-[9px] font-bold" opacity="0.75">
        LAGGING · {k.garpu.fragmen} Okazaki fragments
      </text>
    </svg>
  )
}

/** Lintasan telomer sepanjang pembelahan untuk setiap jenis sel. */
function LintasanTelomer({ jenis }: { jenis: JenisSel }) {
  const titik = useMemo(() => {
    let s = mulaiTelomer(jenis)
    const out: number[] = [s.panjangBp]
    for (let i = 0; i < 120; i++) { s = langkahPembelahan(s); out.push(s.panjangBp) }
    return out
  }, [jenis])
  const L = 320, H = 120, maks = TETAPAN.telomerLahir.nilai
  const ambangY = H - 10 - (TETAPAN.ambangSenesens.nilai / maks) * (H - 22)
  const d = titik.map((bp, i) => {
    const x = 8 + (i / (titik.length - 1)) * (L - 16)
    const y = H - 10 - (bp / maks) * (H - 22)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img"
      aria-label={`Telomere length over 120 divisions for a ${jenis} cell, against the senescence threshold`}>
      <line x1="8" y1={ambangY} x2={L - 8} y2={ambangY} stroke="#FF3131" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
      <text x={L - 10} y={ambangY - 5} textAnchor="end" className="fill-current text-[8.5px] font-bold" opacity="0.75">
        senescence threshold
      </text>
      <path d={d} fill="none" stroke="#00BF63" strokeWidth="2.5" strokeLinecap="round" />
      <text x="9" y={H - 1} className="fill-current text-[8.5px]" opacity="0.6">0</text>
      <text x={L - 9} y={H - 1} textAnchor="end" className="fill-current text-[8.5px]" opacity="0.6">120 divisions</text>
    </svg>
  )
}


/** Kurva dosis-respons Hill, dengan EC50 ditandai di tempat yang benar. */
function KurvaHill({ ec50, n }: { ec50: number; n: number }) {
  const L = 320, H = 140
  // Sumbu konsentrasi logaritmik: kurva Hill hanya berbentuk sigmoid di skala
  // log, dan menggambarnya linear menyembunyikan seluruh bagian yang menarik.
  const dekade = 4
  const cMin = ec50 / Math.pow(10, dekade / 2)
  const titik: string[] = []
  for (let i = 0; i <= 120; i++) {
    const c = cMin * Math.pow(10, (i / 120) * dekade)
    const e = hill(c, ec50, n, 1)
    const x = 26 + (i / 120) * (L - 38)
    const y = H - 22 - e * (H - 40)
    titik.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  const xEc50 = 26 + 0.5 * (L - 38)
  const c20 = konsentrasiUntukEfek(0.2, ec50, n)
  const c80 = konsentrasiUntukEfek(0.8, ec50, n)
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img"
      aria-label={`Hill dose-response curve, EC50 ${ec50} micromolar, Hill coefficient ${n}`}>
      <line x1="26" y1={H - 22} x2={L - 12} y2={H - 22} stroke="currentColor" strokeOpacity="0.25" />
      <line x1="26" y1="18" x2="26" y2={H - 22} stroke="currentColor" strokeOpacity="0.25" />
      <line x1={xEc50} y1="18" x2={xEc50} y2={H - 22} stroke="#FF5A1F" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.85" />
      <text x={xEc50 + 4} y="27" className="fill-current text-[8.5px] font-bold" opacity="0.8">EC50</text>
      <line x1="26" y1={H - 22 - 0.5 * (H - 40)} x2={xEc50} y2={H - 22 - 0.5 * (H - 40)}
        stroke="#FF5A1F" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.85" />
      <path d={titik.join(' ')} fill="none" stroke="#00BF63" strokeWidth="2.6" strokeLinecap="round" />
      <text x="2" y="22" className="fill-current text-[8.5px]" opacity="0.6">100%</text>
      <text x="8" y={H - 24} className="fill-current text-[8.5px]" opacity="0.6">0</text>
      <text x={L - 12} y={H - 8} textAnchor="end" className="fill-current text-[8.5px]" opacity="0.6">
        log concentration
      </text>
      <text x="26" y={H - 8} className="fill-current text-[8.5px]" opacity="0.6">
        20-80% spans {(c80 / c20).toFixed(1)}x
      </text>
    </svg>
  )
}

/** Beban sel senesen terhadap waktu, dengan dan tanpa pembersihan senolitik. */
function KurvaBeban({ pembersihan }: { pembersihan: number }) {
  const p = { produksi: 0.002, pembersihanAlami: 0.01 }
  const L = 320, H = 128, T = 400
  const maks = bebanSetimbang(p)
  const jalur = (k: number) => {
    const d: string[] = []
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * T
      const s = bebanAnalitik(p, maks, t, k)
      const x = 26 + (i / 100) * (L - 38)
      const y = H - 20 - (s / maks) * (H - 38)
      d.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    return d.join(' ')
  }
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img"
      aria-label={`Senescent cell burden over time with senolytic clearance rate ${pembersihan}`}>
      <line x1="26" y1={H - 20} x2={L - 12} y2={H - 20} stroke="currentColor" strokeOpacity="0.25" />
      <path d={jalur(0)} fill="none" stroke="currentColor" strokeOpacity="0.32" strokeWidth="2" strokeDasharray="5 3" />
      <path d={jalur(pembersihan)} fill="none" stroke="#00BF63" strokeWidth="2.6" strokeLinecap="round" />
      <text x="2" y="18" className="fill-current text-[8.5px]" opacity="0.6">burden</text>
      <text x={L - 12} y={H - 6} textAnchor="end" className="fill-current text-[8.5px]" opacity="0.6">time</text>
      <text x="30" y="18" className="fill-current text-[8.5px]" opacity="0.55">dashed = no senolytic</text>
    </svg>
  )
}

export function GenomeLab() {
  const [detik, setDetik] = useState(0)
  const [jenis, setJenis] = useState<JenisSel>('somatik')
  const [urutan, setUrutan] = useState('ATGGCCTTGACCGGAAGCTGGACCATCGAGCGGTTTAAGCCCTGAGGATCCAAGCTT')
  const [senyawa, setSenyawa] = useState<SenyawaGero>(SENYAWA_GERO[0])
  const [pembersihan, setPembersihan] = useState(0.02)

  const replikasi = useMemo(() => {
    let k = mulaiReplikasi({ origin: 1, lajuGarpu: TETAPAN.lajuGarpu.nilai, bpTarget: 1200 })
    if (detik > 0) k = langkahReplikasi(k, detik)
    return k
  }, [detik])

  const galat = useMemo(() => anggaranGalat(), [])
  const telomer = useMemo(() => mulaiTelomer(jenis), [jenis])
  const sisa = sisaPembelahan(telomer)

  const bersih = useMemo(() => bersihkanUrutan(urutan), [urutan])
  const rna = useMemo(() => bersih.replace(/T/g, 'U'), [bersih])
  const protein = useMemo(() => terjemahkan(bersih), [bersih])
  const panduan = useMemo(() => rancangPanduan(bersih, 4), [bersih])

  return (
    <div className="space-y-4">
      <SectionTitle icon={<IconActivity />} title="Genome Lab"
        subtitle="How replication, telomere attrition and editing actually work — mechanism, not measurement" />

      {/* Batas ilmiah diletakkan di ATAS, bukan di kaki halaman: pembaca harus
          tahu apa yang sedang dilihatnya sebelum melihat angkanya. */}
      <Card>
        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
          What this is, and what it is not
        </p>
        <Prosa kelas="mt-2 text-[12.5px] leading-relaxed text-neutral-700 dark:text-neutral-300">
          Every number here is textbook reference biology for typical human cells, shown with the range
          around it. Nothing on this page is measured from you. It cannot estimate anyone&apos;s biological
          age, it does not predict lifespan, and it is not a laboratory protocol — it explains mechanisms,
          it does not give steps for editing a human genome. Simulated values are simulated, and are
          labelled as such. Generated with AI assistance and not reviewed by a qualified human expert.
        </Prosa>
      </Card>

      {/* 1. Replikasi */}
      <Card>
        <SectionTitle icon={<IconActivity />} title="1 · DNA replication"
          subtitle="One fork, two strands, two different ways of being built" />
        <GarpuSvg k={replikasi} />
        <input type="range" min={0} max={24} step={0.5} value={detik}
          onChange={(e) => setDetik(Number(e.target.value))}
          aria-label="Seconds since the fork started"
          className="mt-2 w-full accent-[#00BF63]" />
        <p className="mt-1 text-[11px] text-neutral-500">{detik.toFixed(1)} s since this fork started</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Angka nilai={Math.round(replikasi.garpu.majuBp).toLocaleString()} satuan="nt" label="Leading strand" />
          <Angka nilai={String(replikasi.garpu.fragmen)} label="Okazaki fragments" />
          <Angka nilai={String(TETAPAN.lajuGarpu.nilai)} satuan="nt/s" label="Fork rate" />
          <Angka nilai={(lamaFaseSDetik() / 3600).toFixed(1)} satuan="h" label="Whole S phase" />
        </div>
        <Prosa kelas="mt-3 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Both strands travel with the same fork at the same speed. Only one of them can be built
          continuously, because synthesis runs 5&apos;→3&apos; and the two parent strands are antiparallel.
          The other is built backwards in pieces of about {TETAPAN.panjangOkazaki.nilai} nt
          ({TETAPAN.panjangOkazaki.min}–{TETAPAN.panjangOkazaki.maks}) — roughly one nucleosome each.
          The whole genome finishes in about {(lamaFaseSDetik() / 3600).toFixed(1)} hours because
          around {TETAPAN.originSerempak.nilai.toLocaleString()} origins work at once, each giving
          {' '}{GARPU_PER_ORIGIN} forks — not because any single fork is fast.
        </Prosa>
      </Card>

      {/* 2. Anggaran galat */}
      <Card>
        <SectionTitle icon={<IconActivity />} title="2 · Why copying 3.1 billion bases is survivable"
          subtitle="Not one perfect mechanism — three imperfect ones in series" />
        <div className="grid grid-cols-3 gap-2">
          <Angka nilai={Math.round(galat.tanpaKoreksi).toLocaleString()} label="Raw misinsertions" />
          <Angka nilai={Math.round(galat.setelahProofreading).toLocaleString()} label="After proofreading" />
          <Angka nilai={galat.setelahMMR.toFixed(1)} label="After mismatch repair" />
        </div>
        <Prosa kelas="mt-3 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Each stage removes roughly two orders of magnitude, which is what turns tens of thousands of
          mistakes into a handful per genome copied. Those few that remain are the raw material of both
          variation and disease — the system is not built to reach zero.
        </Prosa>
      </Card>

      {/* 3. Telomer */}
      <Card>
        <SectionTitle icon={<IconActivity />} title="3 · Telomere attrition and the division limit"
          subtitle="The end-replication problem, followed to its consequence" />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {JENIS.map((j) => (
            <button key={j.id} type="button" onClick={() => setJenis(j.id)}
              aria-pressed={jenis === j.id}
              className={`min-h-[34px] rounded-full border px-3 text-xs font-bold transition ${
                jenis === j.id
                  ? 'border-brand/50 bg-brand/15 text-brand-dark dark:text-brand'
                  : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
              }`}>
              {j.label}
            </button>
          ))}
        </div>
        <LintasanTelomer jenis={jenis} />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Angka nilai={TETAPAN.telomerLahir.nilai.toLocaleString()} satuan="bp" label="At birth" />
          <Angka nilai={`${Math.round(TELOMERASE[jenis] * 100)}`} satuan="%" label="Telomerase offset" />
          <Angka nilai={sisa === null ? '∞' : String(sisa)} label="Divisions remaining" />
          <Angka nilai={String(batasHayflick())} label="Hayflick limit" />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">{
          JENIS.find((j) => j.id === jenis)?.catatan
        }</p>
        <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          The last RNA primer on the lagging strand cannot be replaced with DNA, so every round of
          replication shortens the chromosome end. That is the whole mechanism. The Hayflick limit shown
          here is not typed in — it falls out of the starting length, the loss per division and the
          threshold at which the damage response becomes permanent. Cancer cells are on this chart
          because they solve the problem the same way germ cells do, which is exactly why the limit
          matters.
        </Prosa>
      </Card>

      {/* 4. DNA -> RNA -> protein, dan tempat CRISPR memotong */}
      <Card>
        <SectionTitle icon={<IconActivity />} title="4 · DNA → RNA → protein, and where an edit would land"
          subtitle="Transcription, translation, and Cas9 guide placement on the same sequence" />
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500" htmlFor="urutan">
          Sequence (A, C, G, T)
        </label>
        <textarea id="urutan" value={urutan} onChange={(e) => setUrutan(e.target.value)} rows={3}
          spellCheck={false}
          className="mt-1 w-full rounded-2xl border border-neutral-200 bg-transparent p-3 font-[var(--font-angka)] text-[12px] tracking-wider text-ink dark:border-white/10 dark:text-white" />
        <div className="mt-3 space-y-2">
          <div className="overflow-x-auto rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">DNA 5&apos;→3&apos;</p>
            <p className="whitespace-nowrap font-[var(--font-angka)] text-[12px] tracking-[0.18em] text-ink dark:text-white">{bersih || '—'}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Template (reverse complement)</p>
            <p className="whitespace-nowrap font-[var(--font-angka)] text-[12px] tracking-[0.18em] text-neutral-500">{komplemenBalik(bersih) || '—'}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF5A1F]">mRNA</p>
            <p className="whitespace-nowrap font-[var(--font-angka)] text-[12px] tracking-[0.18em] text-[#FF5A1F]">{rna || '—'}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Protein</p>
            <p className="whitespace-nowrap font-[var(--font-angka)] text-[12px] tracking-[0.3em] text-ink dark:text-white">{protein || '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Angka nilai={String(bersih.length)} satuan="bp" label="Length" />
            <Angka nilai={persenGC(bersih).toFixed(0)} satuan="%" label="GC content" />
          </div>
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          Cas9 guide candidates on this sequence
        </p>
        {panduan.length === 0 ? (
          <p className="mt-1 text-[12px] text-neutral-500">No NGG PAM with a valid 20 nt protospacer in this sequence.</p>
        ) : (
          <div className="mt-1 space-y-1.5">
            {panduan.map((p) => (
              <div key={`${p.untai}${p.posisi}`} className="rounded-xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-[var(--font-angka)] text-[11px] tracking-[0.12em] text-ink dark:text-white">{p.spacer}</span>
                  <span className="rounded-full bg-[#FF5A1F]/15 px-2 py-0.5 font-[var(--font-angka)] text-[10px] font-black text-[#FF5A1F]">{p.pam}</span>
                  <span className="text-[10px] font-bold text-neutral-500">strand {p.untai} · cut @ {p.posisiPotong} · GC {p.gc.toFixed(0)}%</span>
                </div>
                {p.catatan.length > 0 && (
                  <p className="mt-1 text-[10.5px] leading-relaxed text-amber-700 dark:text-amber-300">{p.catatan.join(' · ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <Prosa kelas="mt-3 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Specificity here is checked only against the sequence you typed, so a clean score means
          &quot;no second match in this box&quot; — not &quot;safe in a genome&quot;. Real off-target
          assessment is a genome-wide problem. This panel exists to show where a cut would fall relative
          to the codons above, and nothing further.
        </Prosa>
      </Card>

      {/* 5. Senyawa geroscience */}
      <Card>
        <SectionTitle icon={<IconActivity />} title="5 · Geroscience compounds"
          subtitle="Dose–response where a defensible number exists, and a blank where it does not" />

        <div className="mb-3 flex flex-wrap gap-1.5">
          {SENYAWA_GERO.map((s) => (
            <button key={s.id} type="button" onClick={() => setSenyawa(s)}
              aria-pressed={senyawa.id === s.id}
              className={`min-h-[34px] rounded-full border px-3 text-xs font-bold transition ${
                senyawa.id === s.id
                  ? 'border-brand/50 bg-brand/15 text-brand-dark dark:text-brand'
                  : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
              }`}>
              {s.nama}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Target</p>
          <p className="text-[13px] font-bold text-ink dark:text-white">{senyawa.target}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">{senyawa.catatan}</p>
          <p className="mt-2 inline-block rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
            highest evidence: {senyawa.bukti.replace(/-/g, ' ')}
          </p>
          {senyawa.rujukan.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {senyawa.rujukan.map((r) => (
                <div key={r.pmid ?? r.nct} className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
                  <a href={r.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/` : `https://clinicaltrials.gov/study/${r.nct}`}
                    target="_blank" rel="noreferrer"
                    className="text-[11.5px] font-bold text-brand-dark underline underline-offset-2 dark:text-brand">
                    {r.pmid ? `PMID ${r.pmid}` : r.nct} · {r.judul}
                  </a>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{r.temuan}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[11px] font-semibold text-neutral-500">
              No source checked for this entry yet — treat the note above as unverified.
            </p>
          )}
        </div>

        {senyawa.ec50Mikromolar !== null && senyawa.koefisienHill !== null ? (
          <div className="mt-3">
            <KurvaHill ec50={senyawa.ec50Mikromolar} n={senyawa.koefisienHill} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Angka nilai={String(senyawa.ec50Mikromolar)} satuan="µM" label="EC50 in vitro" />
              <Angka nilai={senyawa.koefisienHill.toFixed(1)} label="Hill coefficient" />
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-neutral-300 p-3 text-[12px] leading-relaxed text-neutral-600 dark:border-white/15 dark:text-neutral-400">
            No single defensible EC50 is reported for this compound across systems, so no curve is drawn.
            Inventing one would make this page look more certain than the field is.
          </p>
        )}

        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          Senescent-cell burden under clearance
        </p>
        <KurvaBeban pembersihan={pembersihan} />
        <input type="range" min={0} max={0.06} step={0.002} value={pembersihan}
          onChange={(e) => setPembersihan(Number(e.target.value))}
          aria-label="Senolytic clearance rate"
          className="mt-1 w-full accent-[#00BF63]" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Angka nilai={pembersihan.toFixed(3)} label="Clearance rate" />
          <Angka nilai={(bebanSetimbang({ produksi: 0.002, pembersihanAlami: 0.01 }, pembersihan) * 100).toFixed(1)}
            satuan="%" label="New steady state" />
        </div>
        <Prosa kelas="mt-3 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Burden settles where production equals clearance, so a senolytic lowers the plateau rather than
          emptying the tissue — and stopping it returns the plateau to where it was. The curve is the
          analytic solution of the linear model, not a fit to anyone&apos;s data.
          {' '}Quantitative parameters exist for {cakupanKuantitatif().berparameter} of
          {' '}{cakupanKuantitatif().total} compounds listed; that ratio is the honest state of the field,
          not a gap in this page.
        </Prosa>
      </Card>
    </div>
  )
}

export default GenomeLab
