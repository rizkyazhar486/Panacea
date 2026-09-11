export type BridgeStageKey = 'anatomy' | 'physiology' | 'pathology' | 'signals' | 'diagnostics' | 'management' | 'evidence'

export type BridgeStage = {
  key: BridgeStageKey
  label: string
  question: string
  explanation: string
  route?: string
}

export type BridgeTopic = {
  id: string
  title: string
  aliases: string[]
  oneLiner: string
  stages: BridgeStage[]
}

export const BRIDGE_STAGE_GLOSSARY: Record<BridgeStageKey, string> = {
  anatomy: 'body structures',
  physiology: 'normal function',
  pathology: 'disease mechanism',
  signals: 'observable clues',
  diagnostics: 'tests & interpretation',
  management: 'care options',
  evidence: 'source verification',
}

const stage = (key: BridgeStageKey, label: string, question: string, explanation: string, route?: string): BridgeStage => ({
  key,
  label: `${label} · ${BRIDGE_STAGE_GLOSSARY[key]}`,
  question,
  explanation,
  route,
})

export const BRIDGE_TOPICS: BridgeTopic[] = [
  {
    id: 'hypertension', title: 'Hypertension', aliases: ['high blood pressure', 'htn', 'blood pressure'], oneLiner: 'Persistent elevation of arterial pressure is a hemodynamic state, not a single-organ disease.',
    stages: [
      stage('anatomy', 'Anatomy', 'Where does the pressure live?', 'Large arteries conduct pulsatile pressure; arterioles provide much of systemic vascular resistance, while kidneys regulate sodium and volume over longer time scales.', '/tubuh'),
      stage('physiology', 'Physiology', 'What sets arterial pressure?', 'A useful teaching identity is MAP ≈ CO × SVR. Cardiac output depends on heart rate and stroke volume; systemic vascular resistance reflects arteriolar tone. This is a model, not a bedside measurement equation.', '/tubuh'),
      stage('pathology', 'Pathology', 'How does chronic pressure cause harm?', 'Sustained pressure and vascular dysfunction increase mechanical stress, promote remodeling, and contribute to target-organ injury in brain, heart, kidney, retina and vessels.'),
      stage('signals', 'Clinical signals', 'What may be observed?', 'Hypertension is often asymptomatic. Severe symptoms such as neurologic deficit, chest pain, pulmonary edema or acute kidney injury change urgency because they may indicate acute target-organ injury.'),
      stage('diagnostics', 'Diagnostics', 'How is the state verified?', 'Repeat standardized measurements and, when appropriate, out-of-office blood-pressure monitoring help distinguish persistent hypertension from measurement context and variability.', '/clinical-hub'),
      stage('management', 'Management', 'What changes the system?', 'Management combines appropriate lifestyle measures, medication when indicated, adherence support and follow-up. Drug choice depends on comorbidity, pregnancy status, kidney function and other clinical context.', '/pharmacy'),
      stage('evidence', 'Evidence', 'What should be checked?', 'Confirm thresholds, targets and drug recommendations against current guideline/evidence sources for the person’s population and clinical context.', '/knowledge-bridge'),
    ],
  },
  {
    id: 'acs', title: 'Acute coronary syndrome', aliases: ['acs', 'myocardial infarction', 'heart attack', 'stemi', 'nstemi'], oneLiner: 'Acute myocardial ischemia becomes dangerous when coronary supply cannot meet myocardial oxygen demand, often because of plaque disruption and thrombosis.',
    stages: [
      stage('anatomy', 'Anatomy', 'Which structure is involved?', 'Epicardial coronary arteries supply myocardial territories. The clinical consequence of occlusion depends on vessel, location, collateral flow and duration.', '/tubuh'),
      stage('physiology', 'Physiology', 'What is the supply-demand problem?', 'Myocardial oxygen supply depends on coronary flow and arterial oxygen content; demand rises with heart rate, contractility and wall stress.'),
      stage('pathology', 'Pathology', 'What fails?', 'Plaque disruption with platelet activation and thrombosis can abruptly reduce coronary flow. Prolonged severe ischemia can progress from reversible dysfunction to myocardial necrosis.'),
      stage('signals', 'Clinical signals', 'What may be observed?', 'Chest pressure, dyspnea, diaphoresis, nausea or atypical symptoms can occur. A normal-looking patient or atypical pain does not by itself exclude ACS.'),
      stage('diagnostics', 'Diagnostics', 'How is it detected?', 'ECG, serial cardiac troponin and clinical probability are interpreted together; timing matters because biomarkers and ECG findings evolve.', '/clinical-hub'),
      stage('management', 'Management', 'What is the immediate objective?', 'Rapid risk stratification and guideline-directed antithrombotic/reperfusion strategy are time-sensitive and require clinical care. This educational bridge is not an emergency decision tool.', '/hospitals'),
      stage('evidence', 'Evidence', 'What should be verified?', 'Reperfusion windows, antithrombotic selection and secondary prevention should be checked against current cardiology guidance and patient-specific contraindications.', '/knowledge-bridge'),
    ],
  },
  {
    id: 'asthma', title: 'Asthma', aliases: ['wheeze', 'bronchospasm', 'reactive airway'], oneLiner: 'Variable airflow limitation emerges from airway inflammation, smooth-muscle constriction and mucus, with reversibility that can change over time.',
    stages: [
      stage('anatomy', 'Anatomy', 'Where is airflow limited?', 'Conducting airways—from larger bronchi to smaller bronchioles—change resistance as lumen radius, mucus and smooth-muscle tone change.', '/tubuh'),
      stage('physiology', 'Physiology', 'Why can small narrowing matter?', 'Airway resistance rises sharply as airway radius falls; forced expiratory flow is therefore sensitive to bronchoconstriction, especially in smaller airways.'),
      stage('pathology', 'Pathology', 'What creates variability?', 'Airway inflammation, hyperresponsiveness, bronchoconstriction and mucus can vary with triggers and treatment. Chronic disease can also produce remodeling.'),
      stage('signals', 'Clinical signals', 'What may be observed?', 'Episodic wheeze, cough, chest tightness and dyspnea that vary over time or with triggers are typical patterns, but differential diagnosis remains important.'),
      stage('diagnostics', 'Diagnostics', 'How is variability demonstrated?', 'Spirometry with bronchodilator response and other objective tests can demonstrate variable expiratory airflow limitation when clinically appropriate.', '/clinical-hub'),
      stage('management', 'Management', 'What changes outcomes?', 'Controller treatment, correct inhaler technique, trigger management and an action plan reduce risk. Acute severe symptoms require urgent assessment.', '/pharmacy'),
      stage('evidence', 'Evidence', 'What should be checked?', 'Use current asthma guidance for diagnosis, stepwise controller treatment and exacerbation management.', '/knowledge-bridge'),
    ],
  },
  {
    id: 't2dm', title: 'Type 2 diabetes', aliases: ['diabetes', 'type 2 diabetes', 't2dm', 'high glucose'], oneLiner: 'Type 2 diabetes reflects a dynamic mismatch between insulin action, beta-cell capacity, hepatic glucose output and whole-body energy metabolism.',
    stages: [
      stage('anatomy', 'Anatomy', 'Which organs coordinate glucose?', 'Pancreatic islets, liver, skeletal muscle, adipose tissue, gut, kidney and brain all participate in glucose and energy regulation.', '/tubuh'),
      stage('physiology', 'Physiology', 'What should insulin normally do?', 'Insulin suppresses hepatic glucose production and supports glucose uptake and storage in responsive tissues while interacting with glucagon and other signals.'),
      stage('pathology', 'Pathology', 'What changes?', 'Insulin resistance and progressive beta-cell dysfunction can allow fasting and post-prandial glucose to rise. Dyslipidemia, inflammation and vascular risk commonly coexist.'),
      stage('signals', 'Clinical signals', 'What may be observed?', 'Many people are asymptomatic. Polyuria, polydipsia, weight change, recurrent infections or complications may appear when hyperglycemia is substantial or prolonged.'),
      stage('diagnostics', 'Diagnostics', 'How is glycemia classified?', 'HbA1c, fasting plasma glucose, oral glucose tolerance testing or symptomatic random glucose are interpreted using validated diagnostic criteria and repeat confirmation when required.', '/lab-decoder'),
      stage('management', 'Management', 'What is the goal?', 'Management addresses glucose, cardiovascular and kidney risk, nutrition, activity, weight where relevant, medication, monitoring and complication prevention—not glucose alone.', '/pharmacy'),
      stage('evidence', 'Evidence', 'What should be checked?', 'Therapy selection depends on comorbidity and evolving evidence; current diabetes guidance and medicine labels should be verified.', '/knowledge-bridge'),
    ],
  },
  {
    id: 'anemia', title: 'Anemia', aliases: ['low hemoglobin', 'anaemia', 'low hb'], oneLiner: 'Anemia is reduced oxygen-carrying capacity from too few red cells, too little hemoglobin, or both; the mechanism determines the next test.',
    stages: [
      stage('anatomy', 'Anatomy', 'Where does the system begin?', 'Bone marrow produces erythrocytes; kidneys contribute erythropoietin signaling; spleen and reticuloendothelial tissues participate in red-cell clearance.', '/tubuh'),
      stage('physiology', 'Physiology', 'What does hemoglobin do?', 'Arterial oxygen content depends largely on hemoglobin-bound oxygen. A person can therefore have normal oxygen saturation while total oxygen-carrying capacity is reduced.'),
      stage('pathology', 'Pathology', 'Which mechanisms cause anemia?', 'A useful mechanism split is reduced production, blood loss, or increased destruction. Cell size and reticulocyte response help organize the differential.'),
      stage('signals', 'Clinical signals', 'What may be observed?', 'Fatigue, exertional dyspnea, tachycardia, pallor or dizziness may occur, but severity depends on rate of onset, degree of anemia and cardiopulmonary reserve.'),
      stage('diagnostics', 'Diagnostics', 'How is the mechanism narrowed?', 'CBC indices, reticulocyte count, smear and targeted iron, B12/folate, hemolysis or bleeding evaluation are selected based on context rather than ordered indiscriminately.', '/lab-decoder'),
      stage('management', 'Management', 'What should be treated?', 'Treat the cause. Iron is appropriate for iron deficiency, not for every anemia; transfusion decisions depend on severity, symptoms, bleeding and clinical context.', '/pharmacy'),
      stage('evidence', 'Evidence', 'What should be verified?', 'Diagnostic thresholds, replacement regimens and transfusion strategies vary by population and should be checked against current sources.', '/knowledge-bridge'),
    ],
  },
  {
    id: 'sepsis', title: 'Sepsis', aliases: ['septic', 'infection organ dysfunction'], oneLiner: 'Sepsis is life-threatening organ dysfunction caused by a dysregulated host response to infection; it is not simply “infection plus fever.”',
    stages: [
      stage('anatomy', 'Anatomy', 'Why can one infection affect many organs?', 'Circulation links the infectious source to systemic inflammatory, endothelial and metabolic responses that can disturb perfusion across multiple organs.', '/tubuh'),
      stage('physiology', 'Physiology', 'What loses stability?', 'Vascular tone, endothelial barrier function, microcirculatory flow, cardiac function, oxygen utilization and coagulation can all become abnormal.'),
      stage('pathology', 'Pathology', 'What makes sepsis dangerous?', 'Host-response dysregulation can produce hypotension, tissue hypoperfusion and organ dysfunction even when the original infection is localized.'),
      stage('signals', 'Clinical signals', 'What should raise concern?', 'Suspected infection with altered mental status, hypotension, respiratory distress, oliguria, mottling or other organ dysfunction requires urgent clinical assessment.'),
      stage('diagnostics', 'Diagnostics', 'What must be established?', 'Clinicians assess infection source, organ dysfunction, perfusion and relevant microbiology while avoiding delays in time-sensitive treatment.', '/clinical-hub'),
      stage('management', 'Management', 'What is time-sensitive?', 'Urgent antimicrobial treatment, source control, hemodynamic support and organ-specific care may be required. This page is educational and not a sepsis management protocol.', '/hospitals'),
      stage('evidence', 'Evidence', 'What should be checked?', 'Definitions and resuscitation recommendations should be verified against current sepsis guidance and local antimicrobial policy.', '/knowledge-bridge'),
    ],
  },
  {
    id: 'ckd', title: 'Chronic kidney disease', aliases: ['ckd', 'kidney disease', 'renal disease'], oneLiner: 'CKD is persistent kidney abnormality with health implications; filtration, albuminuria and cause together shape risk.',
    stages: [
      stage('anatomy', 'Anatomy', 'Which structures matter?', 'Nephrons integrate glomerular filtration with tubular reabsorption and secretion; renal vasculature and interstitium are equally important to function.', '/tubuh'),
      stage('physiology', 'Physiology', 'What do kidneys regulate?', 'Kidneys regulate volume, electrolytes, acid-base balance, waste excretion, erythropoietin signaling and vitamin D metabolism while participating in blood-pressure regulation.'),
      stage('pathology', 'Pathology', 'How does chronic injury progress?', 'Loss of functioning nephrons can increase stress on remaining nephrons. Fibrosis and ongoing cause-specific injury may progressively reduce function.'),
      stage('signals', 'Clinical signals', 'What may be observed?', 'Early CKD may be clinically silent. Later manifestations can involve volume, anemia, mineral-bone, electrolyte, acid-base and uremic complications.'),
      stage('diagnostics', 'Diagnostics', 'How is CKD characterized?', 'Estimated GFR, urine albumin, persistence over time and cause are interpreted together. A single creatinine value is not the entire diagnosis.', '/lab-decoder'),
      stage('management', 'Management', 'What slows risk?', 'Blood-pressure control, diabetes management when present, kidney-protective therapies where indicated, medication safety and cause-specific care are central.', '/pharmacy'),
      stage('evidence', 'Evidence', 'What should be checked?', 'Staging, referral thresholds and kidney-protective treatment recommendations should use current nephrology guidance.', '/knowledge-bridge'),
    ],
  },
]

export const BRIDGE_STAGE_ORDER: BridgeStageKey[] = ['anatomy', 'physiology', 'pathology', 'signals', 'diagnostics', 'management', 'evidence']

function normalizeBridgeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function containsWholePhrase(value: string, phrase: string) {
  return ` ${value} `.includes(` ${phrase} `)
}

export function resolveBridgeTopic(query: string): BridgeTopic | null {
  const q = normalizeBridgeSearchText(query)
  if (!q) return null

  return BRIDGE_TOPICS.find((topic) => {
    const title = normalizeBridgeSearchText(topic.title)
    const id = normalizeBridgeSearchText(topic.id)
    if (q === title || q === id) return true

    return topic.aliases.some((rawAlias) => {
      const alias = normalizeBridgeSearchText(rawAlias)
      return alias === q || containsWholePhrase(alias, q) || containsWholePhrase(q, alias)
    })
  }) ?? null
}

function canonicalStageLabel(label: string) {
  return label.split(' · ', 1)[0]
}

export function bridgeSummary(topic: BridgeTopic) {
  return [topic.title, topic.oneLiner, ...topic.stages.map((item) => `${canonicalStageLabel(item.label)}: ${item.explanation}`)].join('\n\n')
}
