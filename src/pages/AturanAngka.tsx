import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconShield } from '../components/icons'
import { INDIKATOR, RENCANA, type Indikator } from '../lib/indikator'

// ─────────────────────────────────────────────────────────────────────────────
// Aturan main — halaman yang menjelaskan angka-angka aplikasi ini.
//
// Permintaannya berbunyi: buat aplikasi ini seperti PERMAINAN indikator
// kesehatan, dan jelaskan mengapa serta bagaimana angka seperti recovery,
// exertion, segar, dan lelah dihitung, bagaimana mengubahnya, dan apa
// rencananya.
//
// Yang membedakan permainan dari mesin judi adalah ATURANNYA DAPAT DIBACA.
// Pemain tahu apa yang menaikkan angkanya, apa yang menurunkannya, berapa lama,
// dan apa yang tidak dihitung sama sekali. Itulah bentuk halaman ini: tiap
// angka punya kartu berisi masukan, rumus dalam kalimat, apa yang menaikkan dan
// menurunkan beserta kecepatannya, seberapa sering ia benar-benar berubah, di
// mana batasnya, dan satu tindakan yang dapat dikerjakan hari ini.
//
// "SEBERAPA SERING IA BERUBAH" DIBERI TEMPAT SENDIRI karena dari situlah
// pertanyaan yang melahirkan halaman ini datang: "seiring pertambahan waktu
// kenapa nilai fatigue tidak berubah". Jawabannya ada dua bagian, dan keduanya
// ditulis: kelelahan memang bergerak terus-menerus terhadap jam, tetapi
// pergerakannya kecil — dan ubin di beranda dahulu tidak pernah menghitung
// ulang selama layarnya terbuka. Yang kedua sudah diperbaiki.
//
// YANG SENGAJA TIDAK DIBUAT: tidak ada satu "skor kesehatan" gabungan, tidak
// ada lencana, tidak ada rangkaian yang menghukum bila terputus, dan tidak ada
// imbalan yang muncul tak terduga. Semuanya membuat orang mengejar angkanya
// alih-alih keadaannya.
// ─────────────────────────────────────────────────────────────────────────────

function Baris({ label, isi }: { label: string; isi: string[] }) {
  return (
    <div className="mt-2.5">
      <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">{label}</div>
      <ul className="mt-1 space-y-1">
        {isi.map((t, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-[1.6] text-ink dark:text-neutral-200">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-neutral-400" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function KartuIndikator({ x, buka, ketuk }: { x: Indikator; buka: boolean; ketuk: () => void }) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-white/10">
      <button
        onClick={ketuk}
        aria-expanded={buka}
        className="flex min-h-[52px] w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: x.warna }} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-black text-ink dark:text-white">{x.nama}</span>
          <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400">
            {x.satuan}
          </span>
        </span>
        <span aria-hidden className="shrink-0 text-[12px] font-black text-brand">{buka ? '▲' : '▼'}</span>
      </button>

      {!buka && (
        <p className="px-3 pb-3 text-[12.5px] leading-[1.55] text-neutral-600 dark:text-neutral-300">{x.arti}</p>
      )}

      {buka && (
        <div className="px-3 pb-3">
          <p className="text-[13px] leading-[1.65] text-ink dark:text-neutral-200">{x.arti}</p>

          <Baris label="What it reads" isi={x.masukan} />

          <div className="mt-2.5 rounded-xl bg-brand/10 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-brand-dark dark:text-brand">
              How it is worked out
            </div>
            <p className="mt-1 text-[13px] leading-[1.65] text-ink dark:text-white">{x.rumus}</p>
          </div>

          <Baris label="What raises it" isi={x.naik} />
          <Baris label="What lowers it" isi={x.turun} />

          {/* Diberi latar sendiri: dari sinilah pertanyaan "kenapa angkanya
              tidak berubah" datang, dan jawabannya harus mudah ditemukan. */}
          <div className="mt-2.5 rounded-xl bg-sky-500/10 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">
              How often it actually moves
            </div>
            <p className="mt-1 text-[13px] leading-[1.65] text-ink dark:text-white">{x.irama}</p>
          </div>

          <div className="mt-2.5 rounded-xl bg-amber-500/10 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
              What it cannot see
            </div>
            <p className="mt-1 text-[13px] leading-[1.65] text-ink dark:text-white">{x.batas}</p>
          </div>

          <div className="mt-2.5 rounded-xl bg-emerald-500/10 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Do this
            </div>
            <p className="mt-1 text-[13px] leading-[1.65] text-ink dark:text-white">{x.tindakan}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function AturanAngka() {
  const [buka, setBuka] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle
        icon={<IconShield />}
        title="How your numbers work"
        subtitle="The rules of the game: what each number reads, what moves it, how fast, and what it cannot see"
      />

      <Card>
        <p className="text-[13px] leading-[1.7] text-ink dark:text-neutral-200">
          Treating your health as a game only works if the rules are written down. A game you can play has readable
          rules; a machine you can only feed does not. So every number this app shows you is set out below with the
          data it actually reads, the arithmetic in plain words, what pushes it up and down and how quickly, and —
          just as important — what it is blind to.
        </p>
        <p className="mt-2 text-[13px] leading-[1.7] text-neutral-600 dark:text-neutral-300">
          There is deliberately no single combined &ldquo;health score&rdquo; here, no badges, and no streak that
          punishes you for breaking it. Those make people chase the number instead of the state, and on a health app
          that does real harm.
        </p>
      </Card>

      <div className="space-y-2">
        <h2 className="text-[13px] font-black uppercase tracking-wide text-brand">The six numbers</h2>
        {INDIKATOR.map((x) => (
          <KartuIndikator key={x.id} x={x} buka={buka === x.id} ketuk={() => setBuka(buka === x.id ? null : x.id)} />
        ))}
      </div>

      <Card>
        <div className="text-[13px] font-black text-ink dark:text-white">How the three training numbers fit together</div>
        <p className="mt-2 text-[13px] leading-[1.7] text-neutral-700 dark:text-neutral-200">
          Every session produces one <b>Exertion</b> score. That score is then poured into two buckets that leak at
          different speeds. The fast bucket is <b>Tired</b>; the slow bucket is <b>Fit</b>. <b>Fresh</b> is simply how
          much more is in the slow bucket than the fast one.
        </p>
        <p className="mt-2 text-[13px] leading-[1.7] text-neutral-700 dark:text-neutral-200">
          That difference in leak rate is the whole mechanism, and it is why rest works: after a week off you have
          lost most of your fatigue and very little of your fitness. It is also why a single heroic session does
          almost nothing — it fills the fast bucket, which empties, and barely touches the slow one.
        </p>
        <div className="mt-3 space-y-1.5">
          {[
            { l: 'Session', d: 'Exertion — fixed once, never moves again', c: '#f59e0b' },
            { l: 'Fast bucket', d: 'Tired — half gone in about five days', c: '#f87171' },
            { l: 'Slow bucket', d: 'Fit — half gone in about a month', c: '#60a5fa' },
            { l: 'Difference', d: 'Fresh — how ready you are today', c: '#34d399' },
          ].map((r) => (
            <div key={r.l} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.c }} aria-hidden />
              <span className="w-[86px] shrink-0 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                {r.l}
              </span>
              <span className="min-w-0 text-[12.5px] leading-snug text-ink dark:text-neutral-200">{r.d}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="text-[13px] font-black uppercase tracking-wide text-brand">What to do, in order</h2>
        <p className="text-[12.5px] leading-[1.6] text-neutral-500">
          Six steps, in priority order. If only one of them is possible today, do the first one — the ones above
          decide whether the ones below mean anything.
        </p>
        {RENCANA.map((r) => (
          <div key={r.urutan} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-black text-white">
                {r.urutan}
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-black leading-snug text-ink dark:text-white">{r.judul}</div>
                <p className="mt-1 text-[13px] leading-[1.65] text-neutral-700 dark:text-neutral-200">{r.kenapa}</p>
                <p className="mt-1.5 text-[12px] leading-snug text-emerald-700 dark:text-emerald-300">
                  <b>Done when: </b>
                  {r.ukuran}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <div className="text-[13px] font-black text-ink dark:text-white">If a number looks stuck</div>
        <ul className="mt-2 space-y-1.5">
          {[
            'Fit and Fresh move slowly by design. Day to day they will look flat, and that is correct — judge them across weeks.',
            'Recovery is computed once, on waking, and holds all day. That is not a fault.',
            'Tired does move hour by hour, but only by a fraction of a point. From a fatigue of 60, expect roughly half a point an hour of rest.',
            'A tile left open for a long time used to keep showing the value from when it was first drawn. It now recomputes while the screen is open and again whenever you come back to the app.',
            'If all three training numbers are zero while you have logged sessions, the sessions almost certainly have no heart-rate data and no effort rating — open one and check.',
          ].map((t, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-[1.65] text-neutral-700 dark:text-neutral-200">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-neutral-400" aria-hidden />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/analisis-pro"
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand text-[13px] font-bold text-white"
        >
          Open your numbers →
        </Link>
      </Card>
    </div>
  )
}

export default AturanAngka
