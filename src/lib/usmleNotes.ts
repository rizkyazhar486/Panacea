// ─────────────────────────────────────────────────────────────────────────────
// Isi tulisan tiap topik kurikulum.
//
// DIPISAH DARI SUSUNANNYA DENGAN SENGAJA. Susunan di usmleKurikulum.ts sudah
// lengkap; isi tulisan tumbuh satu topik demi satu topik. Pemisahan itu yang
// membuat layar dapat berkata jujur: topik yang belum ada di sini ditandai
// "outline only", bukan dibiarkan tampak seperti sudah jadi.
//
// ATURAN ISI — sama ketatnya dengan aturan sitasi:
//
//   · Yang ditulis hanya yang MAPAN dan tidak berubah tiap tahun: mekanisme,
//     rumus, urutan tindakan, dan pembeda diagnosis. Angka ambang yang sering
//     direvisi (sasaran tekanan darah, batas skrining) TIDAK ditulis sebagai
//     angka pasti — ia ditunjuk ke pedomannya, sebab angka yang basi di layar
//     lebih berbahaya daripada tidak ada angka sama sekali.
//   · Tiap "jebakan" adalah kesalahan yang benar-benar sering terjadi, bukan
//     hiasan.
//   · Tidak ada satu kalimat pun yang disalin dari bahan berbayar.
// ─────────────────────────────────────────────────────────────────────────────

export interface Catatan {
  /** Inti yang harus dikuasai, satu gagasan per butir. */
  poin: string[]
  /** Rumus atau urutan yang perlu dihafal persis, bila ada. */
  rumus?: string[]
  /** Kesalahan yang berulang — ditulis sebagai kesalahannya, bukan sebagai nasihat umum. */
  jebakan?: string[]
}

export const CATATAN: Record<string, Catatan> = {
  // ── Fisiologi ────────────────────────────────────────────────────────────
  'fi-ginjal': {
    poin: [
      'Work an acid–base problem in a fixed order: pH tells you the primary direction, PaCO₂ and HCO₃⁻ tell you which system caused it, then check whether compensation is what it should be.',
      'Compensation never fully corrects the pH and never overshoots. A pH that has crossed to the other side of normal means there are two primary disorders, not one with vigorous compensation.',
      'For a metabolic acidosis, calculate the anion gap before anything else — it splits the differential in two, and the split is what the question is testing.',
      'A raised anion gap acidosis is not the end of the workup: compare the rise in gap with the fall in bicarbonate. If they do not move together, a second metabolic disorder is hiding underneath.',
      'Normal anion gap acidosis is essentially gastrointestinal or renal bicarbonate loss. The urinary anion gap separates the two: negative points to the gut, positive points to the kidney.',
    ],
    rumus: [
      'Anion gap = Na⁺ − (Cl⁻ + HCO₃⁻); correct upward when albumin is low, because albumin carries most of the unmeasured anion.',
      'Winter formula, for expected PaCO₂ in metabolic acidosis: 1.5 × HCO₃⁻ + 8 (±2).',
      'Delta ratio = (measured AG − normal AG) ÷ (normal HCO₃⁻ − measured HCO₃⁻).',
    ],
    jebakan: [
      'Reading a normal PaCO₂ as reassuring in a patient who is tiring. In a severe metabolic acidosis a "normal" PaCO₂ means compensation is failing.',
      'Skipping the albumin correction, which hides a raised gap in exactly the malnourished and critically ill patients who most often have one.',
    ],
  },
  'fi-paru': {
    poin: [
      'There are five mechanisms of hypoxaemia, and the A–a gradient plus the response to oxygen distinguishes them almost completely.',
      'Hypoventilation and low inspired oxygen give a NORMAL A–a gradient. Shunt, V/Q mismatch and diffusion limitation give a RAISED one.',
      'Shunt is separated from V/Q mismatch by giving oxygen: V/Q mismatch improves substantially, true shunt barely moves.',
      'The gradient rises normally with age, so an "acceptable" absolute number in an elderly patient may still be abnormal for a young one.',
    ],
    rumus: [
      'PAO₂ = FiO₂ × (Patm − PH₂O) − PaCO₂ ÷ R. At sea level breathing air this is approximately 150 − PaCO₂ ÷ 0.8.',
      'A–a gradient = PAO₂ − PaO₂.',
    ],
    jebakan: [
      'Computing the gradient while the patient is on supplemental oxygen and comparing it with room-air reference values.',
    ],
  },

  // ── Patologi ─────────────────────────────────────────────────────────────
  'pa-cedera': {
    poin: [
      'Necrosis pattern is tied to organ and mechanism, and naming it usually names the cause: coagulative in most solid organ infarcts, liquefactive in brain and in abscess, caseous with granulomatous infection, fat necrosis around pancreas and breast trauma, fibrinoid in vessel walls with immune complex injury.',
      'Brain is the exception to coagulative necrosis, and that exception is asked repeatedly.',
      'Apoptosis is energy-requiring, individual-cell, and does not inflame. Necrosis is passive, affects sheets of cells, and does. That difference — inflammation or not — is the discriminator in the histology stem.',
      'Reversible injury is cellular swelling and blebbing; irreversible injury is defined by membrane failure and mitochondrial change, which is why enzymes appear in blood only once the injury is irreversible.',
    ],
    jebakan: [
      'Calling any dead tissue "gangrene" without distinguishing dry from wet — wet implies superimposed bacterial infection and a completely different management answer.',
    ],
  },
  'pa-hemodinamik': {
    poin: [
      'Virchow triad — stasis, endothelial injury, hypercoagulability — is not a list to recite but a way to read the social and surgical history in the stem.',
      'Shock types separate cleanly on three numbers: cardiac output, systemic vascular resistance, and filling pressure. Learn the direction of each in hypovolaemic, cardiogenic, obstructive and distributive shock, and most haemodynamic questions resolve immediately.',
      'Distributive shock is the one with high output and low resistance; the warm periphery early in sepsis follows from that and is not a paradox.',
      'Obstructive shock has high filling pressure with low output, like cardiogenic, but the heart is normal — the block is outside it (tamponade, tension pneumothorax, massive PE).',
    ],
    jebakan: [
      'Treating a tamponade or tension pneumothorax with fluids and vasopressors alone. The obstruction has to be relieved; everything else buys minutes.',
    ],
  },

  // ── Imunologi ────────────────────────────────────────────────────────────
  'im-hipersens': {
    poin: [
      'Type I is IgE and mast cell, immediate, and includes anaphylaxis and atopy.',
      'Type II is antibody directed at a fixed tissue antigen — the target is a cell or matrix.',
      'Type III is immune complex deposited from the circulation, so the disease appears wherever complexes lodge rather than where the antigen came from.',
      'Type IV is T cell mediated and takes a day or more, which is why the timing in the stem is the strongest clue.',
      'Timing alone often settles it: minutes points to I, hours to days with complexes to III, and more than 24 hours to IV.',
    ],
    jebakan: [
      'Assuming any drug reaction is type I. Delayed maculopapular drug eruptions and contact dermatitis are type IV, and adrenaline is not the answer.',
    ],
  },

  // ── Biokimia ─────────────────────────────────────────────────────────────
  'bi-asamamino': {
    poin: [
      'A urea cycle defect presents with hyperammonaemia and a RESPIRATORY ALKALOSIS, because ammonia stimulates the respiratory centre. An organic acidaemia presents with a metabolic acidosis. That single acid–base finding separates the two families.',
      'OTC deficiency is the X-linked one and is the commonest; it raises orotic acid without megaloblastic anaemia, which distinguishes it from orotic aciduria.',
      'Symptoms typically begin after feeding starts, because protein load is what unmasks the defect — the timing relative to the first feed is a deliberate clue.',
    ],
    jebakan: [
      'Missing hyperammonaemia in a newborn because the presentation is non-specific lethargy and poor feeding; ammonia must be measured deliberately, it is not on the routine panel.',
    ],
  },
  'bi-glikogen': {
    poin: [
      'Sort the glycogen storage diseases by which organ is affected and whether fasting causes hypoglycaemia — that pair identifies them faster than the enzyme name.',
      'Liver forms disturb blood glucose; muscle forms cause exercise intolerance and cramps with normal blood glucose.',
      'McArdle disease shows a flat lactate response to ischaemic exercise, because the muscle cannot mobilise its own glycogen — this is the classic functional test in the stem.',
    ],
  },

  // ── Genetika ─────────────────────────────────────────────────────────────
  'ge-pola': {
    poin: [
      'Autosomal dominant: appears in every generation, transmitted by either sex, and father-to-son transmission is possible.',
      'X-linked recessive: mostly males, transmitted through unaffected carrier mothers, and father-to-son transmission is IMPOSSIBLE — the single most useful exclusion on a pedigree.',
      'Mitochondrial: affected mothers pass it to all children; affected fathers pass it to none.',
      'Autosomal recessive: often a single generation, consanguinity raises the prior, and unaffected parents are obligate carriers.',
      'Variable expressivity means severity differs among affected people; incomplete penetrance means some carriers show nothing at all. They are different phenomena and are contrasted directly in questions.',
    ],
    jebakan: [
      'Reading a skipped generation as proof of recessive inheritance when incomplete penetrance in a dominant condition produces the same pedigree.',
    ],
  },

  // ── Biostatistik ─────────────────────────────────────────────────────────
  'bs-tes': {
    poin: [
      'Sensitivity and specificity are properties of the test and do not change with prevalence. Predictive values do, and that difference is the most frequently examined idea in the whole subject.',
      'A highly sensitive test is used to rule out when negative; a highly specific test is used to rule in when positive.',
      'As prevalence falls, positive predictive value falls with it — which is why screening a low-risk population generates false positives no matter how good the test is.',
      'Likelihood ratios are the prevalence-independent way to express the same information, which is why they travel between populations when predictive values cannot.',
    ],
    rumus: [
      'Sensitivity = TP ÷ (TP + FN). Specificity = TN ÷ (TN + FP).',
      'PPV = TP ÷ (TP + FP). NPV = TN ÷ (TN + FN).',
      'LR+ = sensitivity ÷ (1 − specificity). LR− = (1 − sensitivity) ÷ specificity.',
    ],
    jebakan: [
      'Building the 2×2 table with the columns and rows transposed. Write "disease" across the top and "test" down the side every single time, including on the exam.',
    ],
  },
  'bs-asosiasi': {
    poin: [
      'Relative risk needs a cohort design; odds ratio is what a case–control study can give you. Naming the design first prevents the commonest error in this topic.',
      'A confidence interval crossing 1 for a ratio measure, or crossing 0 for a difference, means the result is not statistically significant — you can answer most of these items without any calculation.',
      'Number needed to treat is the reciprocal of the absolute risk reduction, not of the relative one. Relative reductions look larger and are the standard way results are made to sound bigger.',
    ],
    rumus: [
      'ARR = risk(control) − risk(treated). NNT = 1 ÷ ARR.',
      'RR = risk(exposed) ÷ risk(unexposed). OR = (a×d) ÷ (b×c).',
    ],
  },

  // ── Step 2 CK ────────────────────────────────────────────────────────────
  's2-kritis': {
    poin: [
      'Sepsis is organ dysfunction caused by a dysregulated response to infection; septic shock adds vasopressor-requiring hypotension with a raised lactate despite fluids. The definitions decide the answer, so they have to be exact.',
      'The first hour is an ordered bundle: obtain cultures before antimicrobials, measure lactate, give broad-spectrum antimicrobials, resuscitate with fluid, and start vasopressors if the pressure does not respond.',
      'Cultures come before antibiotics — but only if that does not meaningfully delay them. When the two conflict, antimicrobials win.',
      'Source control is a separate action from antimicrobials, and a question describing an abscess or an infected line is asking about drainage or removal, not about a different drug.',
    ],
    jebakan: [
      'Waiting for a lactate or an imaging result before giving antimicrobials in a patient who already meets the definition.',
    ],
  },
  's2-neuro': {
    poin: [
      'In acute ischaemic stroke the first action is imaging to exclude haemorrhage — no reperfusion decision can be made before it.',
      'Thrombolysis and thrombectomy have separate and different time windows, and selected patients may be eligible for thrombectomy well beyond the thrombolysis window on the basis of imaging. Confirm current windows against the guideline; they have been extended more than once.',
      'Time of onset means the time the patient was last known well, not the time symptoms were noticed — a distinction the stem deliberately tests with wake-up strokes.',
      'In status epilepticus the sequence is fixed: benzodiazepine first and adequately dosed, then a second-line antiseizure drug, then anaesthesia. Under-dosing the benzodiazepine is the commonest real-world and exam error.',
    ],
    jebakan: [
      'Lowering blood pressure aggressively in acute ischaemic stroke. The thresholds differ for patients who will and will not receive thrombolysis, and they differ again for haemorrhage.',
    ],
  },
  's2-endokrin': {
    poin: [
      'DKA and HHS are separated by ketosis and acidosis, not by glucose level. HHS reaches far higher glucose with far greater fluid deficit.',
      'Management order in DKA is fluid first, then insulin, with potassium replaced before or alongside insulin — insulin drives potassium into cells and can precipitate a fatal arrhythmia in a patient whose total-body potassium is already depleted.',
      'If potassium is low at presentation, insulin is withheld until it is replaced. This is the discriminating question in the topic.',
      'Ketoacidosis resolves before hyperglycaemia does, so glucose alone is not the endpoint; the gap and ketones are.',
    ],
    jebakan: [
      'Stopping the insulin infusion when glucose normalises. Dextrose is added and the infusion continues until the acidosis clears.',
    ],
  },
  's2-periop': {
    poin: [
      'Postoperative fever by day narrows the cause sharply: immediate is usually inflammation from the surgery itself or a drug or transfusion reaction; the first days point to atelectasis and pneumonia; around days three to five to urinary infection; days five to seven to wound infection; and later to venous thrombosis or a collection.',
      'Wound infection appearing within the first day or two is a different and far more dangerous entity — a necrotising soft tissue infection — and it is a surgical emergency, not an antibiotic decision.',
    ],
    jebakan: [
      'Attributing every early fever to atelectasis and stopping there. The evidence linking atelectasis to fever is weak, and the reflex hides the diagnoses that matter.',
    ],
  },
  's2-hemonk': {
    poin: [
      'Start every anaemia from the MCV, then use the reticulocyte count to separate underproduction from loss or destruction. Those two numbers cut the differential more than any other pair.',
      'Microcytic anaemia is essentially iron deficiency, thalassaemia, anaemia of chronic disease and sideroblastic anaemia; iron studies separate them.',
      'Macrocytic anaemia splits into megaloblastic and non-megaloblastic; hypersegmented neutrophils point to the megaloblastic side.',
      'B12 deficiency causes neurological damage that folate replacement does not correct and can worsen, which is why B12 must be checked before treating with folate.',
    ],
    jebakan: [
      'Diagnosing iron deficiency and stopping. In an adult, iron deficiency is a symptom; the question is usually where the blood is being lost.',
    ],
  },
  's2-persalinan': {
    poin: [
      'The four causes of postpartum haemorrhage are tone, trauma, tissue and thrombin. Uterine atony is by far the commonest, so the first actions are uterine massage and uterotonics.',
      'Pre-eclampsia with severe features requires magnesium sulfate for seizure prophylaxis and antihypertensive treatment; magnesium is given to prevent eclampsia, not to lower blood pressure, and confusing the two is a standard distractor.',
      'Magnesium toxicity is monitored clinically by loss of deep tendon reflexes, which precedes respiratory depression; calcium gluconate is the antidote.',
      'Definitive treatment of pre-eclampsia is delivery, and every other measure is temporising.',
    ],
  },
  's2-zat': {
    poin: [
      'Alcohol and benzodiazepine withdrawal can kill; opioid withdrawal is intensely unpleasant but not usually life-threatening. That asymmetry decides urgency in the answer.',
      'Withdrawal timing is diagnostic: alcohol tremor and anxiety within hours, seizures within about a day, and delirium tremens usually after two to three days — later than most people expect, which is what the question exploits.',
      'Benzodiazepines are the treatment for alcohol withdrawal, given by symptom-triggered protocol; thiamine is given before glucose to avoid precipitating Wernicke encephalopathy.',
    ],
    jebakan: [
      'Giving intravenous glucose before thiamine in a malnourished patient. The order matters, and the exam asks it in that order for a reason.',
    ],
  },
  's2-skrining': {
    poin: [
      'Screening recommendations are graded, and the grade carries meaning: it states both the certainty of benefit and its size. A question sometimes asks for the grade rather than the action.',
      'Ages and intervals change as evidence accumulates. Learn which conditions are screened and on what principle, then confirm the current age and interval against the source rather than memorising a number that may already have moved.',
      'Screening requires that the disease has a detectable preclinical phase and that early treatment changes outcome. A test that finds disease earlier without changing outcome produces lead-time bias, not benefit.',
    ],
    jebakan: [
      'Treating improved survival from the time of diagnosis as evidence that screening works. Lead-time and length-time bias both produce exactly that appearance.',
    ],
  },

  // ── Step 3 ───────────────────────────────────────────────────────────────
  's3-ccs': {
    poin: [
      'CCS has no answer options. You order freely, advance the clock, and the case evolves — so both what you order and when you order it are scored.',
      'Unnecessary orders cost marks, and so does failing to move the clock. Ordering everything is a losing strategy here in a way it is not on multiple choice.',
      'Treat urgent items before completing the workup: in an unstable patient, oxygen, access and monitoring are ordered before the diagnostic sequence.',
      'Location matters. Moving the patient to the right setting — ward, ICU, or home — is itself a scored action.',
    ],
  },

  // ── ECFMG ────────────────────────────────────────────────────────────────
  'ec-verifikasi': {
    poin: [
      'Primary-source verification means ECFMG contacts the medical school directly. It takes months and is outside your control, which is why it should be started as early as eligibility allows.',
      'Verification runs in parallel with examinations. Candidates who wait until all exams are passed before starting it commonly lose a full application cycle.',
      'Requirements and accepted pathways are revised periodically. Anything read here should be confirmed against the current ECFMG information booklet before you act on it — this app deliberately does not restate rules that change.',
    ],
  },
}

/** Berapa topik yang benar-benar sudah ditulis. */
export function jumlahDitulis(): number {
  return Object.values(CATATAN).filter((c) => c.poin.length > 0).length
}

export function catatanUntuk(id: string): Catatan | undefined {
  const c = CATATAN[id]
  return c && c.poin.length > 0 ? c : undefined
}
