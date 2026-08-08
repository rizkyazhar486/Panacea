import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconChartUp } from '../components/icons'
import { TOPICS, TIER_LABEL, type Topic, type Tier } from '../lib/learn'
import { Ringkas, Poin } from '../components/Ringkas'

// ─────────────────────────────────────────────────────────────────────────────
// Learn — the English education section.
//
// The layout carries an argument. Every claim shows its evidence tier next to
// the claim itself, and every claim shows what would make it wrong. Health
// pages usually put the confident sentence in large type and the uncertainty in
// a footnote, which teaches readers that the uncertainty is decoration. Here
// the caveat sits inside the same card, in the same reading flow, and cannot be
// scrolled past.
//
// Navigation is deliberately shallow: a list, then one topic. Deeper trees make
// people lose their place, and the back gesture only has one obvious meaning
// when there is only one level to go back to.
// ─────────────────────────────────────────────────────────────────────────────

export function Learn() {
  const [buka, setBuka] = useState<Topic | null>(null)

  if (buka) return <TopicView topic={buka} onClose={() => setBuka(null)} />

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle icon={<IconChartUp />} title="Learn"
        subtitle="Health evidence, with its uncertainty attached" />

      {/* Semula tiga kalimat pengantar plus tiga penjelasan tingkat bukti —
          sembilan baris sebelum topik pertama terlihat. Sekarang satu baris,
          dan penjelasannya tersedia bagi yang bertanya. */}
      <Card>
        <p className="text-[13px] font-semibold leading-snug text-ink">
          Every claim shows how strong its evidence is — and what would make it wrong.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(Object.keys(TIER_LABEL) as Tier[]).map((t) => (
            <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
              style={{ background: `${TIER_LABEL[t].color}22`, color: TIER_LABEL[t].color }}>
              {TIER_LABEL[t].label}
            </span>
          ))}
        </div>
        <div className="mt-2.5">
          <Ringkas ikon="📏" judul="What these labels mean"
            anak={
              <div className="space-y-1.5">
                {(Object.keys(TIER_LABEL) as Tier[]).map((t) => (
                  <Poin key={t} ikon="•">
                    <b style={{ color: TIER_LABEL[t].color }}>{TIER_LABEL[t].label}</b> — {TIER_LABEL[t].blurb}
                  </Poin>
                ))}
              </div>
            } />
        </div>
      </Card>

      <div className="space-y-2">
        {TOPICS.map((t) => (
          <button key={t.id} onClick={() => setBuka(t)}
            className="w-full rounded-2xl border border-black/5 bg-white/60 p-4 text-left transition-colors hover:bg-white/80">
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-2xl" aria-hidden="true">{t.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-black text-ink">{t.title}</div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{t.summary}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400">{t.minutes} min read</span>
                  {ringkasTier(t).map((r) => (
                    <span key={r.tier} className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase"
                      style={{ background: `${TIER_LABEL[r.tier].color}1f`, color: TIER_LABEL[r.tier].color }}>
                      {r.n} {r.tier}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Ringkas ikon="ℹ️" judul="Education, not medical advice"
        anak={
          <div className="space-y-1.5">
            <Poin ikon="🚫">No doses and no protocols, on purpose.</Poin>
            <Poin ikon="👤">Nothing here is tailored to you.</Poin>
            <Poin ikon="🩺">Treatment decisions belong with a clinician who can examine you.</Poin>
          </div>
        } />
    </div>
  )
}

/**
 * Kalimat pertama sebuah blok. Dipakai sebagai inti yang berdiri sendiri.
 *
 * Pemenggalannya sengaja sederhana dan konservatif: bila kalimat pertama
 * ternyata sangat panjang, seluruh blok dibiarkan tampil apa adanya. Lebih baik
 * satu kartu terlihat panjang daripada satu kalimat kesehatan terpotong di
 * tempat yang mengubah artinya.
 */
function inti(teks: string): string {
  const m = teks.match(/^[\s\S]*?[.!?](?=\s|$)/)
  const kalimat = m?.[0]?.trim()
  if (!kalimat || kalimat.length > 220) return teks
  return kalimat
}

/** Jumlah bagian per tingkat bukti, untuk lencana ringkas di daftar. */
function ringkasTier(t: Topic): { tier: Tier; n: number }[] {
  const hitung = new Map<Tier, number>()
  for (const s of t.sections) hitung.set(s.tier, (hitung.get(s.tier) ?? 0) + 1)
  return (['strong', 'moderate', 'weak'] as Tier[])
    .filter((x) => hitung.has(x))
    .map((x) => ({ tier: x, n: hitung.get(x)! }))
}

function TopicView({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      {/* Tombol kembali di dalam halaman, terpisah dari yang di header: dari
          sini "kembali" berarti kembali ke daftar, bukan ke halaman sebelumnya. */}
      <button onClick={onClose}
        className="flex items-center gap-1.5 text-[13px] font-bold text-brand hover:underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All topics
      </button>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden="true">{topic.icon}</span>
          <h2 className="text-xl font-black text-ink">{topic.title}</h2>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">{topic.summary}</p>
      </div>

      {topic.sections.map((s, i) => (
        <Card key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-black text-ink">{s.heading}</h3>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
              style={{ background: `${TIER_LABEL[s.tier].color}22`, color: TIER_LABEL[s.tier].color }}>
              {TIER_LABEL[s.tier].label}
            </span>
          </div>
          {/* Kalimat pertama berdiri sendiri sebagai inti; sisanya dibuka bila
              pembaca memang ingin alasannya. Kalimat pertama dipilih, bukan
              dipotong — teks yang terputus di tengah membuat orang mengarang. */}
          <p className="mt-2 text-[13px] font-medium leading-relaxed text-ink">{inti(s.body)}</p>
          <div className="mt-2 space-y-1.5">
            <Ringkas ikon="📖" judul="Read the full explanation"
              anak={<p className="leading-relaxed">{s.body}</p>} />
            {/* Caveat tetap sekali ketuk dari klaimnya, tidak dipindah ke
                catatan kaki — lihat catatan di kepala berkas. */}
            <Ringkas ikon="⚠️" nada="hati-hati" judul="What would change this"
              anak={<p className="leading-relaxed">{s.caveat}</p>} />
          </div>
        </Card>
      ))}

      <Card className="!border-brand/30 !bg-brand/5">
        <div className="text-[10px] font-black uppercase tracking-wide text-brand">Takeaway</div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink">{topic.takeaway}</p>
      </Card>

      <button onClick={onClose}
        className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-[13px] font-bold text-neutral-600">
        Back to all topics
      </button>
    </div>
  )
}

export default Learn
