export type SexualReproductiveDomain =
  | 'sexual-response'
  | 'endocrine-cycle'
  | 'fertilization'
  | 'pregnancy'
  | 'labour'
  | 'pregnancy-disorders'
  | 'sexual-dysfunction'
  | 'orientation-gender'

export interface PhysiologyStage {
  id: string
  label: string
  domain: SexualReproductiveDomain
  sequence: number
  mechanisms: string[]
  structures: string[]
  hormones: string[]
  clinicalBoundary?: string
}

export const HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY: PhysiologyStage[] = [
  {
    id: 'arousal', label: 'Arousal', domain: 'sexual-response', sequence: 1,
    mechanisms: ['Autonomic and somatic sexual-response pathways coordinate genital vasocongestion, lubrication and pelvic-floor activity.', 'Masturbation and partnered sexual activity can engage the same response physiology; neither is treated as a disease state.'],
    structures: ['brain', 'spinal cord', 'pelvic autonomic nerves', 'genital erectile tissue', 'pelvic floor'], hormones: ['dopamine', 'oxytocin', 'prolactin'],
  },
  {
    id: 'orgasm-ejaculation', label: 'Orgasm & ejaculation', domain: 'sexual-response', sequence: 2,
    mechanisms: ['Orgasm is a coordinated sensory, autonomic and somatic response and is not identical to ejaculation.', 'Emission and expulsion are distinct phases of ejaculation involving reproductive ducts, accessory glands, bladder-neck closure and rhythmic pelvic-floor contraction.'],
    structures: ['vas deferens', 'seminal vesicles', 'prostate', 'urethra', 'pelvic floor'], hormones: ['oxytocin', 'prolactin'],
  },
  {
    id: 'female-ejaculation-squirting', label: 'Female ejaculation / squirting', domain: 'sexual-response', sequence: 3,
    mechanisms: ['Female ejaculation and squirting are described separately from orgasm because they are variable phenomena and neither is required for normal sexual function.', 'Fluid expelled during sexual activity may have contributions from paraurethral glands and/or bladder-derived fluid; the model does not infer a single source for an individual.'],
    structures: ['urethra', 'paraurethral glands', 'bladder', 'pelvic floor'], hormones: [],
    clinicalBoundary: 'Educational mechanism only; no claim about an individual fluid source, volume or sexual response.'
  },
  {
    id: 'ovarian-cycle', label: 'Ovarian & menstrual endocrine cycle', domain: 'endocrine-cycle', sequence: 1,
    mechanisms: ['Hypothalamic-pituitary-ovarian signalling coordinates follicular development, ovulation, corpus-luteum function and endometrial cycling.', 'Hormonal concentrations vary continuously and between people; this model uses qualitative directionality only.'],
    structures: ['hypothalamus', 'pituitary', 'ovary', 'uterus', 'endometrium'], hormones: ['GnRH', 'FSH', 'LH', 'estradiol', 'progesterone', 'inhibin'],
  },
  {
    id: 'fertilization', label: 'Fertilization', domain: 'fertilization', sequence: 1,
    mechanisms: ['Sperm transport, capacitation, oocyte interaction and fusion precede the first embryonic cell divisions.', 'Fertilization normally occurs before uterine implantation; the model separates fertilization from implantation and pregnancy establishment.'],
    structures: ['vagina', 'cervix', 'uterus', 'uterine tube', 'ovary'], hormones: ['progesterone'],
  },
  {
    id: 'implantation', label: 'Implantation & early placentation', domain: 'fertilization', sequence: 2,
    mechanisms: ['The blastocyst reaches the uterine cavity and implantation establishes trophoblast-endometrial interaction.', 'Early trophoblast signalling supports corpus-luteum function while the placenta develops endocrine and exchange roles.'],
    structures: ['endometrium', 'uterus', 'placenta'], hormones: ['hCG', 'progesterone', 'estradiol'],
  },
  {
    id: 'pregnancy-adaptation', label: 'Maternal adaptation to pregnancy', domain: 'pregnancy', sequence: 1,
    mechanisms: ['Pregnancy produces coordinated cardiovascular, respiratory, renal, hematologic, metabolic and endocrine adaptation.', 'Placental physiology links maternal and fetal circulations without normally mixing them directly.'],
    structures: ['placenta', 'uterus', 'heart', 'lungs', 'kidneys', 'blood'], hormones: ['hCG', 'progesterone', 'estradiol', 'human placental lactogen', 'relaxin'],
  },
  {
    id: 'labour', label: 'Labour & delivery physiology', domain: 'labour', sequence: 1,
    mechanisms: ['Labour reflects coordinated uterine contractility, cervical remodelling, fetal descent and neuroendocrine feedback.', 'Oxytocin and prostaglandin signalling participate in a larger mechanical and biochemical system rather than acting as a single on/off trigger.'],
    structures: ['uterus', 'cervix', 'pelvic floor', 'bony pelvis', 'placenta'], hormones: ['oxytocin', 'prostaglandins', 'estrogen', 'progesterone'],
  },
  {
    id: 'hyperemesis', label: 'Hyperemesis gravidarum', domain: 'pregnancy-disorders', sequence: 1,
    mechanisms: ['Hyperemesis gravidarum is severe pregnancy-associated nausea/vomiting with clinically important consequences such as dehydration, electrolyte disturbance and nutritional compromise.', 'The simulator does not infer severity or treatment from symptoms entered by a user.'],
    structures: ['brainstem emetic networks', 'gastrointestinal tract', 'placenta'], hormones: ['hCG'],
    clinicalBoundary: 'Clinical assessment required; no diagnosis, fluid prescription or antiemetic recommendation is generated.'
  },
  {
    id: 'preeclampsia', label: 'Pre-eclampsia / eclampsia mechanism', domain: 'pregnancy-disorders', sequence: 2,
    mechanisms: ['Pre-eclampsia is represented as a placenta-associated multisystem disorder involving abnormal placental development, endothelial dysfunction and maternal organ effects.', 'Eclampsia denotes seizures occurring in the setting of the hypertensive pregnancy disorder; it is not modeled as a simple blood-pressure threshold animation.'],
    structures: ['placenta', 'maternal vasculature', 'kidneys', 'liver', 'brain'], hormones: ['angiogenic and anti-angiogenic signalling'],
    clinicalBoundary: 'Educational pathophysiology only; no patient risk score, diagnostic threshold or management algorithm.'
  },
  {
    id: 'sexual-dysfunction', label: 'Sexual dysfunction', domain: 'sexual-dysfunction', sequence: 1,
    mechanisms: ['Sexual dysfunction can involve desire, arousal, erection, ejaculation, orgasm, pain, pelvic-floor function, medications, endocrine factors, neurologic disease, relationship context and psychological factors.', 'The model avoids assuming a single cause and separates symptoms from identity or orientation.'],
    structures: ['brain', 'spinal cord', 'pelvic nerves', 'genital tissue', 'pelvic floor'], hormones: ['testosterone', 'estradiol', 'prolactin', 'thyroid hormones'],
  },
  {
    id: 'vaginismus', label: 'Genito-pelvic pain / penetration difficulty', domain: 'sexual-dysfunction', sequence: 2,
    mechanisms: ['Vaginismus-type presentations are represented through involuntary pelvic-floor guarding, pain anticipation, sensory processing and contextual factors rather than as a structural defect of the vagina.', 'Pain and penetration difficulty require individualized assessment; consent and comfort remain central.'],
    structures: ['pelvic floor', 'vulva', 'vagina', 'pelvic nerves'], hormones: [],
  },
  {
    id: 'orientation', label: 'Sexual orientation', domain: 'orientation-gender', sequence: 1,
    mechanisms: ['Heterosexual, gay/lesbian, bisexual and other sexual orientations describe patterns of attraction and are not diseases or sexual dysfunctions.', 'The atlas does not attempt to localize sexual orientation to one hormone, gene, brain region or anatomical structure.'],
    structures: [], hormones: [],
    clinicalBoundary: 'Non-pathologizing identity context; no diagnosis, conversion target or causal localization.'
  },
  {
    id: 'gender-identity', label: 'Gender identity & transgender health', domain: 'orientation-gender', sequence: 2,
    mechanisms: ['Transgender and gender-diverse identities are not modeled as diseases. Clinically relevant distress, health needs and gender-affirming care are distinct from the identity itself.', 'Cross-dressing or gender expression is not treated as pathology by default; older pathologizing terms such as “transvestism” are retained only as historical terminology when needed for literature interpretation.'],
    structures: [], hormones: [],
    clinicalBoundary: 'Identity is not a pathology; no attempt is made to infer gender identity from anatomy, hormones, genes or behavior.'
  },
]

export function stagesForDomain(domain: SexualReproductiveDomain) {
  return HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY.filter((stage) => stage.domain === domain).sort((a, b) => a.sequence - b.sequence)
}

export function stageAt(domain: SexualReproductiveDomain, normalizedProgress: number) {
  const stages = stagesForDomain(domain)
  if (!stages.length) return null
  const x = Math.min(1, Math.max(0, normalizedProgress))
  return stages[Math.min(stages.length - 1, Math.floor(x * stages.length))]
}
