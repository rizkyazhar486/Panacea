import { useMemo, useState } from 'react'
import { HraContextBridge } from './HraContextBridge'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'

type AnatomyDomain = {
  key: string
  icon: string
  label: string
  region: string
  level: 'system' | 'regional' | 'special-sense'
  terms: string[]
  structures: string[]
  physiology: string[]
}

type Props = {
  onOpenPhysiology?: () => void
}

const DOMAINS: AnatomyDomain[] = [
  {
    key: 'integument', icon: '🧍', label: 'Skin & integument', region: 'Whole body', level: 'system',
    terms: ['skin', 'dermis', 'epidermis'],
    structures: ['epidermis', 'dermis', 'subcutaneous tissue', 'hair follicle', 'sebaceous gland', 'sweat gland', 'cutaneous vessels', 'cutaneous sensory endings'],
    physiology: ['barrier', 'thermoregulation', 'sensation', 'vitamin D context'],
  },
  {
    key: 'axial-skeleton', icon: '🦴', label: 'Axial skeleton', region: 'Head · neck · trunk', level: 'regional',
    terms: ['skull', 'vertebral column', 'rib', 'sternum'],
    structures: ['cranium', 'mandible', 'cervical vertebrae', 'thoracic vertebrae', 'lumbar vertebrae', 'sacrum', 'ribs', 'sternum'],
    physiology: ['support', 'protection', 'respiratory mechanics', 'marrow context'],
  },
  {
    key: 'appendicular-skeleton', icon: '🦴', label: 'Appendicular skeleton', region: 'Upper & lower limbs', level: 'regional',
    terms: ['clavicle', 'scapula', 'humerus', 'radius', 'ulna', 'pelvis', 'femur', 'tibia', 'fibula'],
    structures: ['clavicle', 'scapula', 'humerus', 'radius', 'ulna', 'carpal/metacarpal/phalanges', 'pelvic girdle', 'femur', 'patella', 'tibia', 'fibula', 'tarsal/metatarsal/phalanges'],
    physiology: ['load transfer', 'lever arms', 'gait', 'bone remodeling'],
  },
  {
    key: 'joints', icon: '🔗', label: 'Joints & ligaments', region: 'Whole body', level: 'system',
    terms: ['joint', 'ligament', 'articular cartilage', 'tendon'],
    structures: ['joint capsule', 'articular cartilage', 'synovium', 'meniscus/labrum context', 'major ligaments', 'tendons', 'entheses', 'bursae'],
    physiology: ['stability', 'range of motion', 'load transmission', 'proprioception'],
  },
  {
    key: 'muscular', icon: '💪', label: 'Muscular system', region: 'Whole body', level: 'system',
    terms: ['skeletal muscle', 'muscle', 'tendon'],
    structures: ['axial muscles', 'shoulder girdle', 'upper limb muscles', 'thoracic/abdominal wall', 'pelvic muscles', 'gluteal group', 'thigh muscles', 'leg muscles'],
    physiology: ['motor-unit recruitment', 'excitation-contraction coupling', 'force', 'fatigue'],
  },
  {
    key: 'heart', icon: '❤️', label: 'Heart', region: 'Thorax', level: 'system',
    terms: ['heart', 'left ventricle', 'right ventricle', 'atrium', 'aorta'],
    structures: ['right atrium', 'tricuspid valve', 'right ventricle', 'pulmonary valve', 'pulmonary trunk', 'left atrium', 'mitral valve', 'left ventricle', 'aortic valve', 'coronary arteries', 'conduction-system context'],
    physiology: ['cardiac cycle', 'HR', 'SV', 'CO', 'EF', 'pressure-volume relations'],
  },
  {
    key: 'vasculature', icon: '🩸', label: 'Vascular system', region: 'Whole body', level: 'system',
    terms: ['artery', 'vein', 'aorta', 'vena cava', 'capillary'],
    structures: ['aorta', 'carotid arteries', 'subclavian/axillary arteries', 'mesenteric arteries', 'renal arteries', 'iliac/femoral arteries', 'vena cava', 'portal venous system', 'major superficial/deep veins', 'microcirculation context'],
    physiology: ['vascular resistance', 'venous return', 'perfusion', 'microvascular exchange'],
  },
  {
    key: 'respiratory', icon: '🫁', label: 'Respiratory system', region: 'Thorax · airway', level: 'system',
    terms: ['lung', 'trachea', 'bronchus', 'diaphragm'],
    structures: ['laryngeal airway', 'trachea', 'main bronchi', 'lobar bronchi', 'right lung lobes', 'left lung lobes', 'pleura', 'diaphragm', 'alveolar unit context'],
    physiology: ['ventilation', 'perfusion', 'diffusion', 'V/Q', 'spirometry'],
  },
  {
    key: 'cns', icon: '🧠', label: 'Central nervous system', region: 'Head · spine', level: 'system',
    terms: ['brain', 'cerebrum', 'cerebellum', 'brainstem', 'spinal cord'],
    structures: ['cerebral hemispheres', 'cortex', 'basal ganglia context', 'thalamus', 'hypothalamus', 'midbrain', 'pons', 'medulla', 'cerebellum', 'spinal cord', 'meninges context'],
    physiology: ['sensory integration', 'motor control', 'autonomic regulation', 'neuroendocrine control'],
  },
  {
    key: 'pns', icon: '⚡', label: 'Peripheral & autonomic nerves', region: 'Whole body', level: 'system',
    terms: ['peripheral nerve', 'spinal nerve', 'sympathetic', 'parasympathetic'],
    structures: ['cranial nerves context', 'spinal roots', 'brachial plexus', 'lumbosacral plexus', 'major upper-limb nerves', 'major lower-limb nerves', 'sympathetic chain context', 'parasympathetic pathways context'],
    physiology: ['UMN→LMN bridge', 'sensory afferents', 'autonomic output', 'neuromuscular junction'],
  },
  {
    key: 'eye', icon: '👁️', label: 'Eye & visual pathway', region: 'Orbit · brain', level: 'special-sense',
    terms: ['eye', 'retina', 'optic nerve', 'lens', 'cornea'],
    structures: ['cornea', 'anterior chamber', 'iris', 'lens', 'vitreous', 'retina', 'macula context', 'optic nerve', 'optic chiasm', 'visual pathway context'],
    physiology: ['optics', 'accommodation', 'phototransduction', 'pupillary reflex', 'visual pathway'],
  },
  {
    key: 'ear', icon: '🦻', label: 'Ear & auditory pathway', region: 'Temporal bone · brain', level: 'special-sense',
    terms: ['ear', 'cochlea', 'tympanic membrane', 'auditory ossicle'],
    structures: ['external auditory canal', 'tympanic membrane', 'malleus', 'incus', 'stapes', 'cochlea', 'vestibular apparatus', 'CN VIII context', 'auditory pathway context'],
    physiology: ['sound conduction', 'cochlear traveling wave', 'hair-cell transduction', 'vestibular sensing'],
  },
  {
    key: 'nose', icon: '👃', label: 'Nose & olfaction', region: 'Face · skull base', level: 'special-sense',
    terms: ['nose', 'nasal cavity', 'olfactory bulb', 'paranasal sinus'],
    structures: ['nasal vestibule', 'septum', 'turbinates', 'nasal mucosa', 'paranasal sinuses', 'olfactory epithelium context', 'olfactory bulb', 'olfactory pathway context'],
    physiology: ['air conditioning', 'mucociliary function', 'olfaction', 'nasal resistance'],
  },
  {
    key: 'voice', icon: '🗣️', label: 'Larynx & voice', region: 'Neck · upper airway', level: 'special-sense',
    terms: ['larynx', 'vocal fold', 'pharynx', 'hyoid'],
    structures: ['hyoid', 'thyroid cartilage', 'cricoid cartilage', 'arytenoid context', 'vocal folds', 'epiglottis', 'pharynx', 'recurrent laryngeal nerve context'],
    physiology: ['phonation', 'airflow', 'vocal-fold vibration', 'resonance', 'swallow-airway protection'],
  },
  {
    key: 'gi', icon: '🫃', label: 'Gastrointestinal tract', region: 'Abdomen · pelvis', level: 'system',
    terms: ['esophagus', 'stomach', 'small intestine', 'colon', 'rectum'],
    structures: ['esophagus', 'stomach', 'duodenum', 'jejunum', 'ileum', 'cecum/appendix', 'ascending/transverse/descending/sigmoid colon', 'rectum', 'anal canal'],
    physiology: ['motility', 'secretion', 'digestion', 'absorption', 'gut-brain signaling context'],
  },
  {
    key: 'hepatobiliary', icon: '🟤', label: 'Liver · biliary · pancreas', region: 'Upper abdomen', level: 'system',
    terms: ['liver', 'gallbladder', 'bile duct', 'pancreas'],
    structures: ['liver lobes', 'portal vein context', 'hepatic artery context', 'hepatic veins', 'gallbladder', 'biliary tree', 'pancreas head/body/tail', 'pancreatic duct context'],
    physiology: ['carbohydrate metabolism', 'protein/nitrogen metabolism', 'lipid handling', 'bile', 'exocrine pancreas'],
  },
  {
    key: 'renal', icon: '🫘', label: 'Renal & urinary system', region: 'Retroperitoneum · pelvis', level: 'system',
    terms: ['kidney', 'ureter', 'urinary bladder', 'urethra'],
    structures: ['renal cortex', 'renal medulla', 'renal pelvis', 'renal vessels', 'nephron context', 'ureters', 'urinary bladder', 'urethra'],
    physiology: ['GFR', 'tubular transport', 'ADH', 'RAAS', 'electrolytes', 'acid-base'],
  },
  {
    key: 'endocrine', icon: '🔬', label: 'Endocrine system', region: 'Multi-organ', level: 'system',
    terms: ['pituitary gland', 'thyroid gland', 'adrenal gland', 'pancreas'],
    structures: ['hypothalamus context', 'pituitary', 'thyroid', 'parathyroid context', 'adrenal glands', 'pancreatic islets context', 'gonadal endocrine tissue context'],
    physiology: ['HPA/HPT/HPG axes', 'ADH', 'aldosterone', 'insulin/glucagon', 'calcium regulation'],
  },
  {
    key: 'immune', icon: '🛡️', label: 'Immune & lymphatic system', region: 'Whole body', level: 'system',
    terms: ['spleen', 'thymus', 'lymph node', 'lymphatic vessel'],
    structures: ['bone-marrow context', 'thymus', 'spleen', 'lymph nodes', 'lymphatic vessels', 'tonsillar tissue context', 'mucosal immune tissue context'],
    physiology: ['innate immunity', 'antigen presentation', 'T/B-cell responses', 'allergy', 'immune memory'],
  },
  {
    key: 'hematologic', icon: '🩸', label: 'Blood & hematopoietic anatomy', region: 'Vascular · marrow · spleen', level: 'system',
    terms: ['bone marrow', 'spleen', 'blood vessel'],
    structures: ['marrow spaces', 'spleen', 'vascular compartment', 'erythrocyte context', 'platelet context', 'leukocyte context'],
    physiology: ['hematopoiesis', 'oxygen carriage', 'hemostasis', 'immune-cell trafficking'],
  },
  {
    key: 'reproductive-female', icon: '♀', label: 'Female reproductive anatomy', region: 'Pelvis · breast', level: 'system',
    terms: ['uterus', 'ovary', 'fallopian tube', 'vagina', 'breast'],
    structures: ['ovaries', 'uterine tubes', 'uterus', 'cervix', 'vagina', 'external genital context', 'breast/mammary gland context'],
    physiology: ['ovarian cycle', 'endometrium', 'fertilization', 'pregnancy context', 'lactation'],
  },
  {
    key: 'reproductive-male', icon: '♂', label: 'Male reproductive anatomy', region: 'Pelvis · perineum', level: 'system',
    terms: ['testis', 'epididymis', 'prostate', 'seminal vesicle', 'penis'],
    structures: ['testes', 'epididymides', 'vas deferens', 'seminal vesicles', 'prostate', 'urethra', 'penile structures context'],
    physiology: ['spermatogenesis', 'androgen axis', 'ejaculation', 'erectile physiology'],
  },
  {
    key: 'regional-head-neck', icon: '🧑', label: 'Head & neck regional anatomy', region: 'Head · neck', level: 'regional',
    terms: ['head', 'neck', 'pharynx', 'carotid artery', 'thyroid gland'],
    structures: ['craniofacial skeleton', 'deep neck spaces context', 'pharynx/larynx', 'carotid sheath context', 'major cranial nerves context', 'thyroid', 'salivary glands context'],
    physiology: ['airway', 'swallowing', 'speech', 'cranial neurovascular function'],
  },
  {
    key: 'regional-thorax', icon: '🫀', label: 'Thoracic regional anatomy', region: 'Thorax', level: 'regional',
    terms: ['thorax', 'heart', 'lung', 'mediastinum'],
    structures: ['thoracic wall', 'pleural cavities', 'lungs', 'mediastinum', 'heart/pericardium', 'great vessels', 'esophagus', 'diaphragm'],
    physiology: ['cardiopulmonary coupling', 'ventilation mechanics', 'venous return'],
  },
  {
    key: 'regional-abdomen-pelvis', icon: '🧍', label: 'Abdomen & pelvis regional anatomy', region: 'Abdomen · pelvis', level: 'regional',
    terms: ['abdomen', 'pelvis', 'liver', 'kidney', 'intestine'],
    structures: ['abdominal wall', 'peritoneal context', 'solid organs', 'GI tract', 'retroperitoneum', 'pelvic viscera', 'major abdominal vessels', 'pelvic floor context'],
    physiology: ['digestion', 'hepatic metabolism', 'renal regulation', 'reproduction'],
  },
]

const LEVEL_LABEL: Record<AnatomyDomain['level'], string> = {
  system: 'System anatomy',
  regional: 'Regional anatomy',
  'special-sense': 'Special senses',
}

export function HumanAnatomyMasterAtlas({ onOpenPhysiology }: Props) {
  const [selectedKey, setSelectedKey] = useState('heart')
  const [query, setQuery] = useState('')
  const selected = useMemo(() => DOMAINS.find((item) => item.key === selectedKey) ?? DOMAINS[0], [selectedKey])
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DOMAINS
    return DOMAINS.filter((item) => [item.label, item.region, ...item.terms, ...item.structures].join(' ').toLowerCase().includes(q))
  }, [query])

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#080b10]">
        <header className="bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,.12),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(139,92,246,.11),transparent_34%)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-700 dark:text-cyan-300">Human anatomy master atlas</div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950 dark:text-white">Anatomy first. Physiology attached to the structure it belongs to.</h2>
              <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">A single navigation layer for whole-body systems, regional anatomy and special senses. The 3D panel resolves HuBMAP Human Reference Atlas source geometry; structures that cannot be resolved remain labelled rather than being replaced with toy primitives.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">{DOMAINS.length} core domains</span>
              {onOpenPhysiology && <button onClick={onOpenPhysiology} className="rounded-full bg-neutral-950 px-4 py-2 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">Open physiology →</button>}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search structure, region or system…" className="min-h-11 rounded-2xl border border-neutral-200 bg-white/80 px-4 text-[11px] font-semibold text-neutral-800 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/[.05] dark:text-white" />
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wide text-neutral-400">
              <span className="rounded-full border border-neutral-200 px-2.5 py-2 dark:border-white/10">HRA source</span>
              <span className="rounded-full border border-neutral-200 px-2.5 py-2 dark:border-white/10">System + regional</span>
              <span className="rounded-full border border-neutral-200 px-2.5 py-2 dark:border-white/10">Physiology bridge</span>
            </div>
          </div>
        </header>

        <div className="border-t border-neutral-200 p-3 dark:border-white/10 sm:p-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {visible.map((item) => (
              <button key={item.key} onClick={() => setSelectedKey(item.key)} className={`min-w-[168px] shrink-0 rounded-2xl border p-3 text-left transition ${selected.key === item.key ? 'border-cyan-400 bg-cyan-50 shadow-sm dark:border-cyan-300/35 dark:bg-cyan-300/10' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.025]'}`}>
                <div className="flex items-center gap-2"><span className="text-base">{item.icon}</span><span className="text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</span></div>
                <div className="mt-1 text-[8px] font-black uppercase tracking-wide text-neutral-400">{LEVEL_LABEL[item.level]}</div>
                <div className="mt-1 text-[9px] text-neutral-500 dark:text-neutral-400">{item.region}</div>
              </button>
            ))}
          </div>
          {!visible.length && <div className="rounded-2xl border border-dashed border-neutral-200 p-4 text-center text-[10px] text-neutral-500 dark:border-white/10">No curated domain matches this search.</div>}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(310px,.75fr)]">
        <div className="space-y-4">
          <HraResolvedAnatomyViewer
            title={`${selected.label} · resolved source anatomy`}
            description={`Selected ${LEVEL_LABEL[selected.level].toLowerCase()} · ${selected.region}. Source geometry is kept static and provenance-aware.`}
            terms={selected.terms}
            maxResults={16}
          />
          <HraContextBridge title={`${selected.label} · source structure matches`} terms={selected.terms} maxResults={14} />
        </div>

        <aside className="space-y-3">
          <section className="rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Must-identify anatomy</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{selected.icon} {selected.label}</h3>
            <p className="mt-1 text-[9px] font-semibold text-neutral-400">{selected.region}</p>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
              {selected.structures.map((structure, index) => (
                <div key={structure} className="flex items-start gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-white/[.07] dark:bg-white/[.025]">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-neutral-950 text-[7px] font-black text-white dark:bg-white dark:text-neutral-950">{index + 1}</span>
                  <span className="text-[9px] font-semibold leading-relaxed text-neutral-650 dark:text-neutral-300">{structure}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-300/20 dark:bg-violet-300/[.06]">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Physiology bridge</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.physiology.map((item) => <span key={item} className="rounded-full border border-violet-200 bg-white/70 px-2.5 py-1.5 text-[8px] font-bold text-violet-900 dark:border-violet-300/20 dark:bg-white/[.04] dark:text-violet-200">{item}</span>)}
            </div>
            <p className="mt-3 text-[9px] leading-relaxed text-violet-950/65 dark:text-violet-100/60">The anatomy source remains unchanged when physiology or pathology is explored. Function is layered on top through measured data, equations and mechanistic micro-3D rather than by deforming the source organ.</p>
            {onOpenPhysiology && <button onClick={onOpenPhysiology} className="mt-3 w-full rounded-2xl bg-violet-600 px-3 py-2.5 text-[9px] font-black text-white">Continue from anatomy to physiology →</button>}
          </section>
        </aside>
      </div>

      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">Coverage map</div>
            <h3 className="mt-1 text-base font-black text-neutral-950 dark:text-white">Core human anatomy scope</h3>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">Coverage means the domain is explicitly navigable and mapped to source terms. It does not claim that every microscopic structure has a dedicated HRA mesh.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200">{DOMAINS.length}/{DOMAINS.length} domains catalogued</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DOMAINS.map((item) => (
            <button key={item.key} onClick={() => { setSelectedKey(item.key); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-left hover:border-emerald-300 dark:border-white/10 dark:bg-white/[.025]">
              <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black text-neutral-950 dark:text-white">{item.icon} {item.label}</span><span className="text-[8px] font-black text-emerald-600 dark:text-emerald-300">MAPPED</span></div>
              <div className="mt-1 text-[8px] text-neutral-400">{item.structures.length} must-identify structures · {item.physiology.length} physiology bridges</div>
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}
