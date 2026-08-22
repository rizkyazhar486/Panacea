import { useEffect, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { hariLalu, hariIni } from '../lib/tanggal'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconFlame } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Thermal Therapy — sauna (heat) and cold-exposure protocols with the evidence
// behind each, plus a weekly session log. Regular sauna use is associated with
// lower cardiovascular and all-cause mortality (Laukkanen et al., 2015, JAMA
// Intern Med 175(4):542-548); deliberate cold exposure raises mood-linked
// catecholamines. Pure localStorage, no API. Includes clear safety limits.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_thermal_v1'
interface Session { date: string; kind: 'sauna' | 'cold' }
function load(): Session[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') as Session[] } catch { return [] }
}

const PROTOCOLS = [
  {
    kind: 'sauna' as const, emoji: '🔥', title: 'Sauna (heat)',
    dose: '~80-100°C, 15-20 min per session, 4-7 sessions/week',
    benefit: 'The strongest signal is cardiovascular: 4-7 sessions/week was associated with markedly lower cardiovascular and all-cause mortality in a large Finnish cohort. Also aids recovery and relaxation.',
    safety: 'Hydrate well. Avoid alcohol. Skip if pregnant, if you have unstable heart disease, or feel dizzy — step out immediately.',
  },
  {
    kind: 'cold' as const, emoji: '🧊', title: 'Cold exposure',
    dose: 'Cold shower or plunge ~10-15°C, 1-3 min, a few times per week (~11 min/week total)',
    benefit: 'Deliberate cold raises dopamine and noradrenaline for hours, which many find lifts mood, alertness, and resilience. Popular for post-stress reset.',
    safety: 'Never do cold plunges alone or in open water without supervision. Cold-water shock can be dangerous with heart or blood-pressure conditions — check with your doctor first.',
  },
]

export function ThermalTherapy() {
  const [sessions, setSessions] = useState<Session[]>(load)
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(sessions)) } catch { /* ignore */ }
  }, [sessions])

  const today = hariIni()
  const log = (kind: Session['kind']) => setSessions((prev) => [{ date: today, kind }, ...prev].slice(0, 200))

  const weekAgo = hariLalu(7)
  const thisWeek = sessions.filter((s) => s.date >= weekAgo)
  const saunaCount = thisWeek.filter((s) => s.kind === 'sauna').length
  const coldCount = thisWeek.filter((s) => s.kind === 'cold').length

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconFlame size={20} />} title="Thermal Therapy" subtitle="Sauna & paparan dingin — protokol, bukti, dan catatan mingguan" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Paparan panas dan dingin yang disengaja adalah dua kebiasaan umur panjang yang paling banyak dibicarakan. Berikut apa yang benar-benar didukung bukti, bagaimana menakar masing-masing, dan catatan sederhana untuk membangun kebiasaannya — beserta batas keselamatan yang penting.</Prosa>
      </Card>

      <Card className="!p-4">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">This week</div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-brand/10 p-3">
            <div className="text-2xl font-black text-brand-dark">🔥 {saunaCount}</div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Sauna (target 4-7)</div>
          </div>
          <div className="rounded-2xl bg-brand/10 p-3">
            <div className="text-2xl font-black text-brand-dark">🧊 {coldCount}</div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Cold (target 2-4)</div>
          </div>
        </div>
      </Card>

      {PROTOCOLS.map((p) => (
        <Card key={p.kind} className="!p-5">
          <div className="flex items-center gap-2 text-[15px] font-black text-ink dark:text-ink">{p.emoji} {p.title}</div>
          <div className="mt-2 rounded-xl bg-neutral-50 px-3 py-2 text-[12px] font-semibold text-neutral-600 dark:bg-white/5 dark:text-neutral-300">Dose: {p.dose}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">{p.benefit}</p>
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            ⚠️ {p.safety}
          </p>
          <button onClick={() => log(p.kind)} className="mt-3 w-full rounded-xl bg-brand py-2 text-sm font-bold text-white">Log a {p.title.split(' ')[0].toLowerCase()} session today</button>
        </Card>
      ))}

      {sessions.length > 0 && (
        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Recent sessions</div>
            <Badge tone="brand">{sessions.length} total</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sessions.slice(0, 40).map((s, i) => (
              <span key={i} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                {s.kind === 'sauna' ? '🔥' : '🧊'} {s.date.slice(5)}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Laukkanen, T., et al. (2015). Association between sauna bathing and fatal cardiovascular and
        all-cause mortality events. <i>JAMA Internal Medicine</i>, 175(4), 542-548. Observational
        associations, not proof of causation — and never override the safety limits above.
      </div>
    </div>
  )
}

export default ThermalTherapy
