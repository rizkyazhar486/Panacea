// Cardiovascular Prometheus slice. Authored from the references cited in the shared concept graph; draft, not educator-reviewed.
import { LEARNING_SCHEMA_VERSION, type AnswerOption, type LearningCatalog, type Question } from '../model/types.ts'

const OS = ['ref:openstax-ap2e'], BERS = ['ref:bers-2002'], BOTH = ['ref:openstax-ap2e', 'ref:bers-2002']
const o = (id: string, text: string, rationale: string): AnswerOption => ({ id, text, rationale })

const QUESTIONS: Question[] = [
  { id: 'q:sarcomere_unit', lessonId: 'les:cardiomyocyte_structure', conceptId: 'pcg:sarcomere', objectiveIndex: 0, referenceIds: OS, correctOptionId: 'a',
    stem: 'Which structure is the repeating contractile unit of a cardiomyocyte myofibril?',
    options: [o('a', 'Sarcomere', 'Correct: overlapping thin and thick filaments shorten within each sarcomere.'), o('b', 'Sarcoplasmic reticulum', 'This stores and releases calcium; it is not the contractile unit.'), o('c', 'Mitochondrion', 'It supplies ATP but does not generate filament sliding itself.'), o('d', 'T-tubule', 'It conducts the action potential inward; it is not contractile.')] },
  { id: 'q:sr_role', lessonId: 'les:cardiomyocyte_structure', conceptId: 'pcg:sarcoplasmic_reticulum', objectiveIndex: 1, referenceIds: BOTH, correctOptionId: 'b',
    stem: 'Which cardiomyocyte structure is the main intracellular calcium store used for contraction?',
    options: [o('a', 'Sarcomere', 'The sarcomere uses calcium; it is not the store.'), o('b', 'Sarcoplasmic reticulum', 'Correct: a specialised endoplasmic reticulum that stores and releases Ca²⁺.'), o('c', 'Mitochondrion', 'Mitochondria produce ATP; they are not the principal calcium store for contraction.'), o('d', 'Intercalated disc', 'It joins cells mechanically and electrically; it does not store calcium.')] },
  { id: 'q:cicr_trigger', lessonId: 'les:ec_coupling', conceptId: 'pcg:excitation_contraction_coupling', objectiveIndex: 0, referenceIds: BERS, correctOptionId: 'c',
    stem: 'In calcium-induced calcium release, what happens immediately after L-type calcium channels open?',
    options: [o('a', 'SERCA2a releases stored calcium', 'SERCA2a pumps calcium into the SR; it does not release it.'), o('b', 'Troponin C releases calcium to the sarcoplasmic reticulum', 'Troponin C binds calcium on the thin filament; it is not a release channel.'), o('c', 'Trigger calcium opens ryanodine receptor 2 on the sarcoplasmic reticulum', 'Correct: small Ca²⁺ influx triggers larger release through RyR2.'), o('d', 'Myosin directly opens the L-type channel', 'Myosin is a thick-filament motor and does not gate membrane channels.')] },
  { id: 'q:relaxation_pump', lessonId: 'les:ec_coupling', conceptId: 'pcg:serca2a', objectiveIndex: 1, referenceIds: BERS, correctOptionId: 'd',
    stem: 'Which protein uses ATP to return cytosolic calcium to the sarcoplasmic reticulum so the cell can relax?',
    options: [o('a', 'Ryanodine receptor 2', 'RyR2 releases calcium; it opens rather than restores stores.'), o('b', 'L-type calcium channel', 'It admits calcium from outside the cell.'), o('c', 'Troponin C', 'It binds calcium and does not pump it.'), o('d', 'SERCA2a', 'Correct: the ATP-driven pump that refills the SR and lowers cytosolic Ca²⁺.')] },
  { id: 'q:troponin_binding', lessonId: 'les:ec_coupling', conceptId: 'pcg:troponin_c', objectiveIndex: 0, referenceIds: BOTH, correctOptionId: 'a',
    stem: 'Calcium binding to which protein permits actin–myosin interaction on the thin filament?',
    options: [o('a', 'Troponin C', 'Correct: Ca²⁺ binding shifts the regulatory complex and exposes myosin-binding sites.'), o('b', 'RyR2', 'RyR2 is a release channel in the SR membrane.'), o('c', 'SERCA2a', 'SERCA2a is a pump in the SR membrane.'), o('d', 'L-type calcium channel', 'It is a sarcolemmal channel, not a thin-filament regulator.')] },
  { id: 'q:co_calc', lessonId: 'les:cardiac_output', conceptId: 'pcg:left_ventricle', objectiveIndex: 0, referenceIds: OS, correctOptionId: 'a', modelCheck: { hrBpm: 80, svMl: 60, expectedCoLMin: 4.8 },
    stem: 'A synthetic example has HR 80 beats/min and SV 60 mL/beat. What is cardiac output?',
    options: [o('a', '4.8 L/min', 'Correct: 80 × 60 = 4800 mL/min = 4.8 L/min.'), o('b', '4800 L/min', 'Unit error: 4800 is in mL/min; divide by 1000.'), o('c', '0.48 L/min', 'Divided by 10000; mL → L needs a factor of 1000.'), o('d', '1.33 L/min', 'This divides HR by SV; CO is their product.')] },
  { id: 'q:co_single_value', lessonId: 'les:cardiac_output', conceptId: 'pcg:left_ventricle', objectiveIndex: 1, referenceIds: OS, correctOptionId: 'c',
    stem: 'A synthetic calculation gives CO 3.0 L/min. What can be concluded from that number alone?',
    options: [o('a', 'The person has heart failure', 'A single calculated value cannot establish a diagnosis.'), o('b', 'The person is healthy', 'Normality also cannot be concluded without context such as body size, activity and clinical state.'), o('c', 'Nothing diagnostic; interpretation needs body size, context and measurement quality', 'Correct: this educational model does not diagnose, and cardiac index is unknown without body surface area.'), o('d', 'Stroke volume must be zero', 'Stroke volume is not zero when CO is non-zero.')] },
]

export const CARDIOVASCULAR_CATALOG: LearningCatalog = {
  schemaVersion: LEARNING_SCHEMA_VERSION, version: '2026.11.01-cv1', questions: QUESTIONS,
  lessons: [
    { id: 'les:cardiac_output', title: 'Cardiac output from heart rate and stroke volume', conceptIds: ['pcg:left_ventricle'], prerequisites: [], referenceIds: OS, difficulty: 1, contentStatus: 'draft_unreviewed',
      objectives: ['Compute CO = HR × SV / 1000 with correct units.', 'State why one calculated value is not a diagnosis.'], questionIds: ['q:co_calc', 'q:co_single_value'] },
    { id: 'les:cardiomyocyte_structure', title: 'Cardiomyocyte structure', conceptIds: ['pcg:cardiomyocyte', 'pcg:sarcomere', 'pcg:sarcoplasmic_reticulum'], prerequisites: [], referenceIds: OS, difficulty: 1, contentStatus: 'draft_unreviewed',
      objectives: ['Identify the sarcomere as the contractile unit.', 'Identify the sarcoplasmic reticulum as the calcium store.'], questionIds: ['q:sarcomere_unit', 'q:sr_role'] },
    { id: 'les:ec_coupling', title: 'Excitation–contraction coupling', conceptIds: ['pcg:excitation_contraction_coupling', 'pcg:serca2a', 'pcg:troponin_c'], prerequisites: ['les:cardiomyocyte_structure'], referenceIds: BOTH, difficulty: 2, contentStatus: 'draft_unreviewed',
      objectives: ['Order the steps of calcium-induced calcium release.', 'Explain why relaxation needs ATP.'], questionIds: ['q:cicr_trigger', 'q:troponin_binding', 'q:relaxation_pump'] },
  ],
}
