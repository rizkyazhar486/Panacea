import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconChartUp } from '../components/icons'
import { TOPICS, TIER_LABEL, type Topic, type Tier } from '../lib/learn'

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

      <Card>
        <p className="text-[13px] leading-relaxed text-neutral-600">
          Every claim on these pages is labelled with how good the evidence behind it is, and every
          claim says what would make it wrong. That second part is the point: knowing why something
          might be mistaken is what lets you decide for yourself.
        </p>
        <div className="mt-3 space-y-2">
          {(Object.keys(TIER_LABEL) as Tier[]).map((t) => (
            <div key={t} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                style={{ background: `${TIER_LABEL[t].color}22`, color: TIER_LABEL[t].color }}>
                {TIER_LABEL[t].label}
              </span>
              <span className="text-[11px] leading-relaxed text-neutral-500">{TIER_LABEL[t].blurb}</span>
            </div>
          ))}
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

      <Card>
        <p className="text-[11px] leading-relaxed text-neutral-400">
          This is education, not medical advice, and it deliberately contains no doses or protocols.
          Nothing here is tailored to you — decisions about your own treatment belong with a
          clinician who can examine you and knows your history.
        </p>
      </Card>
    </div>
  )
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
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{s.body}</p>
          {/* Caveat berada di dalam kartu yang sama, bukan di catatan kaki —
              lihat catatan di kepala berkas. */}
          <div className="mt-3 rounded-xl border-l-2 border-amber-500/50 bg-amber-500/5 p-3">
            <div className="text-[10px] font-black uppercase tracking-wide text-amber-700">
              What would change this
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{s.caveat}</p>
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
