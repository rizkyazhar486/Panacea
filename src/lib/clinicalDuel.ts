export type DuelChoice = {
  label: string
  explanation?: string
}

export type ClinicalDuelCase = {
  id: string
  category: string
  difficulty: 'Core' | 'Advanced'
  title: string
  stem: string
  choices: DuelChoice[]
  correctIndex: number
  rationale: string
  pearl: string
  nextStep: string
}

export const CLINICAL_DUELS: ClinicalDuelCase[] = [
  {
    id: 'acs-posterior-001',
    category: 'Cardiology',
    difficulty: 'Core',
    title: 'The quiet posterior MI',
    stem: 'A 58-year-old man has crushing chest pain, diaphoresis and ST depression in V1-V3 with tall R waves. Which next ECG step most directly tests the leading diagnosis?',
    choices: [
      { label: 'Repeat a standard 12-lead ECG in 6 hours' },
      { label: 'Add posterior leads V7-V9' },
      { label: 'Add only right-sided lead V4R' },
      { label: 'Order an exercise stress test now' },
    ],
    correctIndex: 1,
    rationale: 'Reciprocal anterior changes can be the mirror image of posterior ST elevation. Posterior leads V7-V9 directly sample the posterior wall and can reveal the concealed elevation.',
    pearl: 'When the 12-lead looks like a mirror, change the viewpoint before changing the diagnosis.',
    nextStep: 'Use the result in the full clinical context and follow local acute coronary syndrome pathways.',
  },
  {
    id: 'dka-potassium-001',
    category: 'Emergency Medicine',
    difficulty: 'Core',
    title: 'DKA: potassium before insulin',
    stem: 'A patient with diabetic ketoacidosis has potassium 2.8 mmol/L before insulin is started. Which principle is most important immediately?',
    choices: [
      { label: 'Start insulin immediately at the usual infusion rate' },
      { label: 'Correct potassium first while continuing appropriate fluid resuscitation' },
      { label: 'Give sodium bicarbonate routinely' },
      { label: 'Restrict fluids until glucose is below 250 mg/dL' },
    ],
    correctIndex: 1,
    rationale: 'Insulin shifts potassium into cells and can worsen severe hypokalaemia. When potassium is markedly low, potassium replacement takes priority before insulin is advanced.',
    pearl: 'In DKA, the serum potassium can look reassuring even when total-body potassium is depleted; a truly low serum value is especially dangerous.',
    nextStep: 'Recheck electrolytes frequently and follow a validated DKA protocol.',
  },
  {
    id: 'tamponade-001',
    category: 'Critical Care',
    difficulty: 'Core',
    title: 'Shock with a quiet chest',
    stem: 'A hypotensive patient has elevated JVP, muffled heart sounds and pulsus paradoxus after a recent pericardial illness. Which bedside test is most useful for rapid confirmation?',
    choices: [
      { label: 'Transthoracic echocardiography' },
      { label: 'CT coronary angiography' },
      { label: 'Exercise treadmill testing' },
      { label: 'Holter monitoring' },
    ],
    correctIndex: 0,
    rationale: 'Bedside echocardiography can rapidly demonstrate pericardial effusion and haemodynamic effects such as chamber collapse in the appropriate clinical setting.',
    pearl: 'In obstructive shock, physiology matters more than the size of an effusion alone.',
    nextStep: 'Escalate urgently to experienced clinicians when tamponade physiology is suspected.',
  },
  {
    id: 'ectopic-001',
    category: 'Obstetrics & Gynecology',
    difficulty: 'Core',
    title: 'Pregnancy of unknown location',
    stem: 'A haemodynamically stable patient has a positive pregnancy test, pelvic pain and no definitive intrauterine pregnancy on an initial transvaginal ultrasound. What is the safest framing?',
    choices: [
      { label: 'Ectopic pregnancy is excluded' },
      { label: 'This is a pregnancy of unknown location requiring follow-up' },
      { label: 'This proves a completed miscarriage' },
      { label: 'No further testing is needed if pain improves' },
    ],
    correctIndex: 1,
    rationale: 'An initially non-localised pregnancy is not automatically ectopic, intrauterine or completed miscarriage. Serial assessment using symptoms, hCG trends and repeat imaging is commonly required.',
    pearl: 'Unknown location is a temporary state of evidence, not a final diagnosis.',
    nextStep: 'Use urgent reassessment if instability, increasing pain or bleeding develops.',
  },
  {
    id: 'meningitis-001',
    category: 'Neurology & Infection',
    difficulty: 'Advanced',
    title: 'Do not let imaging create dangerous delay',
    stem: 'A febrile adult has neck stiffness and altered mental status. Bacterial meningitis is strongly suspected. Which principle is most important when neuroimaging is considered before lumbar puncture?',
    choices: [
      { label: 'Antimicrobials should wait until after CT and lumbar puncture' },
      { label: 'Appropriate empiric therapy should not be dangerously delayed for imaging' },
      { label: 'Lumbar puncture is never useful in meningitis' },
      { label: 'A normal CT excludes meningitis' },
    ],
    correctIndex: 1,
    rationale: 'When bacterial meningitis is strongly suspected, indicated imaging should not create an avoidable delay in time-sensitive empiric treatment.',
    pearl: 'Diagnostic sequencing must preserve the treatment clock.',
    nextStep: 'Apply current local meningitis pathways, including blood cultures and adjunctive therapy where appropriate.',
  },
  {
    id: 'compartment-001',
    category: 'Orthopaedics',
    difficulty: 'Core',
    title: 'Pain that outruns the X-ray',
    stem: 'After a tibial fracture, a patient develops rapidly escalating pain out of proportion to the visible injury and pain with passive stretch. What complication must be considered urgently?',
    choices: [
      { label: 'Acute compartment syndrome' },
      { label: 'Complex regional pain syndrome as the immediate diagnosis' },
      { label: 'Routine post-fracture soreness only' },
      { label: 'Chronic exertional compartment syndrome' },
    ],
    correctIndex: 0,
    rationale: 'Disproportionate pain and pain with passive stretch are classic early warning features of acute compartment syndrome in the correct context.',
    pearl: 'A normal pulse does not rule out compartment syndrome.',
    nextStep: 'Urgent surgical assessment is required when acute compartment syndrome is suspected.',
  },
  {
    id: 'bronchiolitis-001',
    category: 'Pediatrics',
    difficulty: 'Core',
    title: 'Bronchiolitis without over-treatment',
    stem: 'An otherwise healthy infant has a first episode of viral bronchiolitis with wheeze, crackles and mild feeding difficulty but no impending respiratory failure. Which approach best reflects the core management principle?',
    choices: [
      { label: 'Supportive care with attention to oxygenation and hydration' },
      { label: 'Routine antibiotics for all infants' },
      { label: 'Routine systemic corticosteroids for all infants' },
      { label: 'Immediate CT chest in uncomplicated disease' },
    ],
    correctIndex: 0,
    rationale: 'Uncomplicated bronchiolitis is primarily managed supportively, with escalation based on respiratory effort, oxygenation, hydration and risk factors.',
    pearl: 'Good pediatric care often means knowing which interventions not to add.',
    nextStep: 'Assess severity, feeding and oxygenation, and use local pediatric guidance.',
  },
  {
    id: 'upper-gi-bleed-001',
    category: 'Gastroenterology',
    difficulty: 'Advanced',
    title: 'Upper GI bleed: stabilize before labels',
    stem: 'A patient presents with hematemesis, tachycardia and borderline hypotension. Before the cause is definitively known, what is the most important immediate organizing principle?',
    choices: [
      { label: 'Resuscitation and haemodynamic stabilization while arranging definitive evaluation' },
      { label: 'Delay vascular access until endoscopy confirms the source' },
      { label: 'Give oral fluids and discharge if bleeding stops briefly' },
      { label: 'Wait for stool colour to identify the bleeding site' },
    ],
    correctIndex: 0,
    rationale: 'Acute gastrointestinal bleeding is first an ABC and perfusion problem. Etiologic treatment and endoscopy follow appropriate stabilization and risk assessment.',
    pearl: 'In bleeding, physiology is the first diagnosis to treat.',
    nextStep: 'Use validated risk assessment and local upper GI bleeding protocols.',
  },
  {
    id: 'stroke-lvo-001',
    category: 'Stroke',
    difficulty: 'Advanced',
    title: 'Large-vessel occlusion clock',
    stem: 'A patient develops sudden aphasia and dense hemiparesis. Non-contrast CT excludes haemorrhage. Which additional imaging question can immediately change reperfusion options in a suspected large-vessel occlusion?',
    choices: [
      { label: 'Is there a proximal arterial occlusion on vascular imaging?' },
      { label: 'Is there chronic sinus disease?' },
      { label: 'Is there cervical spondylosis?' },
      { label: 'Is there an old healed skull fracture?' },
    ],
    correctIndex: 0,
    rationale: 'Rapid vascular imaging can identify a treatable large-vessel occlusion and determine whether endovascular pathways should be activated.',
    pearl: 'Stroke imaging is not only about what tissue looks like; it is also about which vessel can still be reopened.',
    nextStep: 'Activate a local stroke pathway immediately rather than using this educational challenge for patient decisions.',
  },
  {
    id: 'anaphylaxis-001',
    category: 'Allergy & Emergency',
    difficulty: 'Core',
    title: 'Anaphylaxis: the first drug matters',
    stem: 'Minutes after an exposure, a patient develops urticaria, wheeze, hypotension and throat tightness. Which medication is the first-line emergency treatment?',
    choices: [
      { label: 'Intramuscular epinephrine' },
      { label: 'Oral antihistamine alone' },
      { label: 'Inhaled corticosteroid alone' },
      { label: 'Proton-pump inhibitor' },
    ],
    correctIndex: 0,
    rationale: 'Intramuscular epinephrine is the first-line treatment for anaphylaxis; adjuncts do not replace it.',
    pearl: 'In anaphylaxis, do not let second-line treatments delay the first-line treatment.',
    nextStep: 'Real suspected anaphylaxis is an emergency requiring immediate local emergency care.',
  },
  {
    id: 'tension-pneumo-001',
    category: 'Trauma',
    difficulty: 'Core',
    title: 'Treat the physiology, not the picture',
    stem: 'After chest trauma, a patient becomes acutely hypotensive and severely dyspnoeic with unilateral absent breath sounds and signs of obstructive shock. What principle is most important?',
    choices: [
      { label: 'Do not delay emergency decompression for confirmatory imaging when tension pneumothorax is clinically compelling' },
      { label: 'Wait for an outpatient chest X-ray' },
      { label: 'Use spirometry to confirm the diagnosis' },
      { label: 'Observe for 24 hours before treatment' },
    ],
    correctIndex: 0,
    rationale: 'Tension pneumothorax with haemodynamic compromise is a time-critical clinical diagnosis; imaging must not delay life-saving decompression when the presentation is compelling.',
    pearl: 'Some emergencies are diagnosed by the cost of waiting.',
    nextStep: 'This is educational content; suspected tension pneumothorax requires emergency clinical action.',
  },
  {
    id: 'g6pd-001',
    category: 'Hematology',
    difficulty: 'Advanced',
    title: 'Oxidative haemolysis pattern',
    stem: 'A patient develops jaundice and dark urine after an oxidant exposure. Smear shows bite cells and supravital staining would demonstrate Heinz bodies. Which mechanism best fits?',
    choices: [
      { label: 'Reduced red-cell protection from oxidative stress due to impaired NADPH generation' },
      { label: 'Isolated iron deficiency' },
      { label: 'Factor VIII deficiency' },
      { label: 'Autoimmune platelet destruction' },
    ],
    correctIndex: 0,
    rationale: 'G6PD deficiency impairs pentose-phosphate-pathway NADPH generation, reducing glutathione-dependent protection against oxidative injury in red cells.',
    pearl: 'The red cell has no mitochondria; its antioxidant survival strategy is unusually dependent on the pentose phosphate pathway.',
    nextStep: 'Clinical diagnosis and testing require appropriate timing and interpretation, especially around an acute haemolytic episode.',
  },
]

export function localDayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function stableHash(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function getDailyDuel(date = new Date()): ClinicalDuelCase {
  return CLINICAL_DUELS[stableHash(localDayKey(date)) % CLINICAL_DUELS.length]
}

export function getDuelById(id: string | null | undefined): ClinicalDuelCase | null {
  if (!id) return null
  return CLINICAL_DUELS.find((item) => item.id === id) ?? null
}

export type DuelProgress = {
  lastCompletedDay?: string
  streak: number
  bestSeconds?: number
}

const STORAGE_KEY = 'panacea:clinical-duel:v1'

export function readDuelProgress(): DuelProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { streak: 0 }
    const parsed = JSON.parse(raw) as Partial<DuelProgress>
    return {
      lastCompletedDay: typeof parsed.lastCompletedDay === 'string' ? parsed.lastCompletedDay : undefined,
      streak: Number.isFinite(parsed.streak) ? Math.max(0, Math.floor(parsed.streak as number)) : 0,
      bestSeconds: Number.isFinite(parsed.bestSeconds) ? Math.max(0, Math.floor(parsed.bestSeconds as number)) : undefined,
    }
  } catch {
    return { streak: 0 }
  }
}

function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

export function recordCorrectDailyDuel(seconds: number, today = localDayKey()): DuelProgress {
  const previous = readDuelProgress()
  if (previous.lastCompletedDay === today) return previous
  const consecutive = previous.lastCompletedDay && dayNumber(today) - dayNumber(previous.lastCompletedDay) === 1
  const next: DuelProgress = {
    lastCompletedDay: today,
    streak: consecutive ? previous.streak + 1 : 1,
    bestSeconds: previous.bestSeconds === undefined ? seconds : Math.min(previous.bestSeconds, seconds),
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* storage is optional */ }
  return next
}
