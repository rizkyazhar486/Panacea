// Cardiopulmonary and renal physiology for the Physiology stage. Each step summarizes a peer-reviewed review
// recorded in governance/LITERATURE_CITATION_LEDGER.json. Reference teaching physiology only: never a person's data.

import type { SourcedPhysiology } from './sourcedPhysiology.ts'

export const CARDIORENAL_PHYSIOLOGY: readonly SourcedPhysiology[] = [
  {
    id: 'cardiac-excitation-contraction-coupling',
    label: 'Cardiac excitation–contraction coupling',
    systems: ['cardiovascular'],
    summary: [
      'A cardiac action potential depolarizes the sarcolemma and T-tubules, opening voltage-gated L-type Ca²⁺ channels.',
      'Inward Ca²⁺ current triggers a larger Ca²⁺ release from the sarcoplasmic reticulum through ryanodine receptors (Ca²⁺-induced Ca²⁺ release).',
      'Cytosolic Ca²⁺ binds troponin C, exposing actin binding sites so myosin cross-bridges generate systolic force.',
      'Relaxation follows as SERCA pumps Ca²⁺ back into the sarcoplasmic reticulum and the Na⁺/Ca²⁺ exchanger extrudes Ca²⁺ across the sarcolemma.',
    ],
    references: [
      { reference: 'PMID 11805843', note: 'Bers (2002), Cardiac excitation-contraction coupling: L-type Ca²⁺-induced sarcoplasmic reticulum release, troponin C activation, and SERCA/NCX relaxation.' },
    ],
    boundary: 'Reference teaching physiology of ventricular excitation–contraction coupling: not a measurement of any person’s contractility, rhythm, or clinical status.',
  },
  {
    id: 'heart-rate-variability-autonomic-coupling',
    label: 'Heart rate variability: neurocardiac autonomic coupling',
    systems: ['cardiovascular', 'nervous'],
    summary: [
      'Successive interbeat intervals vary continuously as sinoatrial nodal pacemaking integrates neural and humoral inputs.',
      'Parasympathetic vagal efferents modulate heart rate rapidly, whereas sympathetic efferent adjustments act over slower timescales.',
      'Respiratory sinus arrhythmia and arterial baroreflex arcs couple breathing and blood pressure fluctuations to beat-to-beat timing.',
      'Time-domain and frequency-domain metrics summarize these interdependent neurocardiac oscillations rather than isolating a single organ.',
    ],
    references: [
      { reference: 'PMID 29034226', note: 'Shaffer & Ginsberg (2017), An Overview of Heart Rate Variability Metrics and Norms: neurocardiac autonomic interactions and time/frequency-domain metrics.' },
    ],
    boundary: 'Reference teaching physiology of heart rate variability: not a measurement of any person’s HRV, autonomic tone, or diagnosis.',
  },
  {
    id: 'hypoxic-pulmonary-vasoconstriction',
    label: 'Hypoxic pulmonary vasoconstriction: V/Q matching',
    systems: ['respiratory', 'cardiovascular'],
    summary: [
      'Low alveolar oxygen tension is sensed locally by pulmonary arterial smooth muscle cells in resistance vessels.',
      'Redox-sensitive ion channel changes depolarize smooth muscle membranes and raise intracellular Ca²⁺, triggering vasoconstriction.',
      'Constriction increases local vascular resistance in poorly ventilated lung zones, diverting capillary perfusion to better-ventilated alveoli.',
      'This regional vascular match helps preserve systemic arterial oxygenation when alveolar ventilation is uneven.',
    ],
    references: [
      { reference: 'PMID 27645688', note: 'Dunham-Snary et al. (2017), Hypoxic Pulmonary Vasoconstriction: From Molecular Mechanisms to Medicine — hypoxic pulmonary arterial constriction matching perfusion to ventilation.' },
    ],
    boundary: 'Reference teaching physiology of hypoxic pulmonary vasoconstriction: not a measurement of any person’s pulmonary pressure, gas exchange, or treatment guidance.',
  },
  {
    id: 'transpulmonary-ventilation-mechanics',
    label: 'Transpulmonary pressure and ventilation mechanics',
    systems: ['respiratory'],
    summary: [
      'Transpulmonary pressure is the difference between alveolar pressure and pleural pressure acting across the lung parenchyma.',
      'Inspiratory muscle contraction lowers pleural pressure, enlarging the transpulmonary gradient so air flows into alveoli.',
      'Total driving pressure must overcome both resistive pressure drop along conducting airways and elastic recoil of lung and chest wall.',
      'Because chest-wall stiffness alters pleural pressure, airway pressure alone does not directly measure parenchymal distending stress.',
    ],
    references: [
      { reference: 'PMID 28828360', note: 'Grieco, Chen & Brochard (2017), Transpulmonary pressure: importance and limits — alveolar-to-pleural pressure gradient governing lung distension.' },
      { reference: 'PMID 37467769', note: 'Farré & Navajas (2023), Ventilation Mechanics: airway resistance, lung-chest elastance, and respiratory mechanics.' },
    ],
    boundary: 'Reference teaching physiology of ventilation mechanics: not a measurement of any person’s lung compliance, ventilator setting, or clinical care.',
  },
  {
    id: 'tubuloglomerular-feedback-autoregulation',
    label: 'Tubuloglomerular feedback and nephrovascular coupling',
    systems: ['urinary'],
    summary: [
      'Macula densa epithelial cells at the thick ascending limb sense NaCl delivery exiting the loop of Henle.',
      'Higher distal NaCl delivery triggers paracrine signalling across the juxtaglomerular apparatus to constrict the afferent arteriole.',
      'Afferent constriction lowers glomerular capillary pressure and stabilizes single-nephron filtration despite arterial pressure swings.',
      'Vascular signal conduction along renal microvessels synchronizes feedback oscillations across neighbouring nephrons.',
    ],
    references: [
      { reference: 'PMID 8676542', note: 'Ito & Abe (1996), Tubuloglomerular feedback: macula densa NaCl sensing regulating afferent arteriolar resistance and filtration.' },
      { reference: 'PMID 33833078', note: 'Zehra, Cupples & Braam (2021), Tubuloglomerular Feedback Synchronization in Nephrovascular Networks: coupled nephron autoregulation.' },
    ],
    boundary: 'Reference teaching physiology of tubuloglomerular feedback: not a measurement of any person’s GFR, kidney perfusion, or diagnosis.',
  },
  {
    id: 'renal-ammoniagenesis-acid-excretion',
    label: 'Renal ammonia handling and distal acid excretion',
    systems: ['urinary'],
    summary: [
      'Proximal tubular cells metabolize glutamine to generate ammonium (NH₄⁺) and new bicarbonate returned to systemic blood.',
      'Thick ascending limb transport reabsorbs NH₄⁺ into the renal medullary interstitium, establishing a corticomedullary ammonia gradient.',
      'Collecting-duct intercalated cells actively secrete H⁺ via apical proton pumps while NH₃ diffuses into the tubular lumen.',
      'Protonation traps NH₄⁺ in urine, excreting non-volatile acid load and defending systemic acid–base homeostasis.',
    ],
    references: [
      { reference: 'PMID 38448728', note: 'Bourgeois & Houillier (2024), State of knowledge on ammonia handling by the kidney: tubular ammoniagenesis and acid excretion.' },
      { reference: 'PMID 37016093', note: 'Wagner et al. (2023), The pathophysiology of distal renal tubular acidosis: collecting-duct H⁺ secretion and acid–base homeostasis.' },
    ],
    boundary: 'Reference teaching physiology of renal acid excretion: not a measurement of any person’s acid–base status, electrolytes, or clinical therapy.',
  },
]
