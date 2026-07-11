import { useNavigate } from 'react-router-dom'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import { IconWallet, IconStethoscope, IconHeart } from '../components/icons'
import { MANUAL_BANK } from '../lib/payment'

// In-app pricing page (mirrors the public landing page's "Layanan & Harga"
// section, but for already-logged-in users browsing under Layanan). Each
// tier links to the concrete feature that actually carries its price today
// — there's no separate "subscribe to Plus/Pro" billing flow yet, so this
// routes people to Nutrition (Longevity sub), Billing (chronic sub), and
// Clinical Calculators (its own paywall) rather than promising a purchase
// button this page can't fulfill.
type Tier = {
  name: string
  tagline: string
  price: string
  note?: string
  features: string[]
  cta: string
  to: string
  highlight?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    tagline: 'For everyone, forever',
    price: 'Rp0',
    features: [
      'AI Chatbot — history-taking & health education',
      'Community, Facility GPS & Emergency SOS',
      'Clinical Calculators — free for the first 50 sign-ups',
    ],
    cta: 'Get Started on Home',
    to: '/',
  },
  {
    name: 'Plus',
    tagline: 'Personal longevity insight, powered by AI',
    price: 'Rp49,000',
    note: '/month',
    highlight: true,
    features: [
      'Everything in the Free plan',
      'AI Longevity Calculator — diet, exercise, sleep & sun exposure',
      '2× In-depth AI Consultations per month (worth Rp98,000)',
      'Full access to Clinical Calculators (beyond the free quota)',
    ],
    cta: 'Subscribe in Nutrition',
    to: '/nutrition',
  },
  {
    name: 'Pro',
    tagline: 'For chronic conditions & ongoing monitoring',
    price: 'Rp199,000',
    note: '/month',
    features: [
      'Everything in the Plus plan',
      'Chronic Monitoring — biomarker trends & ongoing recommendations',
      'Unlimited In-depth AI Consultations',
      'Priority support',
    ],
    cta: 'Subscribe in Billing',
    to: '/billing',
  },
]

export function Pricing() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <SectionTitle icon={<IconWallet size={20} />} title="Services & Pricing" subtitle="Three simple plans — choose what fits your needs, upgrade or downgrade anytime" />

      <div className="grid gap-4">
        {TIERS.map((t) => (
          <Card key={t.name} className={t.highlight ? '!border-brand ring-1 ring-brand/30' : ''}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-ink">{t.name}</h3>
                  {t.highlight && <Badge tone="brand">Most popular</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-neutral-500">{t.tagline}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xl font-black text-ink">{t.price}</div>
                {t.note && <div className="text-[11px] text-neutral-400">{t.note}</div>}
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-neutral-600">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-50 text-[10px] text-brand-dark">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" variant={t.highlight ? 'primary' : 'outline'} onClick={() => navigate(t.to)}>
              {t.cta}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="!border-brand/20">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
          <IconStethoscope size={14} /> Clinical Calculators — one-time payment access
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          34 internationally standard clinical scores & decision-support tools — for those who don't want a monthly subscription.
        </p>
        <div className="mt-3 flex items-center justify-between border-b border-neutral-100 py-2 text-sm">
          <span className="text-neutral-500">Pay from your PanaceaToken balance</span>
          <span className="font-extrabold text-brand-dark">500 PNC</span>
        </div>
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-neutral-500">Equivalent bank transfer</span>
          <span className="font-extrabold text-brand-dark">Rp500,000</span>
        </div>
        <Button className="mt-3 w-full" variant="outline" onClick={() => navigate('/clinical-calculators')}>Open Clinical Calculators</Button>
      </Card>

      <Card className="!border-neutral-100">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          <IconHeart size={14} /> Chronic — lifetime account option
        </div>
        <div className="mt-3 flex items-center justify-between py-2 text-sm">
          <span className="text-neutral-500">Chronic Monitoring Lifetime</span>
          <span className="font-extrabold text-ink">Rp19,900,000</span>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-100 py-2 text-sm">
          <span className="text-neutral-500">1 PanaceaToken (PNC)</span>
          <span className="font-extrabold text-ink">Rp1,000</span>
        </div>
      </Card>

      <Card className="!border-brand/20 bg-brand-50/50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
          <IconWallet size={14} /> How to Pay
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          All payments are made via <b>bank transfer</b> to Panaceamed.id's official account:
        </p>
        <div className="mt-3 rounded-xl bg-white p-4">
          <div className="text-sm font-black text-ink">{MANUAL_BANK.bank}</div>
          <div className="mt-0.5 text-lg font-black tracking-wide text-brand-dark">{MANUAL_BANK.number}</div>
          <div className="text-xs text-neutral-500">a.n. {MANUAL_BANK.holder}</div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          After transferring, upload your proof on the Billing page — PNC balance is added once the proof is verified (1 PNC = Rp1,000).
        </p>
        <Button className="mt-3 w-full" variant="outline" onClick={() => navigate('/billing')}>Top Up Balance in Billing</Button>
      </Card>

      <p className="text-center text-[11px] leading-relaxed text-neutral-400">
        Certified AI-EMR + CDSS for clinicians/institutions: contact us for subscription pricing.
        Medical Materials Hub: pricing set by authors, royalties paid automatically to contributors.
      </p>
    </div>
  )
}

export default Pricing
