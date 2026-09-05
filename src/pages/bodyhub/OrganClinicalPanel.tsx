import { useEffect, useState } from 'react'
import { clinicalForOrgan, AUDIENCES, type Audience, type OrganPenyakit, type OrganObat } from '../../lib/organClinical'
import { api, type PubmedArticle } from '../../lib/api'
import { penjelasanOrgan, type KelainanBawaan } from '../../lib/organExplain'
import type { AnatomyLayer } from '../../components/Body3D'

// ─────────────────────────────────────────────────────────────────────────────
// Isi klinis satu organ, terbuka SEKETIKA saat organnya diketuk di figur 3D.
//
// Empat tingkat pembaca menampilkan LEBIH BANYAK dari catatan yang sama, bukan
// isi yang berbeda-beda. Itu disengaja: kalau tiap tingkat punya teksnya
// sendiri, keempatnya akan bercabang dan tiga di antaranya jadi usang tanpa
// ada yang tahu. Yang berubah hanya seberapa dalam potongannya.
//
//   Public       -> definisi + edukasi. Kalimat utamanya saja.
//   Student      -> + diagnosis, tatalaksana, level kompetensi SKDI.
//   Professional -> + patofisiologi/rantai, gold standard, diagnosis banding,
//                   komplikasi, prognosis, rujukan pedoman, dan LITERATUR
//                   TERBARU dari PubMed.
//   Specialist   -> + anamnesis terstruktur, pemeriksaan fisik, penunjang,
//                   terapi suportif.
//
// "Terbaru" di sini bukan kiasan: tingkat professional & specialist memanggil
// PubMed langsung, jadi yang tampil adalah makalah yang benar-benar terindeks
// hari itu — bukan ingatan model, dan bukan daftar yang dibekukan saat kode
// ini ditulis.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  organKey: string
  organLabel: string
  /** Menyorot letak satu kelainan bawaan pada model 3D. */
  onLocate?: (keywords: string[], layer: AnatomyLayer['key']) => void
  /** Tingkat pembaca yang ditentukan berkas induk. Kalau diisi, pemilih
   *  tingkat milik panel ini disembunyikan — dua pemilih di satu halaman bisa
   *  saling bertentangan, dan pembaca tidak tahu yang mana yang berlaku. */
  audienceLuar?: Audience
}

function Blok({ judul, isi }: { judul: string; isi?: string }) {
  if (!isi) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{judul}</div>
      <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{isi}</p>
    </div>
  )
}

function Daftar({ judul, isi, nomor }: { judul: string; isi?: string[]; nomor?: boolean }) {
  if (!isi || !isi.length) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{judul}</div>
      <ul className="mt-0.5 space-y-0.5">
        {isi.map((x, i) => (
          <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
            <span className="shrink-0 text-neutral-400">{nomor ? `${i + 1}.` : '·'}</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DetailPenyakit({ d, audience }: { d: OrganPenyakit; audience: Audience }) {
  const n = d.note
  const [artikel, setArtikel] = useState<PubmedArticle[] | null>(null)
  const [memuat, setMemuat] = useState(false)
  const perluLiteratur = audience === 'professional' || audience === 'specialist'

  // Literatur diambil hanya untuk tingkat yang memang menampilkannya, dan
  // hanya sekali per penyakit yang dibuka — bukan untuk seluruh daftar.
  useEffect(() => {
    if (!perluLiteratur || artikel !== null) return
    setMemuat(true)
    api.searchPubmed(`${d.nama} review`)
      .then((r) => setArtikel(r.articles))
      .catch(() => setArtikel([]))
      .finally(() => setMemuat(false))
  }, [perluLiteratur, d.nama, artikel])

  if (!n) {
    return (
      <p className="text-xs leading-relaxed text-neutral-500">
        On the official SKDI competency list at level {d.level}, but no clinical note has been written for it yet.
        Nothing is shown rather than filling the gap with something unverified.
      </p>
    )
  }

  const rantaiAtauPato = n.rantai?.length ? undefined : n.patofisiologi

  return (
    <div className="space-y-2.5">
      <Blok judul="What it is" isi={n.definisi} />

      {audience === 'awam' && <Daftar judul="What to do" isi={n.edukasi} />}

      {audience !== 'awam' && (
        <>
          <Daftar judul="Diagnosis" isi={n.diagnosis} />
          <Blok judul="Gold standard" isi={n.goldStandard} />
          <Daftar judul="Management" isi={n.tatalaksana} />
        </>
      )}

      {(audience === 'professional' || audience === 'specialist') && (
        <>
          <Blok judul="Aetiology" isi={n.etiologi} />
          <Blok judul="Pathophysiology" isi={rantaiAtauPato} />
          {n.rantai?.length ? (
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Pathophysiology</div>
              <div className="mt-0.5 space-y-0.5">
                {n.rantai.map((r, i) =>
                  r === '' ? <div key={i} className="h-1.5" /> : (
                    <p key={i} className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{r}</p>
                  ),
                )}
              </div>
            </div>
          ) : null}
          <Daftar judul="Risk factors" isi={n.faktorRisiko} />
          <Daftar judul="Differential diagnosis" isi={n.diagnosisBanding} />
          <Blok judul="Clinical reasoning" isi={n.pengkajian} />
          <Daftar judul="Complications" isi={n.komplikasi} />
          <Blok judul="Prognosis" isi={n.prognosis} />
          <Daftar judul="Guideline sources" isi={n.referensi} />
        </>
      )}

      {audience === 'specialist' && (
        <>
          {n.anamnesis && (
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Structured history</div>
              <div className="mt-0.5 space-y-1">
                {Object.entries(n.anamnesis).map(([k, v]) =>
                  v ? (
                    <p key={k} className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                      <span className="font-bold text-ink dark:text-white">{k}: </span>{v}
                    </p>
                  ) : null,
                )}
              </div>
            </div>
          )}
          <Daftar judul="Physical examination" isi={n.pemeriksaanFisik} />
          <Daftar judul="Investigations" isi={n.penunjang} />
          <Daftar judul="Supportive care" isi={n.terapiSuportif} />
          <Daftar judul="Patient education" isi={n.edukasi} />
        </>
      )}

      {perluLiteratur && (
        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Current literature (PubMed, live)</div>
          {memuat && <p className="mt-0.5 text-xs text-neutral-500">Fetching indexed papers…</p>}
          {artikel && artikel.length === 0 && !memuat && (
            <p className="mt-0.5 text-xs text-neutral-500">No PubMed results returned for this term right now.</p>
          )}
          {artikel && artikel.length > 0 && (
            <ul className="mt-0.5 space-y-1">
              {artikel.map((a) => (
                <li key={a.pmid}>
                  <a href={a.url} target="_blank" rel="noreferrer" className="block rounded-lg bg-neutral-50 p-2 dark:bg-white/5">
                    <div className="text-xs font-semibold leading-snug text-ink dark:text-white">{a.title}</div>
                    <div className="mt-0.5 text-[10.5px] text-neutral-400">{a.journal} · {a.year} · PMID {a.pmid}</div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function KartuBawaan({ b, audience, onLocate }: {
  b: KelainanBawaan
  audience: Audience
  onLocate?: (keywords: string[], layer: AnatomyLayer['key']) => void
}) {
  const [buka, setBuka] = useState(false)
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-white/10">
      <button onClick={() => setBuka(!buka)} className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left">
        <span className="min-w-0 text-xs font-bold text-ink dark:text-white">{b.nama}</span>
        <span className={`shrink-0 text-neutral-400 transition-transform ${buka ? 'rotate-90' : ''}`}>›</span>
      </button>
      {buka && (
        <div className="space-y-2 border-t border-neutral-100 p-2.5 dark:border-white/5">
          <Blok judul="What is wrong" isi={b.apa} />
          {/* Tombol inilah jawaban "dari penyakit langsung tahu letaknya":
              satu ketukan memindahkan kelainannya ke figur 3D, bukan
              menyuruh orang mencarinya sendiri. */}
          {onLocate && (
            <button
              onClick={() => onLocate(b.lokasi3d, b.layer)}
              className="rounded-full border border-brand px-2.5 py-1 text-[11px] font-bold text-brand"
            >
              Show me where →
            </button>
          )}
          {audience !== 'awam' && <Blok judul="How it forms (embryology)" isi={b.embriologi} />}
          <Blok judul="What it does" isi={b.akibat} />
          <Blok judul="How it shows up" isi={b.tanda} />
        </div>
      )}
    </div>
  )
}

function KartuObat({ o, audience }: { o: OrganObat; audience: Audience }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-white/5">
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="text-sm font-bold text-ink dark:text-white">{o.nama}</span>
        {o.eml && <span className="rounded-full bg-brand/10 px-1.5 text-[10px] font-bold text-brand">WHO essential</span>}
      </div>
      <p className="mt-0.5 text-[11px] text-neutral-500">{o.kelas} · {o.untuk}</p>
      {audience !== 'awam' && o.catatan && (
        <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">{o.catatan}</p>
      )}
      {/* Dosis hanya muncul kalau korpus SKDI memang memuatnya. Tidak ada
          dosis yang dikarang di sini — itu aturan yang tidak dilonggarkan. */}
      {audience !== 'awam' && o.dosis.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {o.dosis.map((d, i) => (
            <p key={i} className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              <span className="font-bold">{d.keluhan}: </span>{d.dosis}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function OrganClinicalPanel({ organKey, organLabel, onLocate, audienceLuar }: Props) {
  const [audienceLokal, setAudience] = useState<Audience>('student')
  const audience = audienceLuar ?? audienceLokal
  const [bukaPenyakit, setBukaPenyakit] = useState<string | null>(null)
  const { penyakit, obat, belumDipetakan } = clinicalForOrgan(organKey)
  const penjelasan = penjelasanOrgan(organKey)

  // Organ berganti -> penyakit yang sedang terbuka ikut ditutup, kalau tidak
  // panelnya akan menampilkan penyakit organ sebelumnya di bawah judul baru.
  useEffect(() => { setBukaPenyakit(null) }, [organKey])

  // Organ tanpa pemetaan penyakit TETAP menampilkan penjelasannya kalau ada.
  // Dulu keadaan ini mengembalikan satu kalimat kosong, dan itulah yang
  // membuat mata dan tiroid terasa tidak punya isi apa pun.
  if (belumDipetakan && !penjelasan) {
    return (
      <p className="text-xs leading-relaxed text-neutral-500">
        Nothing has been written for {organLabel} yet. It is left empty rather than showing another organ’s content.
      </p>
    )
  }

  const denganCatatan = penyakit.filter((p) => p.note).length

  return (
    <div className="space-y-3">
      {!audienceLuar && (
      <div>
        <div className="-mx-1 flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
          {AUDIENCES.map((a) => (
            <button
              key={a.key}
              onClick={() => setAudience(a.key)}
              className={`min-h-[32px] shrink-0 rounded-lg px-3 text-xs font-bold transition ${
                audience === a.key
                  ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white'
                  : 'text-neutral-500'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10.5px] text-neutral-400">{AUDIENCES.find((a) => a.key === audience)?.hint}</p>
      </div>
      )}

      {/* Penjelasan organnya lebih dulu. Membuka tiroid atau mata dulu tidak
          menampilkan apa pun kalau organ itu kebetulan tidak punya banyak
          entri penyakit — padahal yang paling dasar justru ini. */}
      {penjelasan && !audienceLuar && (
        <div className="space-y-2 rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
          <Blok judul={`What the ${organLabel.toLowerCase()} is`} isi={penjelasan.definisi} />
          <Daftar judul="What it does" isi={penjelasan.fungsi} />
          {audience !== 'awam' && <Blok judul="How it works" isi={penjelasan.caraKerja} />}
          {penjelasan.fakta && <Daftar judul="Key numbers" isi={penjelasan.fakta} />}
        </div>
      )}

      {penjelasan && penjelasan.bawaan.length > 0 && (
        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
            Congenital conditions · {penjelasan.bawaan.length}
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Present from birth — what determines these is how the structure formed, so each one starts from its
            embryology. Tap “Show me where” to light it up on the model.
          </p>
          <div className="mt-1 space-y-1">
            {penjelasan.bawaan.map((b) => (
              <KartuBawaan key={b.nama} b={b} audience={audience} onLocate={onLocate} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
          Acquired conditions of the {organLabel.toLowerCase()} · {penyakit.length}
          {denganCatatan < penyakit.length && ` (${denganCatatan} with full notes)`}
        </div>
        <div className="mt-1 space-y-1">
          {penyakit.map((d) => {
            const terbuka = bukaPenyakit === d.nama
            return (
              <div key={d.nama} className="rounded-lg border border-neutral-200 dark:border-white/10">
                <button
                  onClick={() => setBukaPenyakit(terbuka ? null : d.nama)}
                  className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left"
                >
                  <span className="min-w-0 text-xs font-bold text-ink dark:text-white">{d.nama}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className={`rounded px-1.5 text-[10px] font-bold ${
                      d.level.startsWith('4') ? 'bg-brand/15 text-brand' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10'
                    }`}>{d.level}</span>
                    <span className={`text-neutral-400 transition-transform ${terbuka ? 'rotate-90' : ''}`}>›</span>
                  </span>
                </button>
                {terbuka && (
                  <div className="border-t border-neutral-100 p-2.5 dark:border-white/5">
                    <DetailPenyakit d={d} audience={audience} />
                  </div>
                )}
              </div>
            )
          })}
          {penyakit.length === 0 && <p className="text-xs text-neutral-500">No conditions mapped to this structure.</p>}
        </div>
      </div>

      {obat.length > 0 && !audienceLuar && (
        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
            Drugs used for conditions of the {organLabel.toLowerCase()} · {obat.length}
          </div>
          <div className="mt-1 space-y-1">
            {obat.map((o) => <KartuObat key={o.nama} o={o} audience={audience} />)}
          </div>
        </div>
      )}

      <p className="text-[10.5px] leading-relaxed text-neutral-400">
        Drugs are listed by what they treat, not by where they act — for the site of action on the model, use the
        Drugs tab. Disease names and competency levels: SKDI 2012 (Konsil Kedokteran Indonesia). Clinical notes and drug
        catalogue: this app’s own curated corpus, with its guideline sources listed per entry. Current literature is
        fetched live from PubMed. Reference material for study — not a diagnosis and not a prescription.
      </p>
    </div>
  )
}

export default OrganClinicalPanel
