import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Modified Duke Criteria — Durack, D.T., et al. (1994), Am J Med, 96:200-209;
// modified by Li, J.S., et al. (2000), Clin Infect Dis, 30(4):633-638.
// Diagnostic classification for infective endocarditis:
//   DEFINITE (clinical): 2 major, or 1 major + 3 minor, or 5 minor
//   POSSIBLE:            1 major + 1 minor, or 3 minor
//   REJECTED:            criteria not met (or firm alternative diagnosis /
//                        resolution with ≤4 days of antibiotics — clinical
//                        judgment, not scored here)
// Pathologic criteria (positive histology/culture of vegetation) are
// independently definitive and modeled as an override flag. Pure logic,
// no external API.
// ─────────────────────────────────────────────────────────────────────────────

const MAJOR = [
  { key: 'bloodCulture', label: 'Positive blood cultures typical for IE (typical organisms ×2 separate cultures, persistently positive cultures, or single positive Coxiella burnetii / phase I IgG titer >1:800)' },
  { key: 'imaging', label: 'Evidence of endocardial involvement (echo: vegetation, abscess, new prosthetic valve dehiscence — or new valvular regurgitation)' },
] as const

const MINOR = [
  { key: 'predisposition', label: 'Predisposing heart condition or injection drug use' },
  { key: 'fever', label: 'Fever ≥ 38.0°C' },
  { key: 'vascular', label: 'Vascular phenomena (arterial emboli, septic pulmonary infarcts, mycotic aneurysm, intracranial hemorrhage, conjunctival hemorrhages, Janeway lesions)' },
  { key: 'immunologic', label: 'Immunologic phenomena (glomerulonephritis, Osler nodes, Roth spots, rheumatoid factor)' },
  { key: 'micro', label: 'Microbiological evidence not meeting a major criterion (positive culture not meeting major, or serology consistent with IE)' },
] as const

type Verdict = { label: string; tone: 'brand' | 'low' | 'critical'; note: string }

function classify(pathologic: boolean, majors: number, minors: number): Verdict {
  if (pathologic)
    return { label: 'Definite IE (pathologic)', tone: 'critical', note: 'Pathologic confirmation (vegetation/abscess histology or culture) is independently definitive.' }
  if (majors >= 2 || (majors === 1 && minors >= 3) || minors >= 5)
    return { label: 'Definite IE (clinical)', tone: 'critical', note: 'Meets clinical criteria for definite infective endocarditis — manage per IE guidelines (prolonged targeted antibiotics, surgical evaluation as indicated).' }
  if ((majors === 1 && minors >= 1) || minors >= 3)
    return { label: 'Possible IE', tone: 'low', note: 'Meets criteria for possible IE — continue workup: serial blood cultures, repeat/TEE echocardiography, and reassess.' }
  return { label: 'Criteria not met', tone: 'brand', note: 'Does not meet Duke criteria for definite or possible IE at this time. A firm alternative diagnosis or resolution with ≤4 days of antibiotics also supports rejection — clinical judgment applies.' }
}

export function DukeCriteria() {
  const [pathologic, setPathologic] = useState(false)
  const [major, setMajor] = useState<Record<string, boolean>>({})
  const [minor, setMinor] = useState<Record<string, boolean>>({})

  const majors = MAJOR.filter((m) => major[m.key]).length
  const minors = MINOR.filter((m) => minor[m.key]).length
  const verdict = classify(pathologic, majors, minors)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Modified Duke Criteria" subtitle="Infective endocarditis diagnosis (Durack 1994, modified Li 2000)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Definite (clinical) = 2 major, 1 major + 3 minor, or 5 minor. Possible = 1 major + 1 minor,
          or 3 minor. Pathologic confirmation is independently definitive.
        </p>
        <label className="mt-3 flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
          <input type="checkbox" className="h-4 w-4 rounded" checked={pathologic} onChange={(e) => setPathologic(e.target.checked)} />
          Pathologic criterion met (histology or culture of vegetation/abscess positive)
        </label>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Major criteria ({majors}/2)</div>
        <div className="mt-3 space-y-2">
          {MAJOR.map((c) => (
            <label key={c.key} className="flex items-start gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold leading-snug text-ink dark:bg-white/5 dark:text-white">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded" checked={!!major[c.key]} onChange={() => setMajor((s) => ({ ...s, [c.key]: !s[c.key] }))} />
              {c.label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Minor criteria ({minors}/5)</div>
        <div className="mt-3 space-y-2">
          {MINOR.map((c) => (
            <label key={c.key} className="flex items-start gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold leading-snug text-ink dark:bg-white/5 dark:text-white">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded" checked={!!minor[c.key]} onChange={() => setMinor((s) => ({ ...s, [c.key]: !s[c.key] }))} />
              {c.label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Classification</div>
        <div className="mt-2">
          <Badge tone={verdict.tone}>{verdict.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">{verdict.note}</p>
        <CopyNote text={`Modified Duke: ${majors} major + ${minors} minor${pathologic ? ' + pathologic criterion' : ''} — ${verdict.label} [Durack 1994; Li 2000]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Durack, D.T., et al. (1994). <i>Am J Med</i>, 96(3), 200-209; Li, J.S., et al. (2000).
        <i> Clin Infect Dis</i>, 30(4), 633-638. Decision-support estimate — the 2023 Duke-ISCVID
        update adds newer imaging (PET/CT) and organism criteria; follow current IE guidelines for
        management.
      </div>
    </div>
  )
}

export default DukeCriteria
