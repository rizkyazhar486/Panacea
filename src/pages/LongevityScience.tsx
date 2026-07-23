import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconStethoscope } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Longevity Science Explainers — plain-language accordion entries on
// mechanisms and compounds that come up constantly in longevity discourse
// (hallmarks of aging, NAD+, spermidine, urolithin A, sirtuins, metformin,
// rapamycin, methylene blue). Deliberately cautious on the off-label-drug
// entries (metformin, rapamycin, methylene blue): mechanism only, explicit
// "prescription/investigational, not a recommendation, talk to a physician"
// framing — same standard already applied to unapproved compounds elsewhere
// in this app (see Dietary Supplements' SARMs section). Pure static content.
// ─────────────────────────────────────────────────────────────────────────────

interface Entry { id: string; title: string; emoji: string; body: string; caution?: string }

const ENTRIES: Entry[] = [
  {
    id: 'hallmarks',
    title: 'The Hallmarks of Aging',
    emoji: '🧬',
    body: 'A widely-cited 2013/2023 framework groups the biological drivers of aging into a set of interconnected processes: genomic instability, telomere attrition, epigenetic alterations, loss of proteostasis, disabled macroautophagy, deregulated nutrient sensing, mitochondrial dysfunction, cellular senescence, stem cell exhaustion, altered intercellular communication, chronic inflammation, and dysbiosis. Most longevity interventions (exercise, fasting, sleep) work by influencing several of these at once — there is no single "aging switch."',
  },
  {
    id: 'nad',
    title: 'NAD+',
    emoji: '⚡',
    body: 'Nicotinamide adenine dinucleotide is a coenzyme every cell needs for energy production and DNA repair. Levels decline measurably with age. Precursors like NR and NMN (sold as supplements) raise blood NAD+ levels in some studies, but evidence that this meaningfully changes healthspan or lifespan in humans is still early — think of it as a promising research area, not an established anti-aging therapy yet.',
  },
  {
    id: 'spermidine',
    title: 'Spermidine',
    emoji: '🌾',
    body: 'A naturally occurring polyamine that promotes autophagy (cellular cleanup) in lab models, associated with extended lifespan in several organisms. Dietary sources include wheat germ, aged cheese, mushrooms, soybeans, and natto. Human longevity evidence is observational/early-stage rather than definitive.',
  },
  {
    id: 'urolithin',
    title: 'Urolithin A',
    emoji: '🍇',
    body: "A compound your gut bacteria produce from ellagitannins (found in pomegranates, raspberries, walnuts) — but only if you have the right gut bacteria, which not everyone does. It's studied for supporting mitophagy (clearing damaged mitochondria) and muscle function in aging. Some people take it directly as a supplement to bypass the gut-conversion step.",
  },
  {
    id: 'sirtuins',
    title: 'Sirtuins',
    emoji: '🧬',
    body: 'A family of proteins (SIRT1-7) involved in DNA repair, inflammation control, and metabolic regulation — often called "longevity genes" because activating them extends lifespan in yeast, worms, and mice. Caloric restriction, fasting, exercise, and resveratrol are the most commonly cited activators, though the resveratrol evidence in humans is weaker than early hype suggested.',
  },
  {
    id: 'metformin-berberine',
    title: 'Metformin vs. Berberine',
    emoji: '💊',
    body: 'Metformin is a prescription type-2-diabetes medication, also studied off-label for longevity due to effects on AMPK activation, insulin sensitivity, and inflammation (the ongoing TAME trial is testing this directly). Berberine is a plant compound sold as a supplement that activates a similar AMPK pathway with milder blood-sugar-lowering effects and more modest overall evidence.',
    caution: 'Metformin is a prescription drug with real contraindications (kidney function, contrast dye procedures, alcohol use, B12 depletion) — it requires a doctor\'s prescription and monitoring, and is not something to source or take without one. Berberine can interact with several medications despite being sold over the counter; check with a pharmacist or doctor before combining it with other medications.',
  },
  {
    id: 'rapamycin',
    title: 'Rapamycin',
    emoji: '🔬',
    body: 'An mTOR-inhibitor drug, originally developed as an organ-transplant anti-rejection medication, now studied for longevity because mTOR inhibition extends lifespan in every model organism tested so far (the most robust finding in the entire field).',
    caution: 'Rapamycin is a prescription immunosuppressant with meaningful side effects (infection risk, wound healing, lipid changes) at transplant doses. Longevity research uses much lower, intermittent doses under physician supervision — this is an active area of clinical research, not an established consumer therapy, and it requires a prescribing doctor experienced with off-label longevity dosing.',
  },
  {
    id: 'methylene-blue',
    title: 'Methylene Blue',
    emoji: '🔵',
    body: 'An old medication (over a century of use for methemoglobinemia and malaria) now discussed in longevity circles for potential mitochondrial and cognitive effects at very low doses, via antioxidant and electron-transport-chain support.',
    caution: 'Evidence for cognitive/longevity benefit in healthy people is very preliminary. It has a serious interaction risk with SSRIs, SNRIs, and other serotonergic medications (serotonin syndrome) and should never be combined with them without medical guidance. Sourcing matters — pharmaceutical-grade vs. non-pharmaceutical-grade products are not equivalent.',
  },
]

export function LongevityScience() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Longevity Science Explainers" subtitle="What the buzzwords actually mean" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Plain-language mechanism explainers for terms that show up constantly in longevity content.
          The drug-based entries (metformin, rapamycin, methylene blue) are explained for
          understanding, not as a recommendation to use them — they require a prescribing physician.
        </p>
      </Card>

      {ENTRIES.map((e) => {
        const isOpen = open === e.id
        return (
          <Card key={e.id} className="!p-0 overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : e.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <span className="text-2xl">{e.emoji}</span>
              <span className="flex-1 text-[15px] font-black text-ink dark:text-white">{e.title}</span>
              <span className="text-neutral-300">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="border-t border-neutral-100 p-4 dark:border-white/10">
                <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{e.body}</p>
                {e.caution && (
                  <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <b>Important: </b>{e.caution}
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational summaries of active research areas, not medical advice or a recommendation to use
        any prescription drug off-label. Discuss any of these with a physician before acting on them.
      </div>
    </div>
  )
}

export default LongevityScience
