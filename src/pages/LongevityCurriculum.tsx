import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'

// Physician-led longevity medicine curriculum — an educational overview of
// the major domains, each tagged by evidence maturity (Established / Emerging
// / Experimental) so a clinician can calibrate how much weight to give each
// topic. This is curriculum/orientation content, not a prescribing guide —
// several domains here (peptides, hormone optimization) have significant
// gray-market misuse outside licensed supervision, which each module flags
// explicitly rather than glossing over.

type Evidence = 'established' | 'emerging' | 'experimental'
const evidenceLabel: Record<Evidence, { l: string; tone: 'normal' | 'low' | 'critical' }> = {
  established: { l: 'Established — strong evidence, in routine clinical use', tone: 'normal' },
  emerging: { l: 'Emerging — growing evidence, expanding indications', tone: 'low' },
  experimental: { l: 'Experimental — not yet strongly proven, only via clinical trials/strict supervision', tone: 'critical' },
}

interface Module {
  key: string
  icon: string
  title: string
  evidence: Evidence
  summary: string
  keyPoints: string[]
  caution?: string
  references: string[]
}

const MODULES: Module[] = [
  {
    key: 'stemcell', icon: '🧬', title: 'Stem Cells & Regenerative Medicine', evidence: 'experimental',
    summary: 'Use of mesenchymal stem cells (MSCs), derivative products (exosomes), and other regenerative therapies for tissue repair & inflammation modulation.',
    keyPoints: [
      'FDA-approved indications are very limited (e.g. hematopoietic stem cell transplantation for blood malignancies) — most other "anti-aging"/regenerative applications remain investigational.',
      '"Ready-to-use" exosome & stem cell products marketed by anti-aging clinics generally have NOT undergone controlled phase III clinical trials for those claims.',
      'Real risks: infection, unpredictable immune responses, and tumor cases from unregulated products have been reported (FDA warning letters).',
    ],
    caution: 'Refer patients ONLY to registered clinical trials (e.g. ClinicalTrials.gov) or facilities with official regulatory authorization (BPOM/FDA) — avoid clinics claiming "anti-aging" stem cell therapy without a basis in published clinical trials.',
    references: ['FDA. Public Safety Notification on Stem Cell Therapies.', 'Galipeau J & Sensébé L. Mesenchymal Stromal Cells: Clinical Challenges and Therapeutic Opportunities. Cell Stem Cell 2018.'],
  },
  {
    key: 'robotics', icon: '🤖', title: 'Medical Robotics', evidence: 'established',
    summary: 'Robot-assisted surgery (e.g. the da Vinci system), rehabilitation exoskeletons, and diagnostic AI as a precision extension of clinician capability.',
    keyPoints: [
      'Robotic surgery has proven to reduce blood loss & length of stay in prostatectomy, hysterectomy, and certain colorectal surgeries — but at high cost & with a significant learning curve.',
      'Rehabilitation exoskeletons (e.g. post-stroke, spinal cord injury) show improved gait function in medium-scale controlled studies.',
      'Diagnostic AI (radiology, digital pathology) has already received regulatory clearance (FDA-cleared) for specific tasks (e.g. lung nodule detection, diabetic retinopathy) — not a substitute for final clinical decision-making.',
    ],
    references: ['Ficarra V, et al. Robot-assisted vs open radical prostatectomy meta-analysis. Eur Urol.', 'Esquenazi A, et al. Powered exoskeletons for gait rehab post-stroke. Am J Phys Med Rehabil.'],
  },
  {
    key: 'sglt2', icon: '💊', title: 'SGLT2 Inhibitors', evidence: 'established',
    summary: 'Sodium-glucose cotransporter-2 inhibitors (e.g. dapagliflozin, empagliflozin) — originally diabetes drugs, now with broad cardio-renal benefit evidence.',
    keyPoints: [
      'Established indications: type 2 diabetes, heart failure (HFrEF & HFpEF), chronic kidney disease — reducing heart failure hospitalization & CKD progression independent of glycemic effect.',
      'Longevity mechanisms of interest: mild natriuresis, reduced cardiac preload/afterload, and possible broader anti-inflammatory & metabolic effects.',
      '"Off-label" use in non-diabetic/non-HF populations for cardiometabolic benefit remains emerging — there is no official indication yet for healthy populations as an "anti-aging drug".',
    ],
    references: ['McMurray JJV, et al. DAPA-HF Trial. N Engl J Med 2019.', 'Heerspink HJL, et al. DAPA-CKD Trial. N Engl J Med 2020.'],
  },
  {
    key: 'ai', icon: '🖥️', title: 'AI & Technology in Longevity', evidence: 'emerging',
    summary: 'Wearables, biological age algorithms, and AI-based clinical decision support as tools for monitoring & predicting long-term health risk.',
    keyPoints: [
      'Wearables (HRV, estimated VO2max, sleep) provide useful longitudinal data for personal trends — but absolute accuracy varies between devices & has not replaced gold-standard clinical measurement.',
      '"Biological age" from epigenetic clocks (e.g. Horvath clock, GrimAge, PhenoAge) correlates with mortality in large cohort studies, but there is no clinical consensus yet on how to intervene based on these scores individually.',
      'AI clinical decision support (risk screening, triage) improves efficiency but still requires local validation & clinician oversight — algorithmic bias is a real risk when training data is not representative.',
    ],
    references: ['Horvath S. DNA methylation age of human tissues and cell types. Genome Biol 2013.', 'Levine ME, et al. An epigenetic biomarker of aging for lifespan and healthspan (PhenoAge). Aging (Albany NY) 2018.'],
  },
  {
    key: 'peptides', icon: '🧪', title: 'Therapeutic Peptides', evidence: 'experimental',
    summary: 'Short peptide molecules targeting specific receptors — ranging from established classes (e.g. GLP-1 analogs) to gray-market "longevity" peptides (BPC-157, epithalon, etc.).',
    keyPoints: [
      'GLP-1/GIP analogs (semaglutide, tirzepatide) are peptides with strong evidence for type 2 diabetes & obesity — this class is established, not experimental.',
      'Peptides widely marketed for "anti-aging"/tissue repair (BPC-157, TB-500, epithalon, etc.) mostly have ONLY preclinical data (animal/in-vitro) — controlled human safety & efficacy data is very limited or nonexistent.',
      'The regulatory status of many of these peptides is "research chemical," NOT an approved drug for human use in most jurisdictions, including Indonesia (BPOM).',
    ],
    caution: 'Do not prescribe or recommend gray-market peptides without a basis in published clinical trials & official marketing authorization — risk of product contamination, non-standardized dosing, and unpredictable side effects from non-pharmaceutical supply.',
    references: ['Sikirić P, et al. Pentadecapeptide BPC 157: review of preclinical evidence. Curr Pharm Des.', 'Wilding JPH, et al. Semaglutide for weight management (STEP trials). N Engl J Med 2021.'],
  },
  {
    key: 'hormones', icon: '⚗️', title: 'Hormone Optimization', evidence: 'emerging',
    summary: 'Hormone replacement therapy (menopause, andropause, subclinical thyroid) in a longevity context — balancing quality-of-life benefit against long-term risk.',
    keyPoints: [
      'Menopausal hormone therapy: safe & effective for vasomotor symptoms in women <60 years old/within 10 years of menopause without contraindications (WHI reanalysis) — timing matters.',
      'Testosterone therapy in men with confirmed hypogonadism (not merely "low-normal" without symptoms) improves symptoms, but long-term cardiovascular effects remain debated (the TRAVERSE trial provides reassuring data, though not without nuance).',
      '"Preventive" hormone optimization in individuals without a diagnosed deficiency is NOT supported by strong evidence & carries risk of side effects (erythrocytosis, thromboembolism risk, suppression of the endogenous axis).',
    ],
    references: ['Manson JE, et al. WHI hormone therapy trials long-term follow-up. JAMA.', 'Bhasin S, et al. TRAVERSE Trial: testosterone and cardiovascular safety. N Engl J Med 2023.'],
  },
  {
    key: 'cardio', icon: '❤️', title: 'Longevity & Cardiovascular Health', evidence: 'established',
    summary: 'Cardiovascular disease remains the leading cause of death globally — evidence-based intervention here delivers the greatest impact on healthspan.',
    keyPoints: [
      'Statins & PCSK9 inhibitors consistently lower LDL & major cardiovascular events in large-scale RCTs — a central pillar of evidence-based cardiovascular prevention.',
      'Lifestyle factors (physical activity, Mediterranean/DASH-pattern diet, smoking cessation, adequate sleep) provide an equally important longevity impact, with epidemiological & RCT evidence (PREDIMED, etc.).',
      'Biomarkers such as Lp(a) & coronary artery calcium (CAC) score help with individual risk stratification beyond standard risk calculators (ASCVD).',
    ],
    references: ['Cholesterol Treatment Trialists Collaboration. Efficacy of statin therapy meta-analysis. Lancet.', 'Estruch R, et al. PREDIMED Trial — Mediterranean diet. N Engl J Med 2018.'],
  },
  {
    key: 'biomarkers', icon: '🔬', title: 'Longevity Endpoint Biomarkers', evidence: 'emerging',
    summary: 'Biological markers used as a proxy for "long-term health" — important to understand which are validated versus still research-stage.',
    keyPoints: [
      'VO2max & HRV: strongly validated predictors of mortality & morbidity in large cohort studies — the most actionable functional biomarkers currently available.',
      'hsCRP & markers of chronic inflammation (inflammaging): correlate with cardiovascular & metabolic risk, used in clinical risk stratification (e.g. the JUPITER trial for statins).',
      'Epigenetic clocks & telomere length: correlate at the population level with biological aging, but there is NO regulator-approved endpoint yet for individual anti-aging drug trials — an active research area, not a routine clinical diagnostic tool.',
    ],
    references: ['Ross R, et al. Importance of assessing cardiorespiratory fitness in clinical practice (AHA Scientific Statement). Circulation 2016.', 'Ridker PM, et al. JUPITER Trial — hsCRP-guided statin therapy. N Engl J Med 2008.'],
  },
  {
    key: 'research', icon: '🏛️', title: 'Clinical Research Infrastructure', evidence: 'established',
    summary: 'The methodological framework that ensures longevity medicine claims can be trusted — the evidence hierarchy, clinical trial design, and regulatory pathways.',
    keyPoints: [
      'Evidence hierarchy: RCT meta-analysis > single RCT > prospective cohort > case-control study > case reports/expert opinion — most popular "longevity" claims stop at the lower levels of this hierarchy.',
      'Longevity RCT design faces unique challenges: hard endpoints (death) require decades of follow-up, so surrogate endpoints are used instead — but their validity must be proven to correlate with hard outcomes.',
      'Regulatory pathways (FDA, EMA, BPOM) require safety & efficacy evidence before an indication claim can be marketed — products that bypass this pathway (supplements/"research chemicals") do not undergo drug-equivalent oversight.',
    ],
    references: ['Sackett DL, et al. Evidence based medicine: what it is and what it isn\'t. BMJ 1996.', 'Kaeberlein M. The biology of aging: citable classic papers and study of longevity interventions. Elife.'],
  },
]

export function LongevityCurriculum() {
  const [openKey, setOpenKey] = useState<string | null>('stemcell')

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <SectionTitle
        icon={<IconHeart size={20} />}
        title="Longevity Medicine Curriculum"
        subtitle="A tiered overview for clinicians/institutions — stem cells, robotics, SGLT2i, AI, peptides, hormones, cardiovascular health, biomarkers & research infrastructure"
      />
      <p className="text-[12px] leading-relaxed text-neutral-500">
        Each module is tagged with its evidence maturity level. This is educational/orientation material for clinicians, <b>not a prescribing guide</b> —
        several topics (peptides, hormone optimization) carry a real risk of gray-market misuse outside licensed
        professional supervision, and the relevant modules state this explicitly.
      </p>

      <div className="space-y-3">
        {MODULES.map((m) => {
          const open = openKey === m.key
          const ev = evidenceLabel[m.evidence]
          return (
            <Card key={m.key} className="!p-0 overflow-hidden">
              <button
                onClick={() => setOpenKey(open ? null : m.key)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-ink">{m.title}</div>
                  <Badge tone={ev.tone}>{ev.l}</Badge>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {open && (
                <div className="border-t border-black/5 p-4 pt-3">
                  <p className="text-[12px] leading-relaxed text-neutral-600">{m.summary}</p>
                  <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-neutral-600">
                    {m.keyPoints.map((k, i) => <li key={i}>• {k}</li>)}
                  </ul>
                  {m.caution && (
                    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
                      <p className="text-[11px] font-black text-amber-800">⚠️ Safety Note</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-700">{m.caution}</p>
                    </div>
                  )}
                  <div className="mt-3 rounded-xl bg-neutral-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">References</div>
                    <ul className="mt-1 space-y-1 text-[10px] leading-relaxed text-neutral-500">
                      {m.references.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <p className="text-center text-[10px] leading-relaxed text-neutral-400">
        The citations on this page are landmark references underlying each topic — verify details (DOI, volume, latest edition)
        directly on PubMed/publisher sites for formal academic use. This material is compiled for clinician/educational
        institution orientation, not as a substitute for a systematic literature review or official specialty guidelines.
      </p>
    </div>
  )
}

export default LongevityCurriculum
