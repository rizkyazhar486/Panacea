import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { lightsCriteria, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Light's Criteria — Light, R.W., et al. (1972), Ann Intern Med, 77(4):507-513.
// Distinguishes exudative from transudative pleural effusion. Fluid is
// exudative if ANY ONE of the three ratio/threshold criteria is met — very
// high sensitivity for exudate, at some cost to specificity (transudates can
// occasionally misclassify as exudate, especially with diuretic use). Pure
// arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function LightsCriteria() {
  // Teks mentah: kolom kosong tetap "belum diisi" (NaN), bukan 0 yang sah.
  const [pleuralProtein, setPleuralProtein] = useState('3.5')
  const [serumProtein, setSerumProtein] = useState('6.5')
  const [pleuralLdh, setPleuralLdh] = useState('180')
  const [serumLdh, setSerumLdh] = useState('200')
  const [serumLdhUln, setSerumLdhUln] = useState('200')

  const res = lightsCriteria({
    pleuralProtein: parseNumberField(pleuralProtein), serumProtein: parseNumberField(serumProtein),
    pleuralLdh: parseNumberField(pleuralLdh), serumLdh: parseNumberField(serumLdh), serumLdhUln: parseNumberField(serumLdhUln),
  })

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Light's Criteria" subtitle="Exudate vs. transudate pleural effusion (Light et al. 1972)" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Cairan digolongkan eksudat bila SALAH SATU dari ketiga kriteria terpenuhi. Kepekaannya tinggi untuk eksudat, tetapi gagal jantung yang sedang diberi diuretik kadang melewati ambang itu dan tampak sebagai eksudat palsu.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Pleural fluid protein (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={pleuralProtein} onChange={(e) => setPleuralProtein(e.target.value)} />
          </Field>
          <Field label="Serum protein (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={serumProtein} onChange={(e) => setSerumProtein(e.target.value)} />
          </Field>
          <Field label="Pleural fluid LDH (IU/L)">
            <input className={inputClass} type="number" min={0} value={pleuralLdh} onChange={(e) => setPleuralLdh(e.target.value)} />
          </Field>
          <Field label="Serum LDH (IU/L)">
            <input className={inputClass} type="number" min={0} value={serumLdh} onChange={(e) => setSerumLdh(e.target.value)} />
          </Field>
          <Field label="Lab's upper limit of normal serum LDH (IU/L)">
            <input className={inputClass} type="number" min={0} value={serumLdhUln} onChange={(e) => setSerumLdhUln(e.target.value)} />
          </Field>
        </div>
      </Card>

      {!res.ok ? (
        <Card className="!p-5">
          <p role="alert" className="text-sm font-semibold text-amber-700 dark:text-amber-300">{res.reason}</p>
        </Card>
      ) : (
        <>
      <Card className="!p-5">
        <div className="space-y-2">
          {res.data.criteria.map((c) => (
            <div key={c.label} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <div>
                <div className="text-sm font-bold text-ink dark:text-ink">{c.label}</div>
                <div className="text-[11px] text-neutral-500">Value: {c.value}</div>
              </div>
              <Badge tone={c.met ? 'critical' : 'brand'}>{c.met ? 'Met' : 'Not met'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Classification</div>
        <div className="mt-2 flex items-center gap-3">
          <Badge tone={res.data.exudate ? 'critical' : 'brand'}>{res.data.exudate ? 'Exudate' : 'Transudate'}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-500">
          {res.data.exudate
            ? 'Exudative effusions warrant further workup for local causes (infection, malignancy, inflammation) — consider cytology, culture, pH, glucose, and adenosine deaminase as indicated.'
            : 'Transudative effusions are typically due to a systemic process (heart failure, cirrhosis, nephrotic syndrome) and rarely need further fluid analysis beyond addressing the underlying condition.'}
        </p>
      </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Light, R.W., et al. (1972). Pleural effusions: the diagnostic separation of transudates and
        exudates. <i>Ann Intern Med</i>, 77(4), 507-513. Decision-support estimate — correlate with
        clinical context, imaging, and further fluid analysis as indicated.
      </div>
    </div>
  )
}

export default LightsCriteria
